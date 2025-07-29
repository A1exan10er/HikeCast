# HikeCast Project

HikeCast is a weather notification application designed to help users stay informed about hiking weather conditions. The application sends alerts and notifications to users based on their preferences and locations.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/HikeCast.git
   ```

2. Navigate to the project directory:
   ```bash
   cd HikeCast
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

5. Start the application:
   ```bash
   npm start
   ```

## Usage

The application will be available at `http://localhost:3000`.

### Web Dashboard
Access the user management dashboard at `http://localhost:3000/dashboard` to:
- Add and manage users
- Configure notification preferences
- Test notifications
- Monitor system status

### API Endpoints
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/:name` - Update user
- `DELETE /users/:name` - Delete user
- `POST /users/:name/test` - Send test notification

## Project Structure (Modular Architecture)

```
HikeCast/
├── index.js                       # Main server entry point
├── routes/                        # Route definitions (modular)
│   ├── dashboard.js               # Dashboard web interface
│   ├── users.js                   # User management API
│   └── weather.js                 # Weather-related endpoints
├── services/                      # Business logic services
│   ├── database.js                # Database operations
│   ├── weatherService.js          # Weather API integration
│   ├── notificationService.js     # Multi-channel notifications
│   └── schedulerService.js        # Cron job management
├── views/                         # Frontend templates
│   └── dashboard.html             # User management dashboard
├── config/                        # Configuration files
│   └── environment.js             # Environment setup
├── utils/                         # Utility functions
│   ├── validation.js              # Input validation
│   └── helpers.js                 # Common helper functions
├── tests/                         # Test files
│   ├── routes.test.js             # Route testing
│   └── services.test.js           # Service testing
├── package.json                   # Dependencies and scripts
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
└── README.md                      # Project documentation
```

### Architecture Benefits

**🎯 Modular Design**
- Each file has a single responsibility
- Easy to locate and modify specific features
- Better code organization and maintainability

**🔧 Separation of Concerns**
- **Routes**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Views**: Manage user interface
- **Utils**: Provide reusable utilities

**🧪 Testability**
- Individual components can be tested in isolation
- Mock dependencies easily
- Comprehensive test coverage

**👥 Team Collaboration**
- Multiple developers can work on different modules
- Reduced merge conflicts
- Clear code ownership

## Features

### 🌦️ Weather Monitoring
- Real-time weather data from OpenWeather API
- Multi-location support per user
- Extreme weather alerts and warnings
- 7-day forecast with hiking-specific metrics

### 📱 Multi-Channel Notifications
- **Telegram**: Instant messaging with rich formatting
- **Email**: Detailed weather reports with charts
- **WhatsApp**: Business API integration (future)

### ⏰ Smart Scheduling
- Flexible cron-based scheduling
- Timezone-aware notifications
- Customizable forecast days
- Weekend/weekday preferences

### 🎛️ User Management
- Web-based dashboard for easy management
- RESTful API for programmatic access
- User validation and error handling
- Database backup and restore

### 🤖 AI-Powered Insights
- Gemini AI integration for weather analysis
- Personalized hiking recommendations
- Natural language weather summaries
- Context-aware safety alerts

## API Documentation

### User Management

#### Create User
```http
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
  "forecastDays": ["Saturday", "Sunday"]
}
```

#### Update User
```http
PUT /users/John%20Doe
Content-Type: application/json

{
  "locations": ["Berlin, Germany"]
}
```

#### Get User
```http
GET /users/John%20Doe
```

#### Delete User
```http
DELETE /users/John%20Doe
```

#### Test Notification
```http
POST /users/John%20Doe/test
```

### System Endpoints

#### Health Check
```http
GET /health
```

#### Database Stats
```http
GET /database/stats
```

#### Backup Database
```http
POST /database/backup
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Email Configuration
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password

# WhatsApp Business API (Optional)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Database

HikeCast uses SQLite for data storage with automatic migration from JSON files. The database is created automatically on first run.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Quick Start Guide

1. **Setup**: Clone repo, install dependencies, configure `.env`
2. **Run**: `npm start`
3. **Access**: Visit `http://localhost:3000/dashboard`
4. **Add User**: Click "Add New User" and fill the form
5. **Test**: Use the test button to verify notifications work
6. **Schedule**: Users will receive automated weather updates

For detailed setup instructions, see the [Installation](#installation) section above.