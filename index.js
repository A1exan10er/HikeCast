// index.js - Refactored HikeCast Weather Notification System
const express = require('express');
const cron = require('node-cron');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Import database
const UserDatabase = require('./database');

// Import services
const { notifyUser } = require('./services/forecastService');
const { checkExtremeWeatherForEnabledUsers, checkSpecificUsersExtremeWeather } = require('./services/extremeWeatherService');
const { handleUserMessage } = require('./services/conversationService');
const { startPolling, stopPolling } = require('./services/telegramPollingService');

// Import routes
const createUserRoutes = require('./routes/userRoutes');
const createSystemRoutes = require('./routes/systemRoutes');

// Initialize database
const db = new UserDatabase();

// Store active extreme weather schedules
const activeExtremeWeatherSchedules = new Map();

// Updated function to load users from database
async function loadUsers() {
  try {
    return await db.getAllUsers();
  } catch (error) {
    console.error('Error loading users from database:', error);
    return [];
  }
}

// Schedule notifications for users
async function scheduleNotifications() {
  try {
    const users = await loadUsers();
    users.forEach(user => {
      if (user.schedule) {
        cron.schedule(user.schedule, () => {
          console.log(`[${new Date().toISOString()}] Running scheduled notification for ${user.name}`);
          notifyUser(user)
            .then(() => console.log(`[${new Date().toISOString()}] Notification sent to ${user.name}`))
            .catch(err => console.error(`[${new Date().toISOString()}] Error notifying ${user.name}:`, err));
        }, {
          timezone: user.timezone || 'Etc/UTC'
        });
        console.log(`Scheduled notifications for ${user.name} with cron: ${user.schedule}`);
      }
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

// Check extreme weather for specific users
async function checkSpecificUsersExtremeWeatherInternal(users) {
  try {
    console.log(`🔍 Starting extreme weather check for ${users.length} specific users...`);
    
    // Use the proper function from the service that handles individual users
    await checkSpecificUsersExtremeWeather(users);
    
    console.log('✅ Extreme weather check completed for specific users');
  } catch (error) {
    console.error('❌ Error in checkSpecificUsersExtremeWeatherInternal:', error.message);
    throw error;
  }
}

// Schedule extreme weather checks based on user preferences
async function scheduleExtremeWeatherChecks() {
  try {
    // Clear existing schedules
    activeExtremeWeatherSchedules.forEach((task, interval) => {
      if (task) {
        task.stop();
      }
    });
    activeExtremeWeatherSchedules.clear();
    
    const users = await loadUsers();
    const enabledUsers = users.filter(user => user.enableExtremeWeatherAlerts !== false);
    
    if (enabledUsers.length === 0) {
      console.log('No users have extreme weather alerts enabled');
      return;
    }
    
    // Group users by their check interval preferences
    const intervalGroups = new Map();
    enabledUsers.forEach(user => {
      const interval = user.extremeWeatherCheckInterval || '0 */2 * * *';
      if (!intervalGroups.has(interval)) {
        intervalGroups.set(interval, []);
      }
      intervalGroups.get(interval).push(user);
    });
    
    // Create scheduled tasks for each unique interval
    intervalGroups.forEach((usersWithInterval, interval) => {
      if (!cron.validate(interval)) {
        console.error(`Invalid cron expression for extreme weather check: ${interval}`);
        return;
      }
      
      console.log(`Scheduling extreme weather checks for ${usersWithInterval.length} users with interval: ${interval}`);
      
      const task = cron.schedule(interval, async () => {
        console.log(`[${new Date().toISOString()}] Running extreme weather check for interval: ${interval}`);
        try {
          await checkSpecificUsersExtremeWeatherInternal(usersWithInterval);
          console.log(`[${new Date().toISOString()}] Extreme weather check completed for interval: ${interval}`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error in extreme weather check for interval ${interval}:`, error);
        }
      }, {
        scheduled: false // Don't start immediately
      });
      
      task.start();
      activeExtremeWeatherSchedules.set(interval, task);
    });
    
    console.log(`Scheduled extreme weather checks for ${intervalGroups.size} different intervals`);
  } catch (error) {
    console.error('Error scheduling extreme weather checks:', error);
  }
}

// Start Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Add JSON parsing middleware
app.use(express.json());


// Simple HTTP Basic Auth middleware for dashboard protection
const dashboardUser = process.env.DASHBOARD_USER || 'admin';
const dashboardPass = process.env.DASHBOARD_PASS || 'changeme';
function dashboardAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="HikeCast Dashboard"');
    return res.status(401).send('Authentication required.');
  }
  const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  const [user, pass] = credentials;
  if (user === dashboardUser && pass === dashboardPass) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="HikeCast Dashboard"');
  return res.status(401).send('Invalid credentials.');
}

// Protect dashboard and assets
app.use('/dashboard', dashboardAuth);
app.use('/assets', dashboardAuth, express.static(path.join(__dirname, 'views/assets')));

// Basic endpoints
app.get('/', (req, res) => {
  res.send('HikeCastBot is running and scheduling notifications!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  try {
    const dashboardPath = path.join(__dirname, 'views', 'dashboard.html');
    
    if (fs.existsSync(dashboardPath)) {
      res.sendFile(dashboardPath);
    } else {
      console.error('Dashboard HTML file not found at:', dashboardPath);
      res.status(500).send(`
        <h1>Dashboard Unavailable</h1>
        <p>Dashboard file not found. Please ensure views/dashboard.html exists.</p>
        <p><a href="/">Return to main page</a></p>
      `);
    }
  } catch (error) {
    console.error('Error serving dashboard:', error);
    res.status(500).send(`
      <h1>Dashboard Error</h1>
      <p>Dashboard temporarily unavailable: ${error.message}</p>
      <p><a href="/">Return to main page</a></p>
    `);
  }
});

// Test notification endpoint
app.get('/test-notify', async (req, res) => {
  try {
    const users = await loadUsers();
    for (const user of users) {
      await notifyUser(user);
    }
    res.send('Test notifications sent (check your email and Telegram)!');
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Extreme weather check endpoint
app.post('/check-extreme-weather', async (req, res) => {
  try {
    console.log('🌨️ Manual extreme weather check requested...');
    
    // Call the function that checks all enabled users with manual check flag
    await checkExtremeWeatherForEnabledUsers(loadUsers, true);

    res.json({
      status: 'success',
      message: 'Extreme weather check completed successfully'
    });
  } catch (error) {
    console.error('❌ Error in manual extreme weather check:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Error checking extreme weather: ' + error.message
    });
  }
});

// Debug endpoint
app.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Starting debug endpoint...');
    const users = await loadUsers();
    console.log(`Debug: Loaded ${users.length} users`);
    
    res.json({
      status: 'HikeCast Debug Info',
      timestamp: new Date().toISOString(),
      environment: {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not Set',
        GMAIL_USER: process.env.GMAIL_USER ? 'Set' : 'Not Set',
        GMAIL_PASS: process.env.GMAIL_PASS ? 'Set' : 'Not Set',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not Set',
        WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN ? 'Set' : 'Not Set',
        WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Set' : 'Not Set'
      },
      database: {
        initialized: db ? true : false,
        usersCount: users.length
      },
      files: {
        usersJsonExists: fs.existsSync('users.json'),
        databaseExists: fs.existsSync('hikecast.db')
      },
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        locations: user.locations,
        channels: user.channels,
        hasValidTelegramId: !!user.telegram_chat_id,
        hasValidEmail: !!user.email,
        hasValidWhatsApp: !!user.whatsapp,
        schedule: user.schedule,
        timezone: user.timezone,
        forecastDays: user.forecastDays,
        enableAIAnalysis: user.enableAIAnalysis,
        enableExtremeWeatherAlerts: user.enableExtremeWeatherAlerts,
        extremeWeatherCheckInterval: user.extremeWeatherCheckInterval,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

// WhatsApp webhook endpoints
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.json({
      status: 'WhatsApp Webhook Endpoint',
      message: 'This endpoint is ready to receive WhatsApp webhooks',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/webhook', express.json(), (req, res) => {
  const body = req.body;
  
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
      const changes = entry.changes;
      changes.forEach(change => {
        if (change.field === 'messages') {
          const messages = change.value.messages;
          if (messages) {
            messages.forEach(message => {
              console.log('Received WhatsApp message:', message);
            });
          }
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Telegram webhook for two-way communication
app.post('/telegram-webhook', express.json(), async (req, res) => {
  try {
    console.log('📨 Telegram webhook received:', JSON.stringify(req.body, null, 2));
    
    const message = req.body.message;
    
    if (message && message.text) {
      const chatId = message.chat.id;
      const userId = message.from.id.toString(); // Use sender's user ID, not chat ID
      const messageText = message.text;
      const isGroupChat = message.chat.type === 'group' || message.chat.type === 'supergroup';
      
      console.log(`💬 Message from ${message.from.first_name} (${message.from.id}) in ${isGroupChat ? 'group' : 'private'} chat ${chatId}: ${messageText}`);
      
      // In group chats, only respond if bot is mentioned or it's a bot command
      if (isGroupChat) {
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
        
        // Check if it's a command directed at the bot (e.g., /start@PackYourPonchoBot)
        const isBotCommand = messageText.startsWith('/') && messageText.includes(`@${botUsername}`);
        
        // Check for @mention in the text
        const isMentioned = message.entities && message.entities.some(entity => 
          entity.type === 'mention' && messageText.includes(`@${botUsername}`)
        );
        
        // Also check for text_mention type (when user clicks on bot name)
        const isTextMentioned = message.entities && message.entities.some(entity => 
          entity.type === 'text_mention' && entity.user && entity.user.is_bot
        );
        
        // Check if message contains @botname anywhere
        const hasAtMention = messageText.includes(`@${botUsername}`);
        
        if (!isBotCommand && !isMentioned && !isTextMentioned && !hasAtMention) {
          console.log(`ℹ️ Ignoring group message (bot not mentioned)`);
          res.sendStatus(200);
          return;
        }
        
        console.log(`✅ Bot mentioned in group chat, processing message`);
      }
      
      // Remove bot mention from message text for processing
      let cleanedText = messageText;
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
      if (botUsername) {
        // Remove @botname and also bot commands like /start@botname
        cleanedText = messageText
          .replace(new RegExp(`@${botUsername}\\s*`, 'gi'), '')
          .replace(new RegExp(`@${botUsername}`, 'gi'), '')
          .trim();
      }
      
      // Handle the user's message
      const response = await handleUserMessage(cleanedText, userId);
      
      // Send response back to chat
      const { sendTelegram } = require('./services/notificationService');
      await sendTelegram(chatId, response);
      
      console.log(`✅ Response sent to chat ${chatId}`);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error handling Telegram webhook:', error);
    res.sendStatus(500);
  }
});

// Setup Telegram webhook
app.post('/setup-telegram-webhook', async (req, res) => {
  try {
    const webhookUrl = req.body.webhookUrl || process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Webhook URL is required. Provide it in request body or set WEBHOOK_URL environment variable.'
      });
    }
    
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(400).json({
        status: 'error',
        message: 'TELEGRAM_BOT_TOKEN environment variable is not set.'
      });
    }
    
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
    
    const response = await axios.post(telegramApiUrl, {
      url: `${webhookUrl}/telegram-webhook`,
      allowed_updates: ['message']
    });
    
    console.log('✅ Telegram webhook set:', response.data);
    
    res.json({
      status: 'success',
      message: 'Telegram webhook configured successfully',
      webhookUrl: `${webhookUrl}/telegram-webhook`,
      telegram_response: response.data
    });
    
  } catch (error) {
    console.error('❌ Error setting Telegram webhook:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get current Telegram webhook info
app.get('/telegram-webhook-info', async (req, res) => {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(400).json({
        status: 'error',
        message: 'TELEGRAM_BOT_TOKEN environment variable is not set.'
      });
    }
    
    const response = await axios.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    );
    
    res.json({
      status: 'success',
      webhook_info: response.data
    });
    
  } catch (error) {
    console.error('❌ Error getting webhook info:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Use route modules
app.use('/users', createUserRoutes(db, scheduleNotifications, scheduleExtremeWeatherChecks));
app.use('/system', createSystemRoutes(db, scheduleNotifications, scheduleExtremeWeatherChecks));

// Database management endpoints
app.get('/database/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      status: 'success',
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.post('/database/backup', async (req, res) => {
  try {
    const backupPath = await db.backup();
    res.json({
      status: 'success',
      message: 'Database backed up successfully',
      backupPath
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Start server and initialize
app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  
  try {
    // Initialize database
    console.log('Initializing database...');
    await db.initialize();
    
    // Migrate from JSON if exists
    await db.migrateFromJSON();
    
    // Schedule notifications and extreme weather checks
    await scheduleNotifications();
    await scheduleExtremeWeatherChecks();
    
    // Start Telegram polling for local development
    // For production, use webhook instead (see TELEGRAM_CONVERSATION_SETUP.md)
    if (!process.env.WEBHOOK_URL || process.env.USE_POLLING === 'true') {
      console.log('🔄 Starting Telegram polling mode (local development)...');
      startPolling();
    } else {
      console.log('📡 Webhook mode enabled. Make sure to register webhook with Telegram.');
      console.log('   Use: POST /setup-telegram-webhook to register the webhook.');
    }
    
    // Deployment notifications disabled - users can use "Test Notification" feature instead
    console.log('Deployment notifications disabled. Users can test notifications via dashboard.');
    console.log('Use /test-notify endpoint or dashboard "Test Notification" buttons for testing.');
    
    // Initial extreme weather check disabled on startup - scheduled checks will run normally
    console.log('Initial extreme weather check disabled on startup.');
    console.log('Extreme weather monitoring will begin with scheduled intervals.');
    
  } catch (err) {
    console.error('Error in startup process:', err.message);
    console.error('Stack trace:', err.stack);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    stopPolling();
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  try {
    stopPolling();
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
