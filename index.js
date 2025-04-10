const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

// Config
const bot = new TelegramBot(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_GROUP_ID = "-4663611744"; // Your private group ID
const DOMAIN = "https://macbruhlinkschecker-bot.vercel.app"; // Your custom domain

let monitoredLinks = [];

// Middleware
app.use(express.json());

// Webhook Handler
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Scheduled Checks (2-minute intervals)
cron.schedule('*/2 * * * *', async () => {
  for (const link of [...monitoredLinks]) {
    try {
      await axios.get(link, { timeout: 8000 });
      await bot.sendMessage(
        ALLOWED_GROUP_ID,
        `🌟 WORKING LINK DETECTED\n${link}\n\nAuto-removing from checks.`,
        { disable_web_page_preview: true }
      );
      monitoredLinks = monitoredLinks.filter(l => l !== link);
    } catch {
      // Silent for non-working links
    }
  }
});

// Command: Add Link
bot.onText(/\/add (.+)/, (msg, match) => {
  if (msg.chat.id.toString() !== ALLOWED_GROUP_ID) return;

  const url = match[1].trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(msg.chat.id, "🚫 Invalid URL - must start with http/https");
  }

  if (!monitoredLinks.includes(url)) {
    monitoredLinks.push(url);
    bot.sendMessage(msg.chat.id, `✅ Added:\n${url}`);
  }
});

// Command: List Links
bot.onText(/\/list/, (msg) => {
  if (msg.chat.id.toString() !== ALLOWED_GROUP_ID) return;

  const response = monitoredLinks.length
    ? `📋 Monitored Links:\n\n${monitoredLinks.map((l, i) => `${i}. ${l}`).join('\n')}`
    : "No links being monitored";

  bot.sendMessage(msg.chat.id, response, { disable_web_page_preview: true });
});

// Start Server
app.listen(PORT, async () => {
  await bot.setWebHook(`${DOMAIN}/webhook`);
  console.log(`Bot webhook set at: ${DOMAIN}/webhook`);
});