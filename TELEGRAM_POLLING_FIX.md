# Telegram Bot Fix - Polling Mode Implementation

## Problem

The bot wasn't responding to user messages on Telegram.

## Root Cause

The original implementation only supported **webhook mode**, which requires:
- A publicly accessible HTTPS URL
- Webhook registration with Telegram
- Cannot work on localhost/local development

This made it impossible to test the conversation feature locally.

## Solution

Added **polling mode** as an alternative for local development and testing.

### What is Polling Mode?

Instead of Telegram pushing messages to your server (webhook), your server actively asks Telegram "do you have any new messages?" every few seconds.

**Advantages:**
- ✅ Works on localhost
- ✅ No HTTPS required
- ✅ No webhook setup needed
- ✅ Automatic mode detection

**Disadvantages:**
- Uses more resources (constant requests)
- Slightly slower (up to 30 second delay)
- Not recommended for production

## Changes Made

### 1. New File: `services/telegramPollingService.js`

Created a new service that:
- Polls Telegram API for new messages using long polling
- Automatically clears any existing webhooks on startup
- Handles incoming messages and routes to conversation service
- Includes error handling and automatic retry logic

### 2. Modified: `index.js`

Added automatic mode detection:
```javascript
// Automatically choose between polling and webhook mode
if (!process.env.WEBHOOK_URL || process.env.USE_POLLING === 'true') {
  // Local development: Use polling
  startPolling();
} else {
  // Production: Use webhooks
  console.log('Webhook mode enabled');
}
```

### 3. Updated: `.env.example`

Added configuration options:
```bash
# For local development: Leave WEBHOOK_URL commented out
# For production: Set WEBHOOK_URL to your public HTTPS URL
# WEBHOOK_URL=https://your-app-domain.com
# USE_POLLING=true  # Force polling mode
```

### 4. New Documentation: `TELEGRAM_QUICK_START.md`

Simple guide showing both setup methods.

## How to Use

### For Local Development (Most Common)

1. **Just start the server:**
   ```bash
   npm start
   ```

2. **Look for this in logs:**
   ```
   🔄 Starting Telegram polling mode (local development)...
   ✅ Cleared any existing webhook
   ```

3. **Message your bot on Telegram** - it will respond!

### For Production Deployment

1. **Set environment variable:**
   ```bash
   WEBHOOK_URL=https://your-app.com
   ```

2. **Deploy and register webhook:**
   ```bash
   curl -X POST https://your-app.com/setup-telegram-webhook \
     -d '{"webhookUrl": "https://your-app.com"}'
   ```

## Testing

Run the test script:
```bash
node tests/test_telegram_conversation.js
```

Or simply:
1. Start server: `npm start`
2. Open Telegram
3. Message your bot: `/start`
4. Check server logs for: `💬 Message from...`

## What to Expect

### In Server Logs:
```
🔄 Starting Telegram polling mode (local development)...
✅ Cleared any existing webhook
💬 Message from 123456789 (John): /start
✅ Response sent to 123456789
```

### In Telegram:
```
You: /start

Bot: 🏔️ HikeCast Weather Bot - Help

I can help you with:
...
```

## Troubleshooting

### Bot still not responding?

1. **Check logs** - Look for errors with ❌
2. **Verify TELEGRAM_BOT_TOKEN** - Make sure it's set in `.env`
3. **Check GEMINI_API_KEY** - Needed for AI responses
4. **Restart server** - Stop and start `npm start` again

### How to verify polling is working:

Look for these log messages:
- `🔄 Starting Telegram polling mode`
- `✅ Cleared any existing webhook`
- `💬 Message from ...` (when you send a message)

### Common errors:

**"TELEGRAM_BOT_TOKEN not set"**
- Solution: Add to `.env` file

**"Polling error: ..."**
- Usually timeout (normal for long polling)
- If persistent, check your bot token

**"Error handling message: ..."**
- Check if GEMINI_API_KEY is set
- Review full error in logs

## Architecture

### Polling Mode Flow:
```
Server starts
    ↓
Delete webhook (clear previous setup)
    ↓
Start polling loop
    ↓
GET /getUpdates (every 30 seconds)
    ↓
New message? → handleUserMessage() → sendTelegram()
    ↓
Repeat
```

### Webhook Mode Flow:
```
Server starts
    ↓
Wait for webhook registration
    ↓
Telegram POST /telegram-webhook (when user sends message)
    ↓
handleUserMessage() → sendTelegram()
```

## Files Modified

- ✅ `index.js` - Added polling mode support
- ✅ `services/telegramPollingService.js` - NEW polling service
- ✅ `.env.example` - Added polling configuration
- ✅ `TELEGRAM_QUICK_START.md` - NEW quick start guide
- ✅ `tests/test_telegram_conversation.js` - NEW test script

## Migration Notes

### Existing Users

If you already have webhooks set up:
- Polling mode will automatically clear them
- Switch back to webhook mode by setting `WEBHOOK_URL`

### Switching Modes

**Polling → Webhook:**
1. Set `WEBHOOK_URL` in environment
2. Restart server
3. Register webhook via `/setup-telegram-webhook`

**Webhook → Polling:**
1. Remove/comment `WEBHOOK_URL` from environment
2. Restart server
3. Polling starts automatically

## Performance Considerations

### Polling Mode
- Resource usage: Medium (constant API requests)
- Response time: 0-30 seconds
- Best for: Development, testing, low traffic

### Webhook Mode
- Resource usage: Low (only on messages)
- Response time: Instant (<1 second)
- Best for: Production, high traffic

## Recommendations

- 🏠 **Local Development**: Use polling mode
- 🚀 **Production**: Use webhook mode
- 🧪 **Testing**: Use polling mode (easier setup)
- 📊 **High Traffic**: Use webhook mode (better performance)

---

## Summary

The bot now works out-of-the-box for local development with **zero configuration** beyond the bot token. Simply start the server and message your bot!

For production deployments, webhook mode is still available and recommended for better performance.

**Both modes use the same conversation service** - the only difference is how messages are received from Telegram.
