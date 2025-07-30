# HikeCastBot 🏔️ - AI-Powered Hiking Weather Notifications

A cloud-based notification bot that sends intelligent hiking weather updates via Telegram, Email, and (optionally) WhatsApp. Features AI-powered weather analysis using Google's Gemini AI to provide personalized hiking recommendations, **extreme weather alerts**, and a comprehensive **user management dashboard**.

## 🔧 Recent Updates & Fixes

### ✨ Latest Improvements (July 2025)
- **🤖 AI Analysis Toggle Fix**: Resolved issue where AI analysis couldn't be properly disabled
  - Fixed checkbox state detection in form submissions
  - Added proper boolean handling for enableAIAnalysis field
  - Users can now successfully toggle AI analysis on/off
- **📢 Enhanced Notification Validation**: Improved form validation for notification channels
  - Added requirement for at least one notification channel selection
  - Enhanced error messaging with clear, specific feedback
  - Prevented HTML5 validation conflicts with custom validation logic
- **🛠️ Dashboard UX Improvements**: Better user experience and error handling
  - Added novalidate attribute to prevent browser validation conflicts
  - Improved conditional field validation and error clearing
  - Enhanced form submission logic for reliable data processing
- **📊 API Response Enhancement**: Completed API data consistency
  - Added enableAIAnalysis field to all user API responses
  - Improved data integrity between frontend and backend

## ✨ Features

### 🎛️ User Management Dashboard (NEW!)
- **Web-Based Interface**: Modern, responsive dashboard at `/dashboard`
- **Complete CRUD Operations**: Add, edit, delete, and view users
- **Real-Time Statistics**: User counts by notification channel
- **Form Validation**: Client and server-side validation
- **Test Notifications**: Send test messages to individual users
- **Database Management**: Backup and restore functionality
- **Mobile Friendly**: Works on desktop, tablet, and mobile devices

### 💾 SQLite Database Integration (NEW!)
- **Persistent Storage**: Automatic migration from `users.json` to SQLite
- **ACID Compliance**: Reliable data integrity and concurrent access
- **RESTful API**: Full user management via HTTP endpoints
- **Automatic Backups**: Timestamped database backups
- **Migration Support**: Seamless upgrade from JSON file storage
- **Statistics Tracking**: User creation/update timestamps

### 🤖 AI-Powered Analysis
- **Gemini AI Integration**: Advanced weather analysis with hiking-specific recommendations
- **Smart Suggestions**: Hiking suitability ratings, gear recommendations, and safety warnings
- **Alternative Activities**: Suggestions for indoor/outdoor alternatives when hiking isn't ideal
- **User-Controlled Toggle**: Enable/disable AI analysis per user via dashboard settings

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

## 🎛️ User Management Dashboard

### Dashboard Features
Visit `http://localhost:3000/dashboard` to access the modern user management interface:

#### 📊 **Real-Time Statistics**
- Total users count
- Users by notification channel (Telegram, Email, WhatsApp)
- Connection status indicators

#### 👤 **User Management**
- **Add New Users**: Complete form with validation and notification channel requirements
- **Edit Existing Users**: Modify any user data including locations, channels, schedules, and AI preferences
- **Delete Users**: Safe deletion with confirmation dialog
- **Test Notifications**: Send test messages to individual users
- **AI Analysis Control**: Toggle AI-powered weather analysis per user

#### 🔧 **System Management**
- **Database Backup**: Create timestamped backups
- **Extreme Weather Check**: Manual weather alert verification
- **Test All Users**: Send notifications to all users
- **Data Refresh**: Update dashboard with latest information

#### 📱 **Mobile Responsive**
- **Desktop**: Full-width cards and detailed forms
- **Tablet**: Responsive grid layout
- **Mobile**: Stacked layout with touch-friendly buttons

### Dashboard Screenshots

**Main Dashboard:**
- User cards with location tags and channel indicators
- Quick action buttons for testing and editing
- Real-time statistics overview

**Add/Edit User Form:**
- **Basic Information**: Name, locations (multi-line input)
- **Notification Channels**: Checkbox selection with comprehensive validation
- **Contact Details**: Telegram Chat ID, Email, WhatsApp number (conditional validation)
- **Scheduling**: Cron format with examples and timezone selection
- **Forecast Preferences**: Multi-select days of the week
- **AI Features**: Toggle to enable/disable AI-powered weather analysis

