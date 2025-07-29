// index.js
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const cron = require('node-cron');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');
const UserDatabase = require('./database'); // Add this line

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

// WhatsApp Business API configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Initialize Gemini AI with the new API
const genAI = GEMINI_API_KEY ? new GoogleGenAI({}) : null;

// Initialize database
const db = new UserDatabase();

// Updated function to load users from database instead of JSON
async function loadUsers() {
  try {
    return await db.getAllUsers();
  } catch (error) {
    console.error('Error loading users from database:', error);
    return [];
  }
}

// User management functions for API endpoints
function validateUserData(userData) {
  const errors = [];
  
  if (!userData.name || userData.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!userData.locations || !Array.isArray(userData.locations) || userData.locations.length === 0) {
    errors.push('At least one location is required');
  }
  
  if (!userData.channels || !Array.isArray(userData.channels) || userData.channels.length === 0) {
    errors.push('At least one notification channel is required');
  }
  
  if (userData.channels.includes('telegram') && !userData.telegram_chat_id) {
    errors.push('Telegram chat ID is required when telegram channel is selected');
  }
  
  if (userData.channels.includes('email') && !userData.email) {
    errors.push('Email is required when email channel is selected');
  }
  
  if (userData.channels.includes('whatsapp') && !userData.whatsapp) {
    errors.push('WhatsApp number is required when whatsapp channel is selected');
  }
  
  if (userData.schedule && !cron.validate(userData.schedule)) {
    errors.push('Invalid cron schedule format');
  }
  
  return errors;
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
  try {
    console.log(`🔍 Fetching weather for: ${location}`);
    const geo = await geocodeLocation(location);
    console.log(`🔍 Geocoded ${location} to:`, JSON.stringify(geo, null, 2));
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=7&timezone=auto`;
    console.log(`🔍 Weather API URL: ${url}`);
    
    const response = await axios.get(url);
    console.log(`✅ Weather data received for ${location}`);
    return { geo, weather: response.data };
  } catch (error) {
    console.error(`❌ Weather API Error for ${location}:`);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full Error:', error.message);
    throw error;
  }
}

// Send Telegram message
async function sendTelegram(chatId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping Telegram message.');
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    console.log(`🔍 Attempting Telegram send to chat ID: ${chatId} (type: ${typeof chatId})`);
    
    // Convert to completely plain text - remove ALL formatting
    let plainMessage = message
      .replace(/\*\*(.*?)\*\*/g, '$1')     // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')         // Remove *italic*
      .replace(/`(.*?)`/g, '$1')           // Remove `code`
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove [link](url)
      .replace(/#{1,6}\s+/g, '')           // Remove # headers
      .replace(/[_~|]/g, '')               // Remove other markdown chars
      .replace(/─+/g, '---')               // Replace special dashes
      .replace(/\n\n\n+/g, '\n\n');       // Clean up excessive newlines
    
    // Telegram has a 4096 character limit
    const maxLength = 4000; // Conservative buffer
    
    if (plainMessage.length <= maxLength) {
      const payload = {
        chat_id: parseInt(chatId), // Convert to number if it's a string
        text: plainMessage
        // NO parse_mode - send as pure plain text
      };
      
      console.log(`🔍 Sending plain text message (${plainMessage.length} chars)`);
      
      const response = await axios.post(url, payload);
      console.log(`✅ Telegram message sent successfully to ${chatId}`);
    } else {
      // Split long messages
      console.log(`🔍 Message too long (${plainMessage.length} chars), splitting...`);
      
      const parts = splitLongMessage(plainMessage, maxLength);
      
      for (let i = 0; i < parts.length; i++) {
        const partMessage = i === 0 ? parts[i] : `Part ${i + 1}:\n\n${parts[i]}`;
        
        const payload = {
          chat_id: parseInt(chatId),
          text: partMessage
          // NO parse_mode
        };
        
        await axios.post(url, payload);
        console.log(`✅ Telegram message part ${i + 1}/${parts.length} sent`);
        
        // Delay between parts
        if (i < parts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Telegram API Error for chat ID ${chatId}:`);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full Error:', error.message);
    throw error;
  }
}

