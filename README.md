# HikeCastBot 🏔️ - AI-Powered Hiking Weather Notifications

A cloud-based notification bot that sends intelligent hiking weather updates via Telegram, Email, and (optionally) WhatsApp. Features AI-powered weather analysis using Google's Gemini AI to provide personalized hiking recommendations and **extreme weather alerts**.

## ✨ Features

### 🤖 AI-Powered Analysis
- **Gemini AI Integration**: Advanced weather analysis with hiking-specific recommendations
- **Smart Suggestions**: Hiking suitability ratings, gear recommendations, and safety warnings
- **Alternative Activities**: Suggestions for indoor/outdoor alternatives when hiking isn't ideal

### 🚨 Extreme Weather Alerts
- **Automatic Monitoring**: Continuous monitoring for dangerous weather conditions
- **Real-Time Alerts**: Immediate notifications for extreme weather events
- **Safety Prioritized**: Critical alerts sent to all channels regardless of user preferences
- **AI Safety Analysis**: Gemini AI provides emergency safety recommendations

### 📱 Multi-Channel Notifications
- **Telegram**: Real-time notifications with Markdown formatting
- **Email**: HTML-formatted messages via Gmail SMTP
- **WhatsApp**: Template-based messages (limited functionality)

### ⚙️ Advanced Scheduling
- **Per-User Scheduling**: Customizable cron-based notification times
- **Timezone Support**: Notifications sent in user's local timezone
- **Multi-Location**: Monitor weather for multiple hiking destinations
- **Multi-Day Forecasts**: Get forecasts for specific days of the week

### 🌤️ Comprehensive Weather Data
- **Open-Meteo API**: Reliable weather data without API key requirements
- **7-Day Forecasts**: Support for up to 7 days ahead
- **Current Conditions**: Real-time weather monitoring
- **Detailed Metrics**: Temperature, precipitation, wind, weather conditions
- **Human-Readable**: Weather codes converted to descriptive text

## 🚨 Extreme Weather Monitoring

### Alert Triggers
**CRITICAL SEVERITY:**
- Temperature ≥ 35°C (Extreme Heat)
- Temperature ≤ -10°C (Extreme Cold)
- Precipitation ≥ 50mm/day (Extreme Rain)
- Dangerous conditions: Thunderstorms, Heavy Rain/Snow, Violent Showers

**HIGH SEVERITY:**
- Temperature 30-34°C (Heat Warning)
- Temperature -9 to 0°C (Cold Warning)
- Precipitation 20-49mm/day (Heavy Rain)
- Severe conditions: Moderate Rain/Snow, Dense Fog
- Heat/Cold waves (3+ consecutive days)

### Alert Features
- **Automatic Detection**: Checks every 2 hours
- **Immediate Notifications**: Critical alerts sent instantly
- **Multi-Day Analysis**: Patterns and consecutive extreme days
- **AI Safety Guidance**: Emergency preparedness recommendations
- **Override User Preferences**: Critical alerts sent to all channels

### Sample Extreme Weather Alert
```
🚨 EXTREME WEATHER ALERT 🚨
📍 Location: Stuttgart, Germany
⏰ Alert Time: Dec 15, 2024, 3:30 PM

🔴 CRITICAL ALERTS:
• 🌊 EXTREME RAIN WARNING Tomorrow: 65mm expected - Flash flood risk
• ⚠️ DANGEROUS CONDITIONS Tomorrow: Thunderstorm with heavy hail - Hiking PROHIBITED

🤖 AI Safety Analysis:
IMMEDIATE ACTION REQUIRED: Seek indoor shelter immediately. 
This thunderstorm poses serious risk of lightning strikes and flash flooding...

⚠️ SAFETY RECOMMENDATIONS:
• Cancel all outdoor activities
• Stay indoors and monitor weather updates
• Prepare emergency supplies
• Avoid travel unless absolutely necessary
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Gmail account with App Password
- Telegram Bot Token
- Google Gemini API Key
- (Optional) WhatsApp Business API access

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd HikeCast
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and credentials
   ```

3. **Set up user preferences:**
   ```bash
   cp users.example.json users.json
   # Edit users.json with your locations and notification preferences
   ```

4. **Run the application:**
   ```bash
   npm start
   # Visit http://localhost:3000 to check status
   ```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Required
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-gmail-app-password
GEMINI_API_KEY=your-gemini-api-key

# Optional (WhatsApp)
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

### User Configuration (users.json)

#### Multi-Day Forecast (Recommended)
```json
[
  {
    "name": "Your Name",
    "locations": ["Stuttgart, Germany", "Munich, Germany"],
    "channels": ["telegram", "email"],
    "telegram_chat_id": "123456789",
    "email": "your-email@example.com",
    "whatsapp": "+1234567890",
    "schedule": "0 7,18 * * *",
    "timezone": "Europe/Berlin",
    "forecastDays": ["Friday", "Saturday", "Sunday"]
  }
]
```

#### Single Day Forecast (Legacy Support)
```json
[
  {
    "name": "Your Name",
    "locations": ["Stuttgart, Germany"],
    "channels": ["telegram", "email"],
    "telegram_chat_id": "123456789",
    "email": "your-email@example.com",
    "schedule": "0 7 * * *",
    "timezone": "Europe/Berlin",
    "forecastDay": 1
  }
]
```

#### Forecast Day Options
- **forecastDays**: Array of day names for multi-day forecasts
  - Valid values: `["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]`
  - Example: `["Friday", "Saturday", "Sunday"]` for weekend hiking
  - Example: `["Saturday"]` for Saturday-only forecasts