**User Cards Display:**
- **Visual Status**: Green/red indicators for active channels
- **Organized Data**: Clean layout with icons and color-coded tags
- **Quick Actions**: Test, Edit, Delete buttons for each user

## 🗄️ Database & API

### SQLite Database
- **Automatic Setup**: Database created on first run
- **Migration**: Existing `users.json` automatically imported
- **Backup System**: Manual and automatic backup creation
- **ACID Compliance**: Reliable concurrent access and data integrity

### RESTful API Endpoints

#### User Management
```http
# Get all users
GET /users

# Get specific user
GET /users/:identifier

# Create new user
POST /users
Content-Type: application/json
{
  "name": "John Doe",
  "locations": ["Stuttgart, Germany", "Munich, Germany"],
  "channels": ["telegram", "email"],
  "telegram_chat_id": "-1234567890",
  "email": "john@example.com",
  "schedule": "0 7 * * 6,0",
  "timezone": "Europe/Berlin",
  "forecastDays": ["Saturday", "Sunday"],
  "enableAIAnalysis": true
}

# Update user
PUT /users/:identifier
Content-Type: application/json
{
  "locations": ["Berlin, Germany"],
  "schedule": "0 8 * * *"
}

# Delete user
DELETE /users/:identifier

# Test notification for specific user
POST /users/:identifier/test
```

#### Database Management
```http
# Get database statistics
GET /database/stats

# Create database backup
POST /database/backup

# Dashboard interface
GET /dashboard
```

### API Response Format
```json
{
  "status": "success",
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "locations": ["Stuttgart, Germany"],
    "channels": ["telegram", "email"],
    "schedule": "0 7 * * *",
    "timezone": "Europe/Berlin",
    "forecastDays": ["Saturday", "Sunday"],
    "enableAIAnalysis": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

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

3. **Set up initial user (optional):**
   ```bash
   cp users.example.json users.json
   # Edit users.json with your initial user (will be migrated to database)
   # OR use the web dashboard to add users after startup
   ```

4. **Run the application:**
   ```bash
   npm start
   # Visit http://localhost:3000 to check status
   # Visit http://localhost:3000/dashboard for user management
   ```

### First-Time Setup

#### Option 1: Web Dashboard (Recommended)
1. Start the application: `npm start`
2. Visit: `http://localhost:3000/dashboard`
3. Click "Add New User" and fill out the form
4. Test the user with the test button

#### Option 2: JSON Migration
1. Create `users.json` from `users.example.json`
2. Edit with your user details
3. Start the application (will auto-migrate to database)
4. Use dashboard for future management

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

# Optional (Database)
DB_PATH=hikecast.db  # Custom database file path
```

### User Configuration

#### Dashboard Form Fields
- **Name**: Unique identifier for the user
- **Locations**: One per line (e.g., "Stuttgart, Germany")
- **Notification Channels**: Telegram, Email, WhatsApp
- **Contact Information**: 
  - Telegram Chat ID (get from @userinfobot)
  - Email address
  - WhatsApp number with country code
- **Schedule**: Cron format (examples provided)
- **Timezone**: Dropdown with common timezones
- **Forecast Days**: Select specific days of the week

#### Multi-Day Forecast Example
```json
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
```

#### Schedule Format (Cron)
- `0 7 * * *` - Daily at 7:00 AM
- `0 7,18 * * *` - Daily at 7:00 AM and 6:00 PM
- `0 7 * * 1-5` - Weekdays at 7:00 AM
- `0 8 * * 6,0` - Weekends at 8:00 AM

## 📡 API Endpoints

### Core Application
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service status |
| `/health` | GET | Health check for monitoring |
| `/dashboard` | GET | User management web interface |

### User Management API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | GET | List all users |
| `/users` | POST | Create new user |
| `/users/:identifier` | GET | Get specific user |
| `/users/:identifier` | PUT | Update user |
| `/users/:identifier` | DELETE | Delete user |
| `/users/:identifier/test` | POST | Send test notification |

### Database Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/database/stats` | GET | Get database statistics |
| `/database/backup` | POST | Create database backup |