// Simple message splitting function
function splitLongMessage(message, maxLength) {
  const parts = [];
  let current = '';
  const lines = message.split('\n');
  
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLength) {
      if (current.trim()) {
        parts.push(current.trim());
        current = '';
      }
      
      // If single line is too long, split by words
      if (line.length > maxLength) {
        const words = line.split(' ');
        let tempLine = '';
        
        for (const word of words) {
          if (tempLine.length + word.length + 1 > maxLength) {
            if (tempLine.trim()) {
              if (current) {
                current += '\n' + tempLine.trim();
              } else {
                current = tempLine.trim();
              }
            }
            tempLine = word;
          } else {
            tempLine += (tempLine ? ' ' : '') + word;
          }
        }
        
        if (tempLine.trim()) {
          if (current) {
            current += '\n' + tempLine.trim();
          } else {
            current = tempLine.trim();
          }
        }
      } else {
        current = line;
      }
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

async function sendEmail(email, subject, message) {
  if (!gmailUser || !gmailPass) {
    console.warn('GMAIL_USER or GMAIL_PASS not set, skipping email.');
    return;
  }
  
  try {
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
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
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
    console.log(`🔍 Starting Gemini analysis for ${location}`);
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

    console.log(`🔍 Sending request to Gemini with model: gemini-2.5-flash`);
    
    // Use the correct API structure for @google/genai
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log(`✅ Gemini response received successfully`);
    return response.text;
  } catch (error) {
    console.error(`❌ Gemini API Error for ${location}:`);
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null; // Don't throw, just return null to continue
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
  console.log(`Starting notifications for ${user.name}`);
  
  for (const location of user.locations) {
    try {
      console.log(`Fetching weather for ${location}`);
      const { geo, weather } = await getWeather(location);
      
      // Get requested forecast days
      const forecastDays = getRequestedForecastDays(weather, user);
      
      if (forecastDays.length === 0) {
        console.warn(`No matching forecast days found for ${user.name} at ${location}`);
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
        try {
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
        } catch (error) {
          console.error(`Gemini analysis failed for ${dayData.dayName}:`, error.message);
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
      
      // Send notifications with individual error handling
      const promises = [];
      
      if (user.channels.includes('telegram') && user.telegram_chat_id) {
        promises.push(
          sendTelegram(user.telegram_chat_id, message)
            .catch(error => console.error(`Telegram failed for ${user.name}:`, error.message))
        );
      }
      
      if (user.channels.includes('email') && user.email) {
        promises.push(
          sendEmail(user.email, subject, message)
            .catch(error => console.error(`Email failed for ${user.name}:`, error.message))
        );
      }
      
      // Wait for all notifications to complete (or fail)
      await Promise.allSettled(promises);
      console.log(`Notifications completed for ${user.name} at ${location}`);
      
    } catch (error) {
      console.error(`Error processing location ${location} for ${user.name}:`, error.message);
      // Continue with next location instead of stopping completely
    }
  }
}

// Define extreme weather thresholds
const EXTREME_WEATHER_THRESHOLDS = {
  temperature: {
    extremeHot: 35,      // °C
    extremeCold: -10,    // °C
    heatWave: 30,        // °C for multiple days
    coldWave: 0          // °C for multiple days
  },
  precipitation: {
    heavy: 20,           // mm/day
    extreme: 50,         // mm/day
    hourlyHeavy: 10      // mm/hour
  },
  wind: {
    strong: 50,          // km/h
    extreme: 80          // km/h
  },
  weatherCodes: {
    dangerous: [95, 96, 99, 65, 75, 82], // Thunderstorms, heavy rain/snow, violent showers
    severe: [63, 73, 81, 45, 48]         // Moderate rain/snow, fog
  }
};

// Check if weather conditions are extreme or dangerous
function analyzeExtremeWeather(weatherData, location) {
  const alerts = [];
  const current = weatherData.current || {};
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;
  
  // Check current conditions
  if (current.temperature_2m !== undefined) {
    if (current.temperature_2m >= EXTREME_WEATHER_THRESHOLDS.temperature.extremeHot) {
      alerts.push({
        type: 'EXTREME_HEAT',
        severity: 'CRITICAL',
        message: `🔥 EXTREME HEAT WARNING: ${current.temperature_2m}°C - Hiking NOT recommended`
      });
    } else if (current.temperature_2m <= EXTREME_WEATHER_THRESHOLDS.temperature.extremeCold) {
      alerts.push({
        type: 'EXTREME_COLD',
        severity: 'CRITICAL',
        message: `🥶 EXTREME COLD WARNING: ${current.temperature_2m}°C - Risk of hypothermia`
      });
    }
  }
  
  // Check daily forecasts for extreme conditions
  for (let i = 0; i < Math.min(3, daily.time.length); i++) {
    const dayData = {
      date: daily.time[i],
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      precip: daily.precipitation_sum[i],
      weatherCode: daily.weathercode[i]
    };
    
    const dayName = getDayName(dayData.date);
    const relativeDay = getRelativeDayLabel(i);
    
    // Temperature extremes
    if (dayData.tempMax >= EXTREME_WEATHER_THRESHOLDS.temperature.extremeHot) {
      alerts.push({
        type: 'EXTREME_HEAT',
        severity: 'HIGH',
        day: dayName,
        relativeDay,
        message: `🔥 HEAT WARNING ${relativeDay}: ${dayData.tempMax}°C expected - High heat exhaustion risk`
      });
    }
    
    if (dayData.tempMin <= EXTREME_WEATHER_THRESHOLDS.temperature.extremeCold) {
      alerts.push({
        type: 'EXTREME_COLD',
        severity: 'HIGH',
        day: dayName,
        relativeDay,
        message: `🥶 COLD WARNING ${relativeDay}: ${dayData.tempMin}°C expected - Hypothermia risk`
      });
    }
    
    // Precipitation extremes
    if (dayData.precip >= EXTREME_WEATHER_THRESHOLDS.precipitation.extreme) {
      alerts.push({
        type: 'EXTREME_PRECIPITATION',
        severity: 'CRITICAL',
        day: dayName,
        relativeDay,
        message: `🌊 EXTREME RAIN WARNING ${relativeDay}: ${dayData.precip}mm expected - Flash flood risk`
      });
    } else if (dayData.precip >= EXTREME_WEATHER_THRESHOLDS.precipitation.heavy) {
      alerts.push({
        type: 'HEAVY_PRECIPITATION',
        severity: 'HIGH',
        day: dayName,
        relativeDay,
        message: `🌧️ HEAVY RAIN WARNING ${relativeDay}: ${dayData.precip}mm expected - Trail flooding possible`
      });
    }
    
    // Dangerous weather codes
    if (EXTREME_WEATHER_THRESHOLDS.weatherCodes.dangerous.includes(dayData.weatherCode)) {
      const condition = getWeatherDescription(dayData.weatherCode);
      alerts.push({
        type: 'DANGEROUS_CONDITIONS',
        severity: 'CRITICAL',
        day: dayName,
        relativeDay,
        message: `⚠️ DANGEROUS CONDITIONS ${relativeDay}: ${condition} - Hiking PROHIBITED`
      });
    } else if (EXTREME_WEATHER_THRESHOLDS.weatherCodes.severe.includes(dayData.weatherCode)) {
      const condition = getWeatherDescription(dayData.weatherCode);
      alerts.push({
        type: 'SEVERE_CONDITIONS',
        severity: 'HIGH',
        day: dayName,
        relativeDay,
        message: `⚠️ SEVERE CONDITIONS ${relativeDay}: ${condition} - Extreme caution required`
      });
    }
  }
  
  // Check for multi-day extreme patterns
  if (daily.time.length >= 3) {
    let consecutiveHot = 0;
    let consecutiveCold = 0;
    
    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
      if (daily.temperature_2m_max[i] >= EXTREME_WEATHER_THRESHOLDS.temperature.heatWave) {
        consecutiveHot++;
      } else {
        consecutiveHot = 0;
      }
      
      if (daily.temperature_2m_max[i] <= EXTREME_WEATHER_THRESHOLDS.temperature.coldWave) {
        consecutiveCold++;
      } else {
        consecutiveCold = 0;
      }
      
      if (consecutiveHot >= 3) {
        alerts.push({
          type: 'HEAT_WAVE',
          severity: 'HIGH',
          message: `🔥 HEAT WAVE ALERT: ${consecutiveHot} consecutive days above ${EXTREME_WEATHER_THRESHOLDS.temperature.heatWave}°C`
        });
        break;
      }
      
      if (consecutiveCold >= 3) {
        alerts.push({
          type: 'COLD_WAVE',
          severity: 'HIGH',
          message: `🥶 COLD WAVE ALERT: ${consecutiveCold} consecutive days below ${EXTREME_WEATHER_THRESHOLDS.temperature.coldWave}°C`
        });
        break;
      }
    }
  }
  
  return alerts;
}

// Send extreme weather alert
async function sendExtremeWeatherAlert(user, location, geo, alerts) {
  if (alerts.length === 0) return;
  
  // Sort alerts by severity (CRITICAL first)
  alerts.sort((a, b) => {
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  let message = `🚨 **EXTREME WEATHER ALERT** 🚨\n`;
  message += `📍 **Location**: ${geo.name}, ${geo.country}\n`;
  message += `⏰ **Alert Time**: ${new Date().toLocaleString('en-US', { timeZone: user.timezone || 'UTC' })}\n\n`;
  
  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = alerts.filter(a => a.severity === 'HIGH');
  
  if (criticalAlerts.length > 0) {
    message += `🔴 **CRITICAL ALERTS**:\n`;
    criticalAlerts.forEach(alert => {
      message += `• ${alert.message}\n`;
    });
    message += `\n`;
  }
  
  if (highAlerts.length > 0) {
    message += `🟡 **HIGH PRIORITY ALERTS**:\n`;
    highAlerts.forEach(alert => {
      message += `• ${alert.message}\n`;
    });
    message += `\n`;
  }
  
  // Add AI analysis for extreme weather
  const firstAlert = alerts[0];
  const geminiAnalysis = await analyzeExtremeWeatherWithGemini(alerts, location);
  
  if (geminiAnalysis) {
    message += `🤖 **AI Safety Analysis**:\n${geminiAnalysis}\n\n`;
  }
  
  message += `⚠️ **SAFETY RECOMMENDATIONS**:\n`;
  message += `• Cancel all outdoor activities\n`;
  message += `• Stay indoors and monitor weather updates\n`;
  message += `• Prepare emergency supplies\n`;
  message += `• Avoid travel unless absolutely necessary\n\n`;
  
  message += `📱 Stay safe and check weather updates regularly!`;
  
  const subject = `🚨 EXTREME WEATHER ALERT - ${geo.name} - ${criticalAlerts.length > 0 ? 'CRITICAL' : 'HIGH'} PRIORITY`;
  
  // Send to all available channels for critical alerts
  const channels = criticalAlerts.length > 0 ? ['telegram', 'email'] : user.channels;
  
  if (channels.includes('telegram') && user.telegram_chat_id) {
    await sendTelegram(user.telegram_chat_id, message);
  }
  if (channels.includes('email') && user.email) {
    await sendEmail(user.email, subject, message);
  }
  
  console.log(`🚨 Extreme weather alert sent to ${user.name} for ${location}`);
}

// AI analysis for extreme weather conditions
async function analyzeExtremeWeatherWithGemini(alerts, location) {
  if (!genAI) {
    console.warn('Gemini API key not set, skipping extreme weather AI analysis.');
    return null;
  }
  
  try {
    console.log(`🔍 Starting Gemini extreme weather analysis for ${location}`);
    
    const alertDescriptions = alerts.map(alert => `${alert.type}: ${alert.message}`).join('\n');
    
    const prompt = `
Analyze the following extreme weather alerts for ${location} and provide urgent safety recommendations:

EXTREME WEATHER ALERTS:
${alertDescriptions}

Please provide:
1. Immediate safety actions to take RIGHT NOW
2. Specific risks to human life and safety
3. What outdoor activities must be avoided completely
4. Emergency preparedness recommendations
5. When conditions might be safe again

Keep the response urgent, clear, and focused on life safety. This is an emergency weather situation.
`;

    console.log(`🔍 Sending extreme weather request to Gemini with model: gemini-2.5-flash`);
    
    // Use the correct API structure
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    console.log(`✅ Gemini extreme weather analysis completed`);
    return response.text;
  } catch (error) {
    console.error(`❌ Gemini extreme weather analysis error for ${location}:`);
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Fetch extended weather data including current conditions
async function getExtendedWeather(location) {
  const geo = await geocodeLocation(location);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=7&timezone=auto`;
  const response = await axios.get(url);
  return { geo, weather: response.data };
}

// Check and send extreme weather alerts for all users
async function checkExtremeWeatherForAllUsers() {
  try {
    console.log('🔍 Starting extreme weather check for all users...');
    const users = await loadUsers(); // Fixed: Added await
    console.log(`Checking extreme weather for ${users.length} users`);
    
    if (users.length === 0) {
      console.log('No users found for extreme weather check');
      return;
    }
    
    for (const user of users) {
      for (const location of user.locations) {
        try {
          console.log(`Checking extreme weather for ${user.name} at ${location}`);
          const { geo, weather } = await getExtendedWeather(location);
          const alerts = analyzeExtremeWeather(weather, location);
          
          if (alerts.length > 0) {
            console.log(`⚠️ Found ${alerts.length} extreme weather alerts for ${user.name} at ${location}`);
            await sendExtremeWeatherAlert(user, location, geo, alerts);
          } else {
            console.log(`✅ No extreme weather alerts for ${user.name} at ${location}`);
          }
        } catch (error) {
          console.error(`❌ Error checking extreme weather for ${user.name} at ${location}:`, error.message);
        }
      }
    }
    console.log('✅ Extreme weather check completed for all users');
  } catch (error) {
    console.error('❌ Error in checkExtremeWeatherForAllUsers:', error.message);
    throw error;
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

// Schedule extreme weather checks every 2 hours
function scheduleExtremeWeatherChecks() {
  cron.schedule('0 */2 * * *', () => {
    console.log(`[${new Date().toISOString()}] Running extreme weather check`);
    checkExtremeWeatherForAllUsers()
      .then(() => console.log(`[${new Date().toISOString()}] Extreme weather check completed`))
      .catch(err => console.error(`[${new Date().toISOString()}] Error in extreme weather check:`, err));
  });
  console.log('Scheduled extreme weather checks every 2 hours');
}

// Start Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Add JSON parsing middleware
app.use(express.json());

// Existing endpoints
app.get('/', (req, res) => {
  res.send('HikeCastBot is running and scheduling notifications!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Update test-notify to use database
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

// NEW USER MANAGEMENT API ENDPOINTS

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    // Remove sensitive information for API response
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      locations: user.locations,
      channels: user.channels,
      schedule: user.schedule,
      timezone: user.timezone,
      forecastDays: user.forecastDays,
      hasValidTelegramId: !!user.telegram_chat_id,
      hasValidEmail: !!user.email,
      hasValidWhatsApp: !!user.whatsapp,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
    res.json({
      status: 'success',
      users: sanitizedUsers,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get specific user
app.get('/users/:identifier', async (req, res) => {
  try {
    const user = await db.getUserByIdentifier(req.params.identifier);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Remove sensitive information
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      locations: user.locations,
      channels: user.channels,
      schedule: user.schedule,
      timezone: user.timezone,
      forecastDays: user.forecastDays,
      hasValidTelegramId: !!user.telegram_chat_id,
      hasValidEmail: !!user.email,
      hasValidWhatsApp: !!user.whatsapp,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    res.json({
      status: 'success',
      user: sanitizedUser
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Add new user
app.post('/users', async (req, res) => {
  try {
    const newUserData = req.body;
    
    // Validate user data
    const validationErrors = validateUserData(newUserData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check if user already exists
    const existingUser = await db.getUserByIdentifier(newUserData.name);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this name already exists'
      });
    }
    
    // Set defaults
    const userData = {
      name: newUserData.name.trim(),
      locations: newUserData.locations,
      channels: newUserData.channels,
      telegram_chat_id: newUserData.telegram_chat_id || null,
      email: newUserData.email || null,
      whatsapp: newUserData.whatsapp || null,
      schedule: newUserData.schedule || "0 7 * * *",
      timezone: newUserData.timezone || "UTC",
      forecastDays: newUserData.forecastDays || ["Saturday", "Sunday"]
    };
    
    const newUser = await db.addUser(userData);
    
    // Reschedule notifications to include new user
    await scheduleNotifications();
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        locations: newUser.locations,
        channels: newUser.channels,
        schedule: newUser.schedule,
        timezone: newUser.timezone,
        forecastDays: newUser.forecastDays
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update user
app.put('/users/:identifier', async (req, res) => {
  try {
    const updatedData = req.body;
    
    // Get current user first
    const currentUser = await db.getUserByIdentifier(req.params.identifier);
    if (!currentUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Merge and validate updated data
    const mergedData = { ...currentUser, ...updatedData };
    const validationErrors = validateUserData(mergedData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    const updatedUser = await db.updateUser(req.params.identifier, updatedData);
    
    // Reschedule notifications with updated user data
    await scheduleNotifications();
    
    res.json({
      status: 'success',
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        locations: updatedUser.locations,
        channels: updatedUser.channels,
        schedule: updatedUser.schedule,
        timezone: updatedUser.timezone,
        forecastDays: updatedUser.forecastDays
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
});

// Delete user
app.delete('/users/:identifier', async (req, res) => {
  try {
    const deletedUser = await db.deleteUser(req.params.identifier);
    
    // Reschedule notifications without deleted user
    await scheduleNotifications();
    
    res.json({
      status: 'success',
      message: 'User deleted successfully',
      deletedUser: {
        name: deletedUser.name
      }
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        status: 'error',
        message: error.message
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
});

// Test notification for specific user
app.post('/users/:identifier/test', async (req, res) => {
  try {
    const user = await db.getUserByIdentifier(req.params.identifier);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Send test notification
    await notifyUser(user);
    
    res.json({
      status: 'success',
      message: `Test notification sent to ${user.name}`
    });
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      status: 'error',
      message: `Failed to send notification: ${error.message}`
    });
  }
});

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

// Add new API endpoint for manual extreme weather check
app.get('/check-extreme-weather', async (req, res) => {
  try {
    await checkExtremeWeatherForAllUsers();
    res.json({ 
      status: 'success', 
      message: 'Extreme weather check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check environment and user data
app.get('/debug', async (req, res) => {
  try {
    console.log('🔍 Starting debug endpoint...');
    const users = await loadUsers(); // Add await here
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

// Update the app.listen section
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
    scheduleExtremeWeatherChecks();
    
    // Send notification to all users immediately at deployment
    console.log('Starting deployment notifications...');
    const users = await loadUsers();
    console.log(`Loaded ${users.length} users from database`);
    
    if (users.length === 0) {
      console.warn('No users found in database');
      return;
    }
    
    for (const user of users) {
      try {
        console.log(`Sending notification to ${user.name}`);
        await notifyUser(user);
        console.log(`✅ Notification sent to ${user.name}`);
      } catch (error) {
        console.error(`❌ Failed to notify ${user.name}:`, error.message);
      }
    }
    console.log('Deployment notifications completed.');
    
    // Check for extreme weather on startup
    console.log('Starting initial extreme weather check...');
    await checkExtremeWeatherForAllUsers();
    console.log('Initial extreme weather check completed.');
    
  } catch (err) {
    console.error('Error in startup process:', err.message);
    console.error('Stack trace:', err.stack);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
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
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Also add a simplified test endpoint that sends a short message:
app.get('/test-simple', async (req, res) => {
  try {
    console.log('🔍 Starting simple test...');
    
    // Test 1: Load users
    console.log('🔍 Test 1: Loading users...');
    const users = await loadUsers(); // Add await here
    console.log(`✅ Loaded ${users.length} users`);
    
    if (users.length === 0) {
      return res.json({ status: 'error', message: 'No users found' });
    }
    
    const user = users[0];
    console.log(`🔍 Testing with user: ${user.name}`);
    
    // Test 2: Get weather for first location only
    console.log('🔍 Test 2: Getting weather...');
    const location = user.locations[0];
    const { geo, weather } = await getWeather(location);
    console.log(`✅ Weather data received for ${location}`);
    
    // Test 3: Create a very simple message (no AI, minimal formatting)
    console.log('🔍 Test 3: Creating simple message...');
    const forecastDays = getRequestedForecastDays(weather, user);
    const dayData = forecastDays[0];
    
    const simpleMessage = `🏔️ Hiking Weather Test for ${geo.name}

📅 ${dayData.dayName}: ${dayData.tempMax}°C / ${dayData.tempMin}°C
🌧️ Precipitation: ${dayData.precip}mm
☁️ ${getWeatherDescription(dayData.weatherCode)}

✅ Test message sent successfully!`;
    
    console.log('✅ Simple message created');
    console.log('Message preview:', simpleMessage.substring(0, 200) + '...');
    
    // Test 4: Send only to Telegram (skip email for now)
    if (user.channels.includes('telegram') && user.telegram_chat_id) {
      console.log('🔍 Test 4: Sending to Telegram...');
      await sendTelegram(user.telegram_chat_id, simpleMessage);
      console.log('✅ Telegram message sent');
    }
    
    res.json({ 
      status: 'success', 
      message: 'Simple test completed successfully',
      location: geo.name,
      temperature: `${dayData.tempMax}°C / ${dayData.tempMin}°C`,
      messageLength: simpleMessage.length
    });
    
  } catch (error) {
    console.error('❌ Simple test failed:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      stack: error.stack
    });
  }
});

// Fix the test-telegram-only endpoint
app.get('/test-telegram-only', async (req, res) => {
  try {
    console.log('🔍 Starting Telegram-only test...');
    
    const users = await loadUsers(); // Add await here
    if (users.length === 0) {
      return res.json({ status: 'error', message: 'No users found' });
    }
    
    const user = users[0];
    const location = user.locations[0];
    
    // Get basic weather data
    const { geo, weather } = await getWeather(location);
    const forecastDays = getRequestedForecastDays(weather, user);
    const dayData = forecastDays[0];
    
    // Create very basic message without any complex formatting
    const basicMessage = `🏔️ Weather Test for ${geo.name}

📅 ${dayData.dayName}
🌡️ ${dayData.tempMax}°C / ${dayData.tempMin}°C
🌧️ ${dayData.precip}mm
☁️ ${getWeatherDescription(dayData.weatherCode)}

Test completed at ${new Date().toLocaleTimeString()}`;
    
    console.log(`Message length: ${basicMessage.length}`);
    console.log('Message content:', basicMessage);
    
    if (user.channels.includes('telegram') && user.telegram_chat_id) {
      await sendTelegram(user.telegram_chat_id, basicMessage);
    }
    
    res.json({ 
      status: 'success', 
      message: 'Telegram test completed',
      messageLength: basicMessage.length,
      location: geo.name
    });
    
  } catch (error) {
    console.error('❌ Telegram test failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Fix the test-ultra-simple endpoint
app.get('/test-ultra-simple', async (req, res) => {
  try {
    console.log('🔍 Starting ultra-simple test...');
    
    const users = await loadUsers(); // Add await here
    if (users.length === 0) {
      return res.json({ status: 'error', message: 'No users found' });
    }
    
    const user = users[0];
    
    // Create the simplest possible message
    const ultraSimpleMessage = `HikeCast Test Message

Hello ${user.name}!

This is a test from your HikeCast bot.
Time: ${new Date().toLocaleString()}

If you receive this, the Telegram integration is working!`;
    
    console.log(`🔍 Message length: ${ultraSimpleMessage.length}`);
    console.log(`🔍 Message content:\n${ultraSimpleMessage}`);
    
    if (user.channels.includes('telegram') && user.telegram_chat_id) {
      await sendTelegram(user.telegram_chat_id, ultraSimpleMessage);
    }
    
    res.json({ 
      status: 'success', 
      message: 'Ultra-simple test completed',
      messageLength: ultraSimpleMessage.length
    });
    
  } catch (error) {
    console.error('❌ Ultra-simple test failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Add a test endpoint specifically for Gemini API:
app.get('/test-gemini', async (req, res) => {
  try {
    console.log('🔍 Testing Gemini API...');
    
    if (!genAI) {
      return res.json({ 
        status: 'error', 
        message: 'Gemini API key not set' 
      });
    }
    
    const testPrompt = `
Test prompt for Gemini API.

Please respond with:
1. Current time and date
2. A brief message confirming the API is working
3. The model you are using

Keep the response short and simple.
`;
    
    console.log(`🔍 Sending test request to Gemini...`);
    
    // Use the correct API structure
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: testPrompt,
    });
    
    console.log(`✅ Gemini test response received`);
    console.log(`Response: ${response.text.substring(0, 200)}...`);
    
    res.json({
      status: 'success',
      message: 'Gemini API test completed',
      model: 'gemini-2.5-flash',
      responseLength: response.text.length,
      responsePreview: response.text.substring(0, 300) + (response.text.length > 300 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message,
      error_type: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
});

// Add this endpoint for a simple web interface
app.get('/dashboard', (req, res) => {
  const dashboardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>HikeCast User Management Dashboard</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 20px; 
            text-align: center;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px; 
        }
        .stat-card { 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; margin-top: 5px; }
        
        .actions { 
            display: flex; 
            gap: 10px; 
            margin-bottom: 20px; 
            flex-wrap: wrap;
        }
        .btn { 
            padding: 10px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .btn-info { background: #17a2b8; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        
        .user-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
            gap: 20px; 
        }
        .user-card { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            border-left: 4px solid #667eea;
        }
        .user-header { 
            font-size: 1.5em; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .user-details { margin-bottom: 15px; }
        .detail-row { 
            display: flex; 
            margin: 8px 0; 
            align-items: center;
        }
        .detail-label { 
            font-weight: bold; 
            min-width: 120px; 
            color: #555; 
        }
        .detail-value { flex: 1; }
        .channels, .locations, .forecast-days { 
            display: flex; 
            gap: 5px; 
            flex-wrap: wrap; 
        }
        .tag { 
            padding: 3px 8px; 
            border-radius: 12px; 
            font-size: 0.85em; 
            font-weight: bold;
        }
        .channel-telegram { background: #e3f2fd; color: #1976d2; }
        .channel-email { background: #f3e5f5; color: #7b1fa2; }
        .channel-whatsapp { background: #e8f5e8; color: #388e3c; }
        .location-tag { background: #fff3e0; color: #f57c00; }
        .day-tag { background: #e1f5fe; color: #0277bd; }
        .status-indicator { 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            display: inline-block; 
            margin-left: 5px;
        }
        .status-online { background: #4caf50; }
        .status-offline { background: #f44336; }
        
        .modal { 
            display: none; 
            position: fixed; 
            z-index: 1000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0,0,0,0.5); 
        }
        .modal-content { 
            background-color: white; 
            margin: 5% auto; 
            padding: 20px; 
            border-radius: 10px; 
            width: 90%; 
            max-width: 600px; 
            max-height: 80vh; 
            overflow-y: auto;
        }
        .modal-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #eee;
        }
        .close { 
            color: #aaa; 
            font-size: 28px; 
            font-weight: bold; 
            cursor: pointer; 
        }
        .close:hover { color: black; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: bold; 
            color: #333;
        }
        .form-group input, .form-group select, .form-group textarea { 
            width: 100%; 
            padding: 10px; 
            border: 2px solid #ddd; 
            border-radius: 5px; 
            font-size: 14px;
            box-sizing: border-box;
        }
        .form-group input:focus, .form-group select:focus { 
            border-color: #667eea; 
            outline: none; 
        }
        .checkbox-group { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 10px; 
        }
        .checkbox-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
        }
        .checkbox-item input[type="checkbox"] { 
            width: auto; 
            margin: 0;
        }
        
        .status { 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 5px; 
            display: none;
        }
        .status.success { 
            background: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb; 
        }
        .status.error { 
            background: #f8d7da; 
            color: #721c24; 
            border: 1px solid #f5c6cb; 
        }
        .status.info { 
            background: #d1ecf1; 
            color: #0c5460; 
            border: 1px solid #bee5eb; 
        }
        
        .loading { 
            text-align: center; 
            padding: 40px; 
            color: #666; 
        }
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #667eea; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .form-help { 
            font-size: 0.85em; 
            color: #666; 
            margin-top: 5px; 
        }
        .required { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏔️ HikeCast User Management Dashboard</h1>
            <p>Manage hiking weather notification users and settings</p>
        </div>
        
        <div class="stats" id="stats-container">
            <div class="stat-card">
                <div class="stat-number" id="total-users">-</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="telegram-users">-</div>
                <div class="stat-label">Telegram Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="email-users">-</div>
                <div class="stat-label">Email Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="whatsapp-users">-</div>
                <div class="stat-label">WhatsApp Users</div>
            </div>
        </div>
        
        <div class="actions">
            <button class="btn btn-primary" onclick="openAddUserModal()">+ Add New User</button>
            <button class="btn btn-success" onclick="testAllUsers()">Test All Users</button>
            <button class="btn btn-warning" onclick="checkExtremeWeather()">Check Extreme Weather</button>
            <button class="btn btn-info" onclick="backupDatabase()">Backup Database</button>
            <button class="btn btn-secondary" onclick="refreshData()">🔄 Refresh</button>
        </div>
        
        <div id="status" class="status"></div>
        
        <div class="user-grid" id="users-container">
            <div class="loading">
                <div class="spinner"></div>
                Loading users...
            </div>
        </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div id="userModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modal-title">Add New User</h2>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <form id="userForm">
                <div class="form-group">
                    <label for="name">Name <span class="required">*</span></label>
                    <input type="text" id="name" name="name" required>
                    <div class="form-help">Unique identifier for the user</div>
                </div>
                
                <div class="form-group">
                    <label for="locations">Locations <span class="required">*</span></label>
                    <textarea id="locations" name="locations" rows="3" placeholder="Stuttgart, Germany&#10;Munich, Germany&#10;Berlin, Germany" required></textarea>
                    <div class="form-help">Enter one location per line (e.g., "Stuttgart, Germany")</div>
                </div>
                
                <div class="form-group">
                    <label>Notification Channels <span class="required">*</span></label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="channel-telegram" name="channels" value="telegram">
                            <label for="channel-telegram">📱 Telegram</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="channel-email" name="channels" value="email">
                            <label for="channel-email">📧 Email</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="channel-whatsapp" name="channels" value="whatsapp">
                            <label for="channel-whatsapp">📞 WhatsApp</label>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="telegram_chat_id">Telegram Chat ID</label>
                    <input type="text" id="telegram_chat_id" name="telegram_chat_id" placeholder="-4696289808">
                    <div class="form-help">Required if Telegram channel is selected. Get from @userinfobot</div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="user@example.com">
                    <div class="form-help">Required if Email channel is selected</div>
                </div>
                
                <div class="form-group">
                    <label for="whatsapp">WhatsApp Number</label>
                    <input type="text" id="whatsapp" name="whatsapp" placeholder="+4915225644687">
                    <div class="form-help">Required if WhatsApp channel is selected. Include country code</div>
                </div>
                
                <div class="form-group">
                    <label for="schedule">Schedule (Cron Format)</label>
                    <input type="text" id="schedule" name="schedule" value="0 7 * * *" placeholder="0 7 * * *">
                    <div class="form-help">
                        Examples: "0 7 * * *" (daily 7am), "0 7,18 * * *" (7am & 6pm), "0 8 * * 6,0" (weekends 8am)
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="timezone">Timezone</label>
                    <select id="timezone" name="timezone">
                        <option value="UTC">UTC</option>
                        <option value="Europe/Berlin">Europe/Berlin</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="America/Los_Angeles">America/Los_Angeles</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Asia/Shanghai">Asia/Shanghai</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Forecast Days</label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-monday" name="forecastDays" value="Monday">
                            <label for="day-monday">Monday</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-tuesday" name="forecastDays" value="Tuesday">
                            <label for="day-tuesday">Tuesday</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-wednesday" name="forecastDays" value="Wednesday">
                            <label for="day-wednesday">Wednesday</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-thursday" name="forecastDays" value="Thursday">
                            <label for="day-thursday">Thursday</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-friday" name="forecastDays" value="Friday">
                            <label for="day-friday">Friday</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-saturday" name="forecastDays" value="Saturday">
                            <label for="day-saturday">Saturday</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="day-sunday" name="forecastDays" value="Sunday">
                            <label for="day-sunday">Sunday</label>
                        </div>
                    </div>
                    <div class="form-help">Select which days to receive weather forecasts</div>
                </div>
                
                <div style="text-align: right; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="save-btn">Save User</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let currentEditingUser = null;
        let allUsers = [];

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadUsers();
            loadStats();
        });

        function showStatus(message, type = 'success') {
            const status = document.getElementById('status');
            status.innerHTML = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            setTimeout(() => status.style.display = 'none', 5000);
        }

        async function loadStats() {
            try {
                const response = await fetch('/database/stats');
                const data = await response.json();
                if (data.status === 'success') {
                    document.getElementById('total-users').textContent = data.stats.totalUsers;
                    document.getElementById('telegram-users').textContent = data.stats.telegramUsers;
                    document.getElementById('email-users').textContent = data.stats.emailUsers;
                    document.getElementById('whatsapp-users').textContent = data.stats.whatsappUsers;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function loadUsers() {
            try {
                const response = await fetch('/users');
                const data = await response.json();
                if (data.status === 'success') {
                    allUsers = data.users;
                    displayUsers(data.users);
                } else {
                    showStatus('Failed to load users: ' + data.message, 'error');
                }
            } catch (error) {
                showStatus('Error loading users: ' + error.message, 'error');
            }
        }

        function displayUsers(users) {
            const container = document.getElementById('users-container');
            if (users.length === 0) {
                container.innerHTML = '<div class="loading">No users found. Add your first user!</div>';
                return;
            }

            container.innerHTML = users.map(user => \`
                <div class="user-card">
                    <div class="user-header">
                        <span>\${user.name}</span>
                        <div>
                            <button class="btn btn-info" onclick="testUser('\${user.name}')" title="Test Notification">🧪</button>
                            <button class="btn btn-success" onclick="editUser('\${user.name}')" title="Edit User">✏️</button>
                            <button class="btn btn-danger" onclick="deleteUser('\${user.name}')" title="Delete User">🗑️</button>
                        </div>
                    </div>
                    <div class="user-details">
                        <div class="detail-row">
                            <span class="detail-label">📍 Locations:</span>
                            <div class="detail-value">
                                <div class="locations">
                                    \${user.locations.map(loc => \`<span class="tag location-tag">\${loc}</span>\`).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📱 Channels:</span>
                            <div class="detail-value">
                                <div class="channels">
                                    \${user.channels.map(ch => \`<span class="tag channel-\${ch}">\${ch}</span>\`).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">⏰ Schedule:</span>
                            <div class="detail-value">
                                <code>\${user.schedule}</code> (\${user.timezone})
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📅 Forecast Days:</span>
                            <div class="detail-value">
                                <div class="forecast-days">
                                    \${(user.forecastDays || []).map(day => \`<span class="tag day-tag">\${day}</span>\`).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">🔗 Status:</span>
                            <div class="detail-value">
                                Telegram: \${user.hasValidTelegramId ? '✅' : '❌'}
                                <span class="status-indicator \${user.hasValidTelegramId ? 'status-online' : 'status-offline'}"></span>
                                | Email: \${user.hasValidEmail ? '✅' : '❌'}
                                <span class="status-indicator \${user.hasValidEmail ? 'status-online' : 'status-offline'}"></span>
                                | WhatsApp: \${user.hasValidWhatsApp ? '✅' : '❌'}
                                <span class="status-indicator \${user.hasValidWhatsApp ? 'status-online' : 'status-offline'}"></span>
                            </div>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📊 Created:</span>
                            <div class="detail-value">
                                \${new Date(user.created_at).toLocaleDateString()} \${user.updated_at !== user.created_at ? '(Updated: ' + new Date(user.updated_at).toLocaleDateString() + ')' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function openAddUserModal() {
            currentEditingUser = null;
            document.getElementById('modal-title').textContent = 'Add New User';
            document.getElementById('save-btn').textContent = 'Add User';
            resetForm();
            document.getElementById('userModal').style.display = 'block';
        }

        async function editUser(userName) {
            try {
                const response = await fetch(\`/users/\${encodeURIComponent(userName)}\`);
                const data = await response.json();
                if (data.status === 'success') {
                    currentEditingUser = data.user;
                    document.getElementById('modal-title').textContent = 'Edit User: ' + userName;
                    document.getElementById('save-btn').textContent = 'Update User';
                    populateForm(data.user);
                    document.getElementById('userModal').style.display = 'block';
                } else {
                    showStatus('Failed to load user data: ' + data.message, 'error');
                }
            } catch (error) {
                showStatus('Error loading user: ' + error.message, 'error');
            }
        }

        function populateForm(user) {
            document.getElementById('name').value = user.name;
            document.getElementById('locations').value = user.locations.join('\\n');
            document.getElementById('telegram_chat_id').value = user.telegram_chat_id || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('whatsapp').value = user.whatsapp || '';
            document.getElementById('schedule').value = user.schedule || '0 7 * * *';
            document.getElementById('timezone').value = user.timezone || 'UTC';
            
            // Set channels
            document.querySelectorAll('input[name="channels"]').forEach(checkbox => {
                checkbox.checked = user.channels.includes(checkbox.value);
            });
            
            // Set forecast days
            document.querySelectorAll('input[name="forecastDays"]').forEach(checkbox => {
                checkbox.checked = (user.forecastDays || []).includes(checkbox.value);
            });
        }

        function resetForm() {
            document.getElementById('userForm').reset();
            document.getElementById('schedule').value = '0 7 * * *';
            document.getElementById('timezone').value = 'UTC';
            
            // Set default forecast days (Saturday, Sunday)
            document.getElementById('day-saturday').checked = true;
            document.getElementById('day-sunday').checked = true;
        }

        function closeModal() {
            document.getElementById('userModal').style.display = 'none';
            currentEditingUser = null;
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('userModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        document.getElementById('userForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const userData = {
                name: formData.get('name').trim(),
                locations: formData.get('locations').split('\\n').map(l => l.trim()).filter(l => l),
                channels: Array.from(formData.getAll('channels')),
                telegram_chat_id: formData.get('telegram_chat_id').trim() || null,
                email: formData.get('email').trim() || null,
                whatsapp: formData.get('whatsapp').trim() || null,
                schedule: formData.get('schedule').trim() || '0 7 * * *',
                timezone: formData.get('timezone') || 'UTC',
                forecastDays: Array.from(formData.getAll('forecastDays'))
            };

            try {
                const url = currentEditingUser ? \`/users/\${encodeURIComponent(currentEditingUser.name)}\` : '/users';
                const method = currentEditingUser ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    showStatus(result.message, 'success');
                    closeModal();
                    await loadUsers();
                    await loadStats();
                } else {
                    showStatus('Error: ' + (result.errors ? result.errors.join(', ') : result.message), 'error');
                }
            } catch (error) {
                showStatus('Error saving user: ' + error.message, 'error');
            }
        });

        async function deleteUser(userName) {
            if (!confirm(\`Are you sure you want to delete user "\${userName}"?\\n\\nThis action cannot be undone.\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/users/\${encodeURIComponent(userName)}\`, { 
                    method: 'DELETE' 
                });
                const data = await response.json();
                
                showStatus(data.message, data.status === 'success' ? 'success' : 'error');
                
                if (data.status === 'success') {
                    await loadUsers();
                    await loadStats();
                }
            } catch (error) {
                showStatus('Error deleting user: ' + error.message, 'error');
            }
        }

        async function testUser(userName) {
            showStatus('Sending test notification to ' + userName + '...', 'info');
            
            try {
                const response = await fetch(\`/users/\${encodeURIComponent(userName)}/test\`, { 
                    method: 'POST' 
                });
                const data = await response.json();
                showStatus(data.message, data.status === 'success' ? 'success' : 'error');
            } catch (error) {
                showStatus('Error testing user: ' + error.message, 'error');
            }
        }

        async function testAllUsers() {
            showStatus('Sending test notifications to all users...', 'info');
            
            try {
                const response = await fetch('/test-notify');
                const result = await response.text();
                showStatus('Test notifications sent to all users', 'success');
            } catch (error) {
                showStatus('Error testing all users: ' + error.message, 'error');
            }
        }

        async function checkExtremeWeather() {
            showStatus('Checking extreme weather for all users...', 'info');
            
            try {
                const response = await fetch('/check-extreme-weather');
                const data = await response.json();
                showStatus(data.message, data.status === 'success' ? 'success' : 'error');
            } catch (error) {
                showStatus('Error checking extreme weather: ' + error.message, 'error');
            }
        }

        async function backupDatabase() {
            showStatus('Creating database backup...', 'info');
            
            try {
                const response = await fetch('/database/backup', { method: 'POST' });
                const data = await response.json();
                showStatus(data.message + (data.backupPath ? ' (' + data.backupPath + ')' : ''), 
                          data.status === 'success' ? 'success' : 'error');
            } catch (error) {
                showStatus('Error creating backup: ' + error.message, 'error');
            }
        }

        async function refreshData() {
            showStatus('Refreshing data...', 'info');
            await loadUsers();
            await loadStats();
            showStatus('Data refreshed successfully', 'success');
        }
    </script>
</body>
</html>`;
  
  res.send(dashboardHTML);
});