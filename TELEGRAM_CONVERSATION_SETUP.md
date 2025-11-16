# Telegram Conversation Feature Setup Guide

This guide will help you set up two-way communication between HikeCast bot and your users on Telegram.

## Overview

Users can now:
- Ask weather questions in natural language
- Use commands like `/start`, `/help`, `/status`
- Get AI-powered responses to their queries
- Receive contextual weather information

## Prerequisites

1. Your HikeCast application must be deployed to a **publicly accessible URL** (e.g., Render, Heroku, AWS, etc.)
2. The URL must use **HTTPS** (Telegram requires HTTPS for webhooks)
3. You need your `TELEGRAM_BOT_TOKEN` from @BotFather

## Setup Steps

### 1. Add Environment Variable

Add this to your `.env` file or deployment environment:

```bash
WEBHOOK_URL=https://your-app-domain.com
```

Replace `your-app-domain.com` with your actual deployment URL.

### 2. Deploy Your Application

Deploy the updated code to your hosting platform:

```bash
git add .
git commit -m "Add two-way Telegram conversation feature"
git push
```

Wait for the deployment to complete.

### 3. Register the Webhook with Telegram

#### Option A: Using curl

```bash
curl -X POST https://your-app-domain.com/setup-telegram-webhook \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-app-domain.com"}'
```

#### Option B: Using PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "https://your-app-domain.com/setup-telegram-webhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"webhookUrl": "https://your-app-domain.com"}'
```

#### Option C: Using Browser/Postman

Send a POST request to:
```
https://your-app-domain.com/setup-telegram-webhook
```

With JSON body:
```json
{
  "webhookUrl": "https://your-app-domain.com"
}
```

### 4. Verify Webhook Setup

Check if the webhook is configured correctly:

```bash
curl https://your-app-domain.com/telegram-webhook-info
```

You should see output showing your webhook URL is registered.

## Testing the Feature

### 1. Start a Conversation

Open Telegram and find your bot. Send:

```
/start
```

You should receive a welcome message.

### 2. Try Commands

```
/help     - See available commands and features
/status   - Check your notification settings
```

### 3. Ask Weather Questions

Try natural language queries:

```
What's the weather in Stuttgart?
Will it rain tomorrow in Munich?
Hiking conditions for Berlin this weekend
What's the temperature in Hamburg?
```

### 4. General Questions

The bot will respond to general queries and guide users back to weather topics:

```
Hello
What can you do?
Tell me about hiking
```

## How It Works

### Message Flow

1. User sends message to bot on Telegram
2. Telegram forwards message to `/telegram-webhook` endpoint
3. `conversationService.js` processes the message:
   - Detects commands (`/start`, `/help`, `/status`)
   - Identifies weather queries (keywords like "weather", "rain", etc.)
   - Uses AI for contextual responses
4. Response is sent back to user via Telegram API

### Weather Query Processing

When a user asks about weather:
1. Location is extracted from query (e.g., "in Stuttgart")
2. If no location specified, uses user's saved location from database
3. Fetches weather data using `weatherService.js`
4. Generates natural response using Gemini AI
5. Sends formatted response to user

### AI-Powered Responses

The bot uses Google's Gemini AI to:
- Answer weather questions contextually
- Provide conversational, friendly responses
- Guide users to relevant features
- Handle general queries intelligently

## Troubleshooting

### Webhook Not Receiving Messages

1. **Check webhook status:**
   ```bash
   curl https://your-app-domain.com/telegram-webhook-info
   ```

2. **Verify URL is HTTPS:**
   Telegram requires HTTPS. HTTP won't work.

3. **Check application logs:**
   Look for "📨 Telegram webhook received" messages

4. **Re-register webhook:**
   Run the setup command again

### Bot Not Responding

1. **Check `TELEGRAM_BOT_TOKEN`:**
   Ensure it's set correctly in environment variables

2. **Verify `GEMINI_API_KEY`:**
   AI responses need this key

3. **Check logs for errors:**
   Look for "❌ Error handling Telegram webhook" messages

### Location Not Detected

If the bot can't find location in query:
1. Use explicit location: "What's the weather **in Berlin**?"
2. Set up default locations in dashboard
3. User's first saved location will be used as default

### Webhook Setup Fails

If you get errors when setting up webhook:

1. **400 Error:** Check if `TELEGRAM_BOT_TOKEN` is set
2. **Network Error:** Verify your deployment URL is accessible
3. **Invalid URL:** Ensure using HTTPS and correct domain

## Environment Variables Required

```bash
# Required for conversation feature
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
WEBHOOK_URL=https://your-app-domain.com

# Optional (existing)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## Features by Command

### `/start` or `/help`
Shows welcome message and available features:
- How to ask weather questions
- Available commands
- How to manage settings

### `/status`
Shows user's current settings:
- Saved locations
- Notification channels
- Schedule and timezone
- AI analysis status
- Extreme weather alerts status

### Weather Queries
Natural language processing for questions like:
- "What's the weather in [city]?"
- "Will it rain tomorrow in [city]?"
- "Hiking conditions for [city] this weekend"
- "Temperature in [city]"
- "Is it sunny in [city]?"

### General Queries
AI responds to general questions and guides users:
- Greetings
- Questions about capabilities
- Non-weather topics (politely redirects)

## API Endpoints Added

### `POST /telegram-webhook`
Receives incoming messages from Telegram.
- Processes user messages
- Generates responses
- Sends replies back to users

### `POST /setup-telegram-webhook`
Registers webhook URL with Telegram.
- Body: `{ "webhookUrl": "https://your-domain.com" }`
- Or uses `WEBHOOK_URL` environment variable

### `GET /telegram-webhook-info`
Retrieves current webhook configuration from Telegram.
- Shows registered webhook URL
- Shows last error if any
- Shows pending update count

## Security Considerations

1. **HTTPS Required:** Telegram only accepts HTTPS webhooks
2. **Token Security:** Keep `TELEGRAM_BOT_TOKEN` secret
3. **Rate Limiting:** Consider adding rate limits for webhook endpoint
4. **Input Validation:** Messages are validated before processing

## Next Steps

After setup is complete:

1. **Test thoroughly** with different types of queries
2. **Monitor logs** for any errors or issues
3. **Inform users** about the new conversation feature
4. **Update dashboard** to mention conversation capabilities

## Support

If you encounter issues:

1. Check application logs
2. Review Telegram webhook info
3. Verify all environment variables are set
4. Ensure deployment is accessible via HTTPS
5. Test with simple commands first (`/start`)

## Example Conversation

```
User: /start
Bot: 🏔️ HikeCast Weather Bot - Help
     [Shows full help message]

User: What's the weather in Stuttgart?
Bot: 📍 Stuttgart, Germany
     
     Currently it's 12°C with clear skies. 
     Perfect conditions for a hike! 
     Winds are light at 8 km/h.

User: /status
Bot: ⚙️ Your HikeCast Settings
     
     📍 Locations: Stuttgart, Munich
     📱 Channels: telegram
     📅 Schedule: 0 7 * * *
     [Shows all settings]
```

Enjoy the new two-way conversation feature! 🎉