### Testing & Debugging
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/test-notify` | GET | Send test notifications to all users |
| `/test-simple` | GET | Send simplified test notification (no AI) |
| `/test-telegram-only` | GET | Test Telegram integration only |
| `/test-ultra-simple` | GET | Ultra-simple Telegram test message |
| `/test-gemini` | GET | Test Gemini AI API connectivity |
| `/check-extreme-weather` | GET | Manual extreme weather check |
| `/debug` | GET | System debug information |

### Testing Examples

#### User Management via API
```bash
# Get all users
curl http://localhost:3000/users

# Add new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "locations": ["Berlin, Germany"],
    "channels": ["telegram"],
    "telegram_chat_id": "987654321",
    "schedule": "0 8 * * 6,0",
    "timezone": "Europe/Berlin",
    "forecastDays": ["Saturday", "Sunday"]
  }'

# Update user locations
curl -X PUT http://localhost:3000/users/NewUser \
  -H "Content-Type: application/json" \
  -d '{"locations": ["Munich, Germany"]}'

# Test specific user
curl -X POST http://localhost:3000/users/NewUser/test

# Delete user
curl -X DELETE http://localhost:3000/users/NewUser
```

#### Basic Testing
```bash
# Test all notification channels
curl http://localhost:3000/test-notify

# Quick simple test (no AI)
curl http://localhost:3000/test-simple

# Test only Telegram
curl http://localhost:3000/test-telegram-only

# Ultra-simple test message
curl http://localhost:3000/test-ultra-simple
```

#### AI & System Testing
```bash
# Test Gemini AI integration
curl http://localhost:3000/test-gemini

# Check system configuration
curl http://localhost:3000/debug

# Manual extreme weather check
curl http://localhost:3000/check-extreme-weather

# Database statistics
curl http://localhost:3000/database/stats

# Create database backup
curl -X POST http://localhost:3000/database/backup

# Health check
curl http://localhost:3000/health
```

## 🤖 AI Features

### Regular Weather Analysis
1. **Hiking Suitability Rating** (1-10 scale)
2. **Gear Recommendations** (clothing, equipment)
3. **Optimal Timing** (best hours for hiking)
4. **Safety Warnings** (weather-related risks)
5. **Alternative Activities** (when hiking isn't recommended)

### Emergency Weather Analysis
1. **Immediate Safety Actions** (urgent steps to take)
2. **Life Safety Risks** (specific dangers to humans)
3. **Activity Prohibitions** (what must be avoided)
4. **Emergency Preparedness** (supplies and planning)
5. **Recovery Timeline** (when conditions improve)

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

## 🔄 Monitoring Schedule

- **Regular Forecasts**: Based on user's cron schedule
- **Extreme Weather Checks**: Every 2 hours automatically
- **Startup Check**: Immediate check when service starts
- **Manual Triggers**: Available via API endpoints

## 🌐 Deployment

### Render Web Service
1. **Push to GitHub**
2. **Create Render Web Service:**
   - Connect your repository
   - Set start command: `npm start`
   - Add environment variables
   - Database will be created automatically
3. **Keep Service Warm:**
   - Use UptimeRobot to ping `/health` endpoint every 5 minutes
   - Prevents free tier services from sleeping

### Health Monitoring
- **Endpoint**: `GET /health`
- **Response**: `{"status": "ok", "time": "2024-01-01T00:00:00.000Z"}`
- **Purpose**: Keep service active and monitor uptime

### Data Migration
- **Automatic**: Existing `users.json` files are automatically migrated to SQLite
- **Backup**: Original JSON files are backed up with timestamps
- **No Downtime**: Migration happens during startup

## 📱 Notification Channels Status

### ✅ Telegram - Fully Functional
- Real-time delivery
- Markdown formatting (converted to plain text)
- Emoji support
- Error handling
- Multi-day forecast support
- **Extreme weather alerts**
- Long message splitting support

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

- **Sensitive Data**: Database and `.env` excluded from git
- **API Keys**: Stored as environment variables
- **Data Validation**: Client and server-side input validation
- **Webhook Security**: Token verification for WhatsApp
- **Error Handling**: Graceful fallbacks for API failures
- **Safety First**: Critical alerts override user preferences
- **Database Integrity**: ACID compliance and automatic backups

## 🛠️ Development

### Project Structure
```
HikeCast/
├── views/
│   └── dashboard.html              # User management dashboard interface
├── index.js                       # Main application file (now cleaner!)
├── database.js                    # SQLite database management
├── hikecast.db                    # SQLite database (auto-created)
├── users.json                     # Legacy user config (auto-migrated)
├── users.example.json             # Example user configuration
├── package.json                   # Dependencies and scripts
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

