const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = parseInt(process.env.GROUP_ID, 10);
const DATA_FILE = path.join(__dirname, 'links_db.json'); // persistent on Fly with attached volume
const MAX_LINKS = 100;

// Ensure the data file exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ links: [], status: {} }, null, 2));

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return { links: [], status: {} };
    }
}
function saveDB(db) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function buildStatusList(links, status) {
    let report = `╭─⚡ ✦Bot By MACBRUH FF ✦\n│\n├ 🔗 <b>CURRENT STATUS</b>\n│\n`;
    if (links.length === 0) {
        report += `<b>No links added. Use /add to add one!</b>\n╰──────────────●`;
        return report;
    }
    links.forEach((link, i) => {
        const num = String(i + 1).padStart(2, "0");
        const url = link.url;
        const isUp = status[url] === "up";
        report += `▫️ <b>[${num}]</b>\n<a href="${url}">${url}</a>\n├─ ${isUp ? '🟢 <b>ONLINE</b>' : '🔴 <b>OFFLINE</b>'}\n│\n`;
    });
    report += "╰──────────────●";
    return report;
}

const bot = new TelegramBot(TOKEN, { polling: true });

// On startup, announce to group
bot.sendMessage(GROUP_ID, '🤖 Link Checker⚡ is now online!').catch(() => {});

bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const replyId = msg.message_id;

    if (chatId !== GROUP_ID) return;
    if (text === '/start') return;

    let db = loadDB();
    let { links, status } = db;

    if (text === '/list') {
        bot.sendMessage(chatId, buildStatusList(links, status), {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_to_message_id: replyId
        });
        return;
    }

    if (text === '/checker') {
        bot.sendMessage(chatId, "Checking link statuses, please wait...", { reply_to_message_id: replyId });
        let statusChanged = false;
        let prevStatus = { ...status };
        for (let link of links) {
            try {
                let res = await fetch(link.url, { method: 'HEAD', redirect: 'follow' });
                status[link.url] = res.ok ? 'up' : 'down';
            } catch {
                status[link.url] = 'down';
            }
        }
        for (let link of links) {
            if (prevStatus[link.url] !== status[link.url]) statusChanged = true;
        }
        saveDB({ links, status });
        bot.sendMessage(chatId, buildStatusList(links, status), {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_to_message_id: replyId
        });
        return;
    }

    if (text.startsWith('/add ')) {
        const url = text.split(' ')[1];
        if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) {
            bot.sendMessage(chatId, '❗️ <b>Invalid Link</b>. Please use a full URL.', {
                parse_mode: "HTML",
                reply_to_message_id: replyId
            });
            return;
        }
        const index = links.findIndex(l => l.url === url);
        if (index !== -1) {
            bot.sendMessage(
                chatId,
                `❗️ This link already exists at [${String(index+1).padStart(2, "0")}]:\n${url}`,
                { parse_mode: "HTML", reply_to_message_id: replyId }
            );
            return;
        } else if (links.length >= MAX_LINKS) {
            bot.sendMessage(chatId, `❗️ <b>List full</b>. Remove a link to add more.`, {
                parse_mode: "HTML",
                reply_to_message_id: replyId
            });
            return;
        }
        links.push({ url });
        saveDB({ links, status });
        bot.sendMessage(
            chatId,
            `✅ Link added as [${String(links.length).padStart(2,"0")}]:\n${url}`,
            { parse_mode: "HTML", reply_to_message_id: replyId }
        );
        return;
    }

    if (text.startsWith('/rem ')) {
        const index = parseInt(text.split(' ')[1]) - 1;
        if (!isNaN(index) && links[index]) {
            const removedLink = links.splice(index, 1)[0];
            saveDB({ links, status });
            bot.sendMessage(
                chatId,
                `🗑️ Removed link [${String(index+1).padStart(2,"0")}]:\n${removedLink.url}`,
                { parse_mode: "HTML", reply_to_message_id: replyId }
            );
        } else {
            bot.sendMessage(chatId, '❗️ <b>Invalid index</b>. Use a valid link index to remove.', {
                parse_mode: "HTML",
                reply_to_message_id: replyId
            });
        }
        return;
    }

    if (text === '/reset') {
        saveDB({ links: [], status: {} });
        bot.sendMessage(chatId, '✅ All saved links and their status have been reset (cleared).', {
            reply_to_message_id: replyId
        });
        return;
    }

    if (text.startsWith('/jid')) {
        bot.sendMessage(
            chatId,
            `<b>Your Jid:</b> <code>${msg.from.id}</code>\n<b>Group Jid:</b> <code>${chatId}</code>`,
            { parse_mode: "HTML", reply_to_message_id: replyId }
        );
        return;
    }
});

// Periodically check links
setInterval(async () => {
    let db = loadDB();
    let { links, status: prevStatus } = db;
    let currStatus = { ...prevStatus };
    let upLinks = [];
    for (let link of links) {
        try {
            let res = await fetch(link.url, { method: 'HEAD', redirect: 'follow' });
            currStatus[link.url] = res.ok ? 'up' : 'down';
        } catch {
            currStatus[link.url] = 'down';
        }
    }
    // Find links that were down and are now up
    for (let link of links) {
        if (prevStatus[link.url] === 'down' && currStatus[link.url] === 'up') {
            upLinks.push(link);
        }
    }
    // Remove up links and announce
    if (upLinks.length > 0) {
        links = links.filter(link => !upLinks.some(up => up.url === link.url));
        saveDB({ links, status: currStatus });
        for (let link of upLinks) {
            if (isImage(link.url)) {
                bot.sendPhoto(GROUP_ID, link.url, { caption: `🟢 LINK ONLINE & REMOVED FROM LIST! ✅\n${link.url}` });
            } else {
                bot.sendMessage(
                    GROUP_ID,
                    `🟢 LINK ONLINE & REMOVED FROM LIST! ✅\n<a href="${link.url}">${link.url}</a>`,
                    { parse_mode: "HTML" }
                );
            }
        }
    } else {
        saveDB({ links, status: currStatus });
    }
}, 60000); // every 60 seconds
