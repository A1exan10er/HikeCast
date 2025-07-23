# HikeCastBot (Google Cloud Functions, Node.js)

A cloud-based notification robot that sends hiking weather updates via Telegram (and stubs for Email/WhatsApp).

## Features
- Multi-location, multi-channel notifications
- User preferences in `users.json`
- Weather data from Open-Meteo (no API key required)
- Telegram notifications (Email/WhatsApp: TODO)

## Setup

1. **Clone the repo and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Rename `.env.example` to `.env` and fill in your Telegram Bot token.
   - Get a Telegram Bot token from [BotFather](https://core.telegram.org/bots#botfather).

3. **Edit `users.json`:**
   - Add users, locations, and their notification channels.
   - Example:
     ```json
     [
       {
         "name": "Alice",
         "locations": ["San Francisco,US", "Yosemite National Park,US"],
         "channels": ["telegram", "email"],
         "telegram_chat_id": "123456789",
         "email": "alice@example.com",
         "whatsapp": "+1234567890"
       }
     ]
     ```
   - To get your Telegram chat ID, message your bot and use [@userinfobot](https://t.me/userinfobot) or similar.

## Deploy to Google Cloud Functions

1. **Set up Google Cloud project and enable Cloud Functions, Cloud Scheduler, and Secret Manager.**
2. **Deploy the function:**
   ```bash
   gcloud functions deploy hikeCastBot \
     --runtime nodejs18 \
     --trigger-http \
     --allow-unauthenticated \
     --set-env-vars TELEGRAM_BOT_TOKEN=your-token
   ```
   Or use Secret Manager for sensitive keys.

3. **Schedule with Cloud Scheduler:**
   - Create a scheduler job to trigger the function URL at your desired time/frequency.
   - Example (every Saturday at 7am):
     ```bash
     gcloud scheduler jobs create http hikecast-job \
       --schedule="0 7 * * 6" \
       --uri="YOUR_FUNCTION_URL" \
       --http-method=GET
     ```

## Extending
- Add Email/WhatsApp support by integrating with SendGrid/Mailgun/Twilio.
- Move user data to Firestore or Google Sheets for dynamic management.

## License
MIT
