# HikeCastBot (Node.js, Render, Express, node-cron)

A cloud-based notification robot that sends hiking weather updates via Telegram, Email, and (optionally) WhatsApp. Now runs as a persistent web service with per-user scheduled notifications.

## Features
- Multi-location, multi-channel notifications
- Per-user scheduling (cron format)
- User preferences in `users.json` (not tracked in git)
- Example user data in `users.example.json`
- Weather data from Open-Meteo (no API key required)
- Telegram and Email notifications (WhatsApp: optional)
- Deployable as a Web Service on [Render](https://render.com/)
- **Health endpoint** for uptime monitoring and keeping the service warm

## Notification Channels Status

### ✅ Telegram
- Fully configured and working
- Real-time weather data delivery
- Markdown formatting support

### ✅ Email  
- Fully configured and working
- Gmail SMTP with app password
- HTML formatted messages

### ⚠️ WhatsApp (Partial Configuration)
- **Status**: Permanent API access token configured
- **Current**: Can send `hello_world` template messages only
- **Limitations**: 
  - Meta rate limits for adding test phone numbers
  - Custom weather template approval needed for actual weather data
  - Currently limited to verified test numbers only

**WhatsApp Setup Progress:**
- [x] Meta Developer Account created
- [x] WhatsApp Business App configured  
- [x] System User with permanent token generated
- [x] Webhook endpoints implemented (`/webhook`)
- [ ] Test phone number verification (Meta rate limited)
- [ ] Custom weather message template creation & approval
- [ ] Production app review (for unrestricted messaging)

## Setup

1. **Clone the repo and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your secrets:
     - `TELEGRAM_BOT_TOKEN` (Telegram Bot)
     - `GMAIL_USER` and `GMAIL_PASS` (Gmail SMTP, App Password)
     - (Optional) WhatsApp Cloud API variables:
       - `WHATSAPP_ACCESS_TOKEN` (System User Token - Permanent)
       - `WHATSAPP_PHONE_NUMBER_ID` (Phone Number ID from Meta)
       - `WHATSAPP_VERIFY_TOKEN` (Webhook verification token)

3. **Prepare user data:**
   - Copy `users.example.json` to `users.json` and edit with your real user/location/channel/schedule info.
   - **Do NOT commit `users.json` to git!** It is in `.gitignore` for privacy.

4. **Run locally:**
   ```bash
   npm start
   # Visit http://localhost:3000 to check status
   # Notifications will be sent at the times specified in each user's schedule
   # Visit http://localhost:3000/health to check the health endpoint
   ```

## Deployment (Render Web Service)

1. **Push your code to GitHub.**
2. **Create a new Web Service on [Render](https://render.com/):**
   - Connect your GitHub repo.
   - Set the start command to `npm start`.
   - Add your environment variables in the Render dashboard.
   - After deploy, upload your real `users.json` via the Render dashboard (or use a Render Secret/File).
3. **Your bot will now send notifications at the times specified in each user's `schedule`!**

## Health Endpoint & Keeping the Service Warm

- The bot exposes a `/health` endpoint:
  - Example: `https://your-app-name.onrender.com/health`
  - Returns a JSON status and timestamp.
- **Why is this important?**
  - Free Render web services "sleep" after 15 minutes of inactivity, which can delay scheduled notifications.
  - To keep your service "warm" and ensure scheduled jobs run on time, use an external service (like UptimeRobot) to ping the `/health` endpoint every 5 minutes.

### Example `/health` response
```json
{
  "status": "ok",
  "time": "2025-07-23T12:34:56.789Z"
}
```

### How to set up UptimeRobot
1. Sign up at [UptimeRobot](https://uptimerobot.com/).
2. Add a new HTTP(s) monitor for your `/health` endpoint.
3. Set the interval to 5 minutes (free tier minimum).
4. This will keep your service awake and your scheduled notifications reliable.

## API Endpoints

- `GET /` - Service status and information
- `GET /health` - Health check for uptime monitoring  
- `GET /test-notify` - Send test notifications to all users
- `GET /webhook` - WhatsApp webhook verification endpoint
- `POST /webhook` - WhatsApp message receiver endpoint

## User Data Example
See `users.example.json` for the required structure:
```json
[
  {
    "name": "SampleUser",
    "locations": ["Sample City,Country"],
    "channels": ["telegram", "email", "whatsapp"],
    "telegram_chat_id": "123456789",
    "email": "sampleuser@example.com",
    "whatsapp": "+10000000000",
    "schedule": "0 7 * * 6",
    "timezone": "America/New_York"
  }
]
```

## Security & Privacy
- **users.json** is in `.gitignore` and should never be committed to a public repo.
- Store secrets (API keys, passwords) in environment variables, not in code.
- WhatsApp webhook endpoints include verification for security.

## WhatsApp Configuration Notes

### Current Limitations:
- Only `hello_world` template messages work currently
- Cannot send custom weather data until template approval
- Limited to Meta-verified test phone numbers
- Meta has rate limits for adding new test numbers

### For Full WhatsApp Functionality:
1. **Create Custom Weather Template** in Meta Business Manager
2. **Submit for Template Approval** (24-48 hours)
3. **Add Test Phone Numbers** (when Meta limits allow)
4. **Production App Review** (for messaging any number)

## Extending
- Add WhatsApp support by integrating with the WhatsApp Cloud API.
- Move user data to a database for dynamic management.
- Add a web UI for user management.

## License
MIT
