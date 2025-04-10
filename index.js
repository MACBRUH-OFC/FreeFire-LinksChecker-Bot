const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron');

// Config
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ALLOWED_GROUP_ID = "-4663611744"; // Your group ID
const CHECK_INTERVAL = '*/2 * * * *'; // Every 2 minutes

let monitoredLinks = [];

// Premium Status Symbols
const STATUS = {
  WORKING: '🌟',  // Working link
  DEAD: '▫️',     // Non-working (subtle symbol)
  ERROR: '🚫'     // Error
};

// Secure Group Check
function isAllowedGroup(msg) {
  if (msg.chat.id.toString() !== ALLOWED_GROUP_ID) {
    bot.sendMessage(msg.chat.id, "🔒 Bot disabled in this chat");
    return false;
  }
  return true;
}

// 2-Minute Link Checks
cron.schedule(CHECK_INTERVAL, async () => {
  for (const link of [...monitoredLinks]) {
    try {
      await axios.get(link, { timeout: 8000 });
      await bot.sendMessage(
        ALLOWED_GROUP_ID,
        `${STATUS.WORKING} LINK ACTIVE\n${link}\n\nAuto-removing from checks.`,
        { disable_web_page_preview: true }
      );
      monitoredLinks = monitoredLinks.filter(l => l !== link);
    } catch {
      // Silent for non-working links
    }
  }
});

// Commands
bot.onText(/\/add (.+)/, (msg, match) => {
  if (!isAllowedGroup(msg)) return;

  const url = match[1].trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(msg.chat.id, `${STATUS.ERROR} Invalid URL format`);
  }

  if (!monitoredLinks.includes(url)) {
    monitoredLinks.push(url);
    bot.sendMessage(msg.chat.id, `${STATUS.WORKING} Added:\n${url}`);
  }
});

bot.onText(/\/list/, (msg) => {
  if (!isAllowedGroup(msg)) return;

  const response = monitoredLinks.length
    ? `📊 Monitored Links (${monitoredLinks.length}):\n\n` +
      monitoredLinks.map((link, idx) => `${idx}. ${link}`).join('\n\n')
    : STATUS.DEAD + " No links being monitored";

  bot.sendMessage(msg.chat.id, response, { disable_web_page_preview: true });
});

bot.onText(/\/remove (\d+)/, (msg, match) => {
  if (!isAllowedGroup(msg)) return;

  const index = parseInt(match[1]);
  if (index >= 0 && index < monitoredLinks.length) {
    const removed = monitoredLinks.splice(index, 1)[0];
    bot.sendMessage(msg.chat.id, `🗑️ Removed:\n${removed}`);
  }
});