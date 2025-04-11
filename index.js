const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cron = require('node-cron');

// ⚠️ Token embedded in code (NOT recommended for production)
const bot = new TelegramBot('7993833443:AAFUx5j72aHDqwM5zrLJcMQUAcDoaOREkgc', { polling: true });
const ALLOWED_GROUP_ID = "-4663611744";

let links = [];

// 2-minute checks
cron.schedule('*/2 * * * *', async () => {
  for (const link of [...links]) {
    try {
      await axios.get(link, { timeout: 5000 });
      await bot.sendMessage(
        ALLOWED_GROUP_ID,
        `🔥 WORKING LINK\n${link}\n\nAuto-removed from checks`,
        { disable_web_page_preview: true }
      );
      links = links.filter(l => l !== link);
    } catch {}
  }
});

// Commands
bot.onText(/\/add (.+)/, (msg, match) => {
  if (msg.chat.id.toString() !== ALLOWED_GROUP_ID) return;
  
  const url = match[1].trim();
  if (!url.startsWith('http')) {
    return bot.sendMessage(msg.chat.id, "❌ URL must start with http/https");
  }
  links.push(url);
  bot.sendMessage(msg.chat.id, `✅ Added: ${url}`);
});

bot.onText(/\/list/, (msg) => {
  if (msg.chat.id.toString() !== ALLOWED_GROUP_ID) return;
  bot.sendMessage(msg.chat.id, links.join('\n') || "No links added");
});
