# ⚡️ FreeFire Links Checker Bot

A powerful Telegram bot to manage and monitor Free Fire links within your group!  
Easily add, remove, and track the status of important links. Stay informed and keep your group safe and organized.

---

## 🚀 Features

- 🔗 **Add Links:**  
  Use `/add <url>` to add a link to the monitoring list.

- ❌ **Remove Links:**  
  Remove a link by its index: `/rem <index>`

- 📋 **List Links:**  
  Display all tracked links and their current status with `/list`

- 🛡️ **Manual Status Check:**  
  Check all links instantly using `/checker`

- ⏰ **Automatic Monitoring:**  
  Bot checks links every minute. If a previously offline link is now online, you’ll get notified and it will be removed from the list.

- 🧹 **Reset List:**  
  Clear all saved links and statuses with `/reset`

- 🆔 **ID Display:**  
  Use `/jid` to get your Telegram user ID and the group ID.

- 🖼️ **Image Link Support:**  
  If a link is an image, the bot sends notifications as a photo!

---

## ⚙️ How It Works

- Processes only messages from the configured group.
- All link and status data is stored in `links_db.json` (persistent).
- Uses Telegram’s polling method for real-time command handling and updates.

---

## 🗂️ Commands Overview

| Command             | Description                                 |
|---------------------|---------------------------------------------|
| `/add <url>`        | Add a new link to monitor                   |
| `/rem <index>`      | Remove link by its index                    |
| `/list`             | List all monitored links and their status   |
| `/checker`          | Manually check the status of all links      |
| `/reset`            | Remove all saved links                      |
| `/jid`              | Show your user and group ID                 |

---

## 👤 Author & Socials

- **Author:** [MACBRUH-OFC](https://github.com/MACBRUH-OFC)

**Connect with me:**

- 📷 Instagram: [@macbruh_ff](https://instagram.com/macbruh_ff)
- 🎬 YouTube: [@macbruh_ff](https://youtube.com/@macbruh_ff)
- 💬 Telegram: [@macbruhff](https://t.me/macbruhff)

---

**For any queries or suggestions, feel free to reach out on any of the platforms above!**