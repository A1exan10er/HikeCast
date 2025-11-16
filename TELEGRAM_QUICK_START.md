# Telegram Conversation - Quick Setup Guide

## 🎯 Choose Your Setup Method

### Option 1: Polling Mode (Easiest - For Local Testing) ⭐

**Use this if you're running locally or testing**

1. **Set your environment variables:**
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Look for this message:**
   ```
   🔄 Starting Telegram polling mode (local development)...
   ✅ Cleared any existing webhook
   ```

4. **Test it:** Open Telegram and message your bot!

**That's it!** No webhook setup, no public URL needed.

---

### Option 2: Webhook Mode (For Production)

**Use this if you have a deployed app with HTTPS**

1. **Set environment variables:**
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   WEBHOOK_URL=https://your-app-domain.com
   ```

2. **Deploy your app**

3. **Register the webhook:**
   ```bash
   curl -X POST https://your-app-domain.com/setup-telegram-webhook \
     -H "Content-Type: application/json" \
     -d '{"webhookUrl": "https://your-app-domain.com"}'
   ```

4. **Verify it worked:**
   ```bash
   curl https://your-app-domain.com/telegram-webhook-info
   ```

---

## 🧪 Testing

Send these messages to your bot on Telegram:

```
/start          → Welcome message
/help           → List of commands
/status         → Your settings
What's the weather in Stuttgart?  → Weather info
```

## 🐛 Troubleshooting

### Bot Not Responding (Polling Mode)

1. **Check the logs** - Look for "💬 Message from..." in console
2. **Verify token** - Make sure `TELEGRAM_BOT_TOKEN` is correct
3. **Check for errors** - Look for "❌" in the console output
4. **Restart the server** - Stop and start `npm start` again

### Bot Not Responding (Webhook Mode)

1. **Check webhook status:**
   ```bash
   curl https://your-app-domain.com/telegram-webhook-info
   ```

2. **Re-register webhook:**
   ```bash
   curl -X POST https://your-app-domain.com/setup-telegram-webhook \
     -H "Content-Type: application/json" \
     -d '{"webhookUrl": "https://your-app-domain.com"}'
   ```

3. **Verify HTTPS** - Telegram requires HTTPS for webhooks

### Common Issues

**"TELEGRAM_BOT_TOKEN not set"**
- Add `TELEGRAM_BOT_TOKEN=your_token` to `.env` file

**"Error generating AI response"**
- Check `GEMINI_API_KEY` is set correctly
- Bot will still respond with basic weather info

**Long delays in responses**
- Normal for polling mode (up to 30 seconds)
- Use webhook mode for instant responses

---

## 📋 Full Setup Reference

See `TELEGRAM_CONVERSATION_SETUP.md` for complete details including:
- Architecture diagrams
- API endpoints
- Security considerations
- Advanced configuration

---

## 🎉 Success!

Your bot should now respond to messages. Try it out:

1. Open Telegram
2. Find your bot
3. Send: `/start`
4. Enjoy chatting! 💬
