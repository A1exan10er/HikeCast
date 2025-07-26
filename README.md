# HikeCastBot 🏔️ - AI-Powered Hiking Weather Notifications

A cloud-based notification bot that sends intelligent hiking weather updates via Telegram, Email, and (optionally) WhatsApp. Features AI-powered weather analysis using Google's Gemini AI to provide personalized hiking recommendations.

## ✨ Features

### 🤖 AI-Powered Analysis
- **Gemini AI Integration**: Advanced weather analysis with hiking-specific recommendations
- **Smart Suggestions**: Hiking suitability ratings, gear recommendations, and safety warnings
- **Alternative Activities**: Suggestions for indoor/outdoor alternatives when hiking isn't ideal

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
- **Detailed Metrics**: Temperature, precipitation, weather conditions
- **Human-Readable**: Weather codes converted to descriptive text

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

### Gemini Analysis Provides:
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

### ✅ Email - Fully Functional  
- Gmail SMTP integration
- HTML formatting
- Reliable delivery
- Attachment support
- Multi-day forecast support

### ⚠️ WhatsApp - Limited Functionality
**Current Status:**
- ✅ API configured with permanent token
- ✅ Template message sending (`hello_world`)
- ❌ Custom weather messages (requires template approval)
- ❌ Unrestricted messaging (requires app review)

**Limitations:**
- Only verified test numbers
- Template messages only
- Meta rate limits for test numbers

## 🔐 Security & Privacy

- **Sensitive Data**: `users.json` and `.env` excluded from git
- **API Keys**: Stored as environment variables
- **Webhook Security**: Token verification for WhatsApp
- **Error Handling**: Graceful fallbacks for API failures

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
# Test notifications
curl http://localhost:3000/test-notify

# Check health
curl http://localhost:3000/health
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