- **forecastDay**: Single day index (legacy format)
  - `0` = Today
  - `1` = Tomorrow
  - `2` = Day after tomorrow, etc.

#### Schedule Format (Cron)
- `0 7 * * *` - Daily at 7:00 AM
- `0 7,18 * * *` - Daily at 7:00 AM and 6:00 PM
- `0 7 * * 1-5` - Weekdays at 7:00 AM
- `0 8 * * 6,0` - Weekends at 8:00 AM

## 🤖 AI Features

### Regular Weather Analysis
1. **Hiking Suitability Rating** (1-10 scale)
2. **Gear Recommendations** (clothing, equipment)
3. **Optimal Timing** (best hours for hiking)
4. **Safety Warnings** (weather-related risks)
5. **Alternative Activities** (when hiking isn't recommended)

### Sample Multi-Day Output:
```
🏔️ Hiking Weather for Stuttgart, Germany

📅 Friday, Dec 15, 2024 (Tomorrow):
🌡️ Temperature: 8°C / 2°C
🌧️ Precipitation: 0.2mm
☁️ Conditions: Partly cloudy

🤖 AI Analysis for Friday:
Hiking Suitability: 8/10
Great conditions for hiking with cool temperatures...

────────────────────────────────────────

📅 Saturday, Dec 16, 2024 (Day +2):
🌡️ Temperature: 12°C / 4°C
🌧️ Precipitation: 0mm
☁️ Conditions: Clear sky

🤖 AI Analysis for Saturday:
Hiking Suitability: 10/10
Perfect hiking conditions! Clear skies and mild temperatures...
```

## 🌐 Deployment

### Render Web Service
1. **Push to GitHub**
2. **Create Render Web Service:**
   - Connect your repository
   - Set start command: `npm start`
   - Add environment variables
   - Upload your `users.json` file
3. **Keep Service Warm:**
   - Use UptimeRobot to ping `/health` endpoint every 5 minutes
   - Prevents free tier services from sleeping

### Health Monitoring
- **Endpoint**: `GET /health`
- **Response**: `{"status": "ok", "time": "2024-01-01T00:00:00.000Z"}`
- **Purpose**: Keep service active and monitor uptime

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service status |
| `/health` | GET | Health check for monitoring |
| `/test-notify` | GET | Send test notifications |
| `/webhook` | GET | WhatsApp webhook verification |
| `/webhook` | POST | WhatsApp message receiver |

## 📱 Notification Channels Status

### ✅ Telegram - Fully Functional
- Real-time delivery
- Markdown formatting
- Emoji support
- Error handling
- Multi-day forecast support
- **Extreme weather alerts**

### ✅ Email - Fully Functional  
- Gmail SMTP integration
- HTML formatting
- Reliable delivery
- Attachment support
- Multi-day forecast support
- **Extreme weather alerts**

### 🚧 WhatsApp - Work in Progress
**Current Status:**
- ✅ API configured with permanent token
- ✅ Template message sending (`hello_world`)
- 🚧 Custom weather messages (requires template approval)
- 🚧 Unrestricted messaging (requires app review)
- ❌ Extreme weather alerts (template limitations)

**Development Progress:**
- [x] Meta Developer Account created
- [x] WhatsApp Business App configured  
- [x] System User with permanent token generated
- [x] Webhook endpoints implemented (`/webhook`)
- [ ] Test phone number verification (Meta rate limited)
- [ ] Custom weather message template creation & approval
- [ ] Production app review (for unrestricted messaging)

**Current Limitations:**
- Only verified test numbers
- Template messages only
- Meta rate limits for test numbers
- No custom weather data until template approval

**Note:** WhatsApp functionality is temporarily commented out in the code due to Meta API limitations. Once template approval is completed, full weather notifications will be available.

## 🔐 Security & Privacy

- **Sensitive Data**: `users.json` and `.env` excluded from git
- **API Keys**: Stored as environment variables
- **Webhook Security**: Token verification for WhatsApp
- **Error Handling**: Graceful fallbacks for API failures
- **Safety First**: Critical alerts override user preferences

## 🛠️ Development

### Adding New Features
```javascript
// Example: Add new weather parameter
async function analyzeWeatherWithGemini(weatherData, location) {
  const prompt = `
    Weather Details:
    - Humidity: ${weatherData.humidity}%
    - Wind Speed: ${weatherData.windSpeed} km/h
    // ... additional parameters
  `;
}
```

### Testing
```bash
# Manual extreme weather check
curl http://localhost:3000/check-extreme-weather

# Test regular notifications
curl http://localhost:3000/test-notify

# Check health
curl http://localhost:3000/health
```

### Customizing Alert Thresholds
Modify the `EXTREME_WEATHER_THRESHOLDS` object in [index.js](index.js):

```javascript
const EXTREME_WEATHER_THRESHOLDS = {
  temperature: {
    extremeHot: 35,      // Adjust temperature thresholds
    extremeCold: -10,
    // ...
  },
  precipitation: {
    heavy: 20,           // Adjust precipitation thresholds
    extreme: 50,
    // ...
  }
  // ...
};
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) - Free weather API
- [Google Gemini AI](https://ai.google.dev/) - AI-powered analysis
- [Telegram Bot API](https://core.telegram.org/bots/api) - Messaging platform
- [Render](https://render.com/) - Cloud hosting platform

---

**Made with ❤️ for hiking enthusiasts**