### Database Schema
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  locations TEXT NOT NULL,           -- JSON array
  channels TEXT NOT NULL,            -- JSON array
  telegram_chat_id TEXT,
  email TEXT,
  whatsapp TEXT,
  schedule TEXT DEFAULT '0 7 * * *',
  timezone TEXT DEFAULT 'UTC',
  forecast_days TEXT,               -- JSON array
  enable_ai_analysis INTEGER DEFAULT 1,  -- AI analysis toggle (1=enabled, 0=disabled)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

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

### Customizing Alert Thresholds
Modify the `EXTREME_WEATHER_THRESHOLDS` object in [index.js](index.js):

```javascript
const EXTREME_WEATHER_THRESHOLDS = {
  temperature: {
    extremeHot: 35,      // Adjust temperature thresholds
    extremeCold: -10,
    heatWave: 30,        // Heat wave threshold
    coldWave: 0          // Cold wave threshold
  },
  precipitation: {
    heavy: 20,           // Heavy rain threshold
    extreme: 50,         // Extreme rain threshold
    hourlyHeavy: 10      // Hourly heavy rain
  },
  wind: {
    strong: 50,          // Strong wind threshold
    extreme: 80          // Extreme wind threshold
  },
  weatherCodes: {
    dangerous: [95, 96, 99, 65, 75, 82], // Critical weather codes
    severe: [63, 73, 81, 45, 48]         // High severity codes
  }
};
```

### Testing & Debugging

#### Progressive Testing Approach
1. **Ultra Simple**: `curl /test-ultra-simple` - Basic connectivity
2. **Telegram Only**: `curl /test-telegram-only` - Weather without AI
3. **Simple Test**: `curl /test-simple` - Weather with minimal formatting
4. **Gemini Test**: `curl /test-gemini` - AI functionality
5. **Full Test**: `curl /test-notify` - Complete workflow
6. **Debug Info**: `curl /debug` - System configuration

#### Dashboard Testing
1. **Access Dashboard**: Visit `http://localhost:3000/dashboard`
2. **Add Test User**: Use the "Add New User" form
3. **Test Notification**: Click the test button for the user
4. **Edit User**: Modify user settings and save
5. **Delete User**: Remove test user when done

#### Common Issues & Solutions
- **Database Migration**: Check logs for migration messages
- **User Management**: Use dashboard for easier user management
- **API Testing**: Use `/debug` endpoint to verify database connection
- **Gemini API Errors**: Check API key and model availability
- **Telegram Formatting**: Messages automatically converted to plain text
- **Message Length**: Long messages automatically split
- **Environment Variables**: Use `/debug` to verify configuration
- **AI Analysis Toggle**: If AI analysis doesn't toggle properly, ensure the database includes the `enable_ai_analysis` column
- **Notification Channel Validation**: Select at least one notification channel and provide required contact information
- **Form Validation**: Clear specific error messages are shown for missing required fields based on selected channels

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Use the dashboard for user management instead of editing JSON files
- Test API endpoints with the provided curl examples
- Ensure database migrations work correctly
- Validate form inputs both client and server-side
- Follow the existing code style and structure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) - Free weather API
- [Google Gemini AI](https://ai.google.dev/) - AI-powered analysis
- [Telegram Bot API](https://core.telegram.org/bots/api) - Messaging platform
- [SQLite](https://sqlite.org/) - Embedded database engine
- [Render](https://render.com/) - Cloud hosting platform

---

**Made with ❤️ for hiking enthusiasts - Stay Safe! 🚨**

### Quick Links
- 🎛️ [User Dashboard](http://localhost:3000/dashboard) - Manage users via web interface
- 📊 [System Status](http://localhost:3000/debug) - Check configuration and database
- 🏥 [Health Check](http://localhost:3000/health) - Monitor service uptime
- 📡 [API Documentation](#-api-endpoints) - Full API reference
