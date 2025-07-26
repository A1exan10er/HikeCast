// index.js
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const cron = require('node-cron');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

// WhatsApp Business API configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Initialize Gemini AI with the new API
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Load user preferences from JSON
function loadUsers() {
  return JSON.parse(fs.readFileSync('users.json', 'utf8'));
}

// Geocode location to lat/lon using Open-Meteo's geocoding API
async function geocodeLocation(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const response = await axios.get(url);
  if (response.data.results && response.data.results.length > 0) {
    return {
      lat: response.data.results[0].latitude,
      lon: response.data.results[0].longitude,
      name: response.data.results[0].name,
      country: response.data.results[0].country
    };
  } else {
    throw new Error(`Location not found: ${location}`);
  }
}

// Fetch weather data for a location using Open-Meteo
async function getWeather(location) {
  const geo = await geocodeLocation(location);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&hourly=temperature_2m,precipitation,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=2&timezone=auto`;
  const response = await axios.get(url);
  return { geo, weather: response.data };
}

// Send Telegram message
async function sendTelegram(chatId, message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown'
  });
}

async function sendEmail(email, subject, message) {
  if (!gmailUser || !gmailPass) {
    console.warn('GMAIL_USER or GMAIL_PASS not set, skipping email.');
    return;
  }
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  await transporter.sendMail({
    from: `"HikeCastBot" <${gmailUser}>`,
    to: email,
    subject: subject,
    text: message,
    html: `<pre>${message}</pre>`,
  });
}

// WhatsApp notification using Meta Business Platform
async function sendWhatsApp(phone, message) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not set, skipping WhatsApp message.');
    return;
  }

  try {
    const formattedPhone = phone.replace(/^\+/, '').replace(/\D/g, '');
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`WhatsApp message sent successfully. Message ID: ${response.data.messages[0].id}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

// Map weather codes to human-readable descriptions
function getWeatherDescription(weatherCode) {
  const codes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return codes[weatherCode] || `Weather code ${weatherCode}`;
}

// Analyze weather with Gemini AI and provide hiking suggestions
async function analyzeWeatherWithGemini(weatherData, location) {
  if (!genAI) {
    console.warn('Gemini API key not set, skipping AI analysis.');
    return null;
  }

  try {
    console.log('Starting Gemini analysis for', location);
    const weatherDescription = getWeatherDescription(weatherData.weatherCode);
    
    const prompt = `
Analyze the following weather data for hiking in ${location} and provide specific recommendations:

Weather Details:
- Location: ${location}
- Forecast: ${weatherData.dayLabel} (${weatherData.date})
- Temperature: Max ${weatherData.tempMax}°C, Min ${weatherData.tempMin}°C
- Precipitation: ${weatherData.precip}mm
- Weather Condition: ${weatherDescription}

Please provide:
1. A hiking suitability rating (1-10, where 10 is perfect for hiking)
2. Specific recommendations for hiking gear and preparation
3. Best time of day for hiking (if suitable)
4. Any safety concerns or warnings
5. Alternative outdoor activities if hiking isn't recommended

Keep the response concise but informative, suitable for a weather notification message.
Note: This forecast is for ${weatherData.dayLabel.toLowerCase()}.
`;

    console.log('Sending request to Gemini...');
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking for faster response
        },
      }
    });

    console.log('Gemini response received successfully');
    return response.text;
  } catch (error) {
    console.error('Error analyzing weather with Gemini:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

// Helper function to get day name from date
function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Helper function to get formatted date
function getFormattedDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper function to get relative day label
function getRelativeDayLabel(dayIdx) {
  switch(dayIdx) {
    case 0:
      return "Today";
    case 1:
      return "Tomorrow";
    default:
      return `Day +${dayIdx}`;
  }
}

// Get weather forecast for multiple days based on user preferences
function getRequestedForecastDays(weather, user) {
  const forecastDays = [];
  
  // If user has forecastDays array (new format)
  if (user.forecastDays && Array.isArray(user.forecastDays)) {
    // Get up to 7 days of forecast for checking
    const maxDays = Math.min(7, weather.daily.time.length);
    
    for (let dayIdx = 0; dayIdx < maxDays; dayIdx++) {
      const date = weather.daily.time[dayIdx];
      const dayName = getDayName(date);
      
      // Check if this day is in user's requested days
      if (user.forecastDays.includes(dayName)) {
        forecastDays.push({
          dayIdx,
          date,
          dayName,
          relativeLabel: getRelativeDayLabel(dayIdx),
          tempMax: weather.daily.temperature_2m_max[dayIdx],
          tempMin: weather.daily.temperature_2m_min[dayIdx],
          precip: weather.daily.precipitation_sum[dayIdx],
          weatherCode: weather.daily.weathercode[dayIdx]
        });
      }
    }
  } 
  // Fallback to old format (single day)
  else {
    const dayIdx = user.forecastDay !== undefined ? user.forecastDay : 1;
    const validDayIdx = Math.max(0, Math.min(dayIdx, weather.daily.time.length - 1));
    const date = weather.daily.time[validDayIdx];
    
    forecastDays.push({
      dayIdx: validDayIdx,
      date,
      dayName: getDayName(date),
      relativeLabel: getRelativeDayLabel(validDayIdx),
      tempMax: weather.daily.temperature_2m_max[validDayIdx],
      tempMin: weather.daily.temperature_2m_min[validDayIdx],
      precip: weather.daily.precipitation_sum[validDayIdx],
      weatherCode: weather.daily.weathercode[validDayIdx]
    });
  }
  
  return forecastDays;
}

async function notifyUser(user) {
  for (const location of user.locations) {
    const { geo, weather } = await getWeather(location);
    
    // Get requested forecast days
    const forecastDays = getRequestedForecastDays(weather, user);
    
    if (forecastDays.length === 0) {
      console.warn(`No matching forecast days found for ${user.name}`);
      continue;
    }
    
    // Create message header
    let message = `🏔️ **Hiking Weather for ${geo.name}, ${geo.country}**\n\n`;
    
    // Process each requested day
    for (let i = 0; i < forecastDays.length; i++) {
      const dayData = forecastDays[i];
      const isLastDay = i === forecastDays.length - 1;
      
      // Add day header with both day name and relative position
      message += `📅 **${dayData.dayName}, ${getFormattedDate(dayData.date)}** (${dayData.relativeLabel}):\n`;
      message += `🌡️ **Temperature**: ${dayData.tempMax}°C / ${dayData.tempMin}°C\n`;
      message += `🌧️ **Precipitation**: ${dayData.precip}mm\n`;
      message += `☁️ **Conditions**: ${getWeatherDescription(dayData.weatherCode)}\n\n`;
      
      // Get Gemini analysis for this day
      const geminiAnalysis = await analyzeWeatherWithGemini({
        date: dayData.date,
        tempMax: dayData.tempMax,
        tempMin: dayData.tempMin,
        precip: dayData.precip,
        weatherCode: dayData.weatherCode,
        dayLabel: `${dayData.dayName} (${dayData.relativeLabel})`
      }, `${geo.name}, ${geo.country}`);
      
      if (geminiAnalysis) {
        message += `🤖 **AI Analysis for ${dayData.dayName}**:\n${geminiAnalysis}`;
      } else {
        message += `📊 **Basic Assessment**: Check weather conditions before heading out!`;
      }
      
      // Add separator between days (except for the last day)
      if (!isLastDay) {
        message += `\n\n${'─'.repeat(40)}\n\n`;
      }
    }
    
    // Create subject line that includes all days
    const dayNames = forecastDays.map(d => d.dayName).join(', ');
    const subject = `🏔️ ${dayNames} Hiking Weather & AI Analysis for ${geo.name}`;
    
    // Send notifications
    if (user.channels.includes('telegram') && user.telegram_chat_id) {
      await sendTelegram(user.telegram_chat_id, message);
    }
    if (user.channels.includes('email') && user.email) {
      await sendEmail(user.email, subject, message);
    }
    // TODO: WhatsApp functionality - temporarily commented out due to Meta API limitations
    // if (user.channels.includes('whatsapp') && user.whatsapp) {
    //   await sendWhatsApp(user.whatsapp, message);
    // }
  }
}

// Schedule notifications for users
function scheduleNotifications() {
  const users = loadUsers();
  users.forEach(user => {
    if (user.schedule) {
      cron.schedule(user.schedule, () => {
        console.log(`[${new Date().toISOString()}] Running scheduled notification for ${user.name}`);
        notifyUser(user)
          .then(() => console.log(`[${new Date().toISOString()}] Notification sent to ${user.name}`))
          .catch(err => console.error(`[${new Date().toISOString()}] Error notifying ${user.name}:`, err));
      }, {
        timezone: user.timezone || 'Etc/UTC' // Default to UTC if not specified
      });
      console.log(`Scheduled notifications for ${user.name} with cron: ${user.schedule}`);
    }
  });
}

// Start Express server
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('HikeCastBot is running and scheduling notifications!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/test-notify', async (req, res) => {
  const users = loadUsers();
  for (const user of users) {
    await notifyUser(user);
  }
  res.send('Test notifications sent (check your email and Telegram)!');
});

// Add webhook verification endpoint for WhatsApp
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
    // Handle browser requests (when no webhook verification params)
    res.json({
      status: 'WhatsApp Webhook Endpoint',
      message: 'This endpoint is ready to receive WhatsApp webhooks',
      timestamp: new Date().toISOString()
    });
  }
});

// Add webhook endpoint to receive WhatsApp messages (POST)
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
              // Handle incoming messages here if needed
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

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  scheduleNotifications();
  // Send notification to all users immediately at deployment
  try {
    const users = loadUsers();
    for (const user of users) {
      await notifyUser(user);
    }
    console.log('Deployment notification sent to all users.');
  } catch (err) {
    console.error('Error sending deployment notification:', err);
  }
});