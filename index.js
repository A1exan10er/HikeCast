// index.js
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const cron = require('node-cron');
require('dotenv').config();
const nodemailer = require('nodemailer');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

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

// TODO: Implement WhatsApp notification
async function sendWhatsApp(phone, message) {
  // TODO: Integrate with Twilio or WhatsApp Business API
}

async function notifyUser(user) {
  for (const location of user.locations) {
    const { geo, weather } = await getWeather(location);
    // Get tomorrow's forecast (index 1)
    const dayIdx = 1; // 0 = today, 1 = tomorrow
    const date = weather.daily.time[dayIdx];
    const tempMax = weather.daily.temperature_2m_max[dayIdx];
    const tempMin = weather.daily.temperature_2m_min[dayIdx];
    const precip = weather.daily.precipitation_sum[dayIdx];
    const weatherCode = weather.daily.weathercode[dayIdx];
    const message = `Weather for *${geo.name}, ${geo.country}* on ${date}:\n- Max: ${tempMax}°C, Min: ${tempMin}°C\n- Precipitation: ${precip}mm\n- Weather code: ${weatherCode}`;
    if (user.channels.includes('telegram') && user.telegram_chat_id) {
      await sendTelegram(user.telegram_chat_id, message);
    }
    if (user.channels.includes('email') && user.email) {
      await sendEmail(user.email, `Hiking Weather for ${geo.name}`, message);
    }
    if (user.channels.includes('whatsapp') && user.whatsapp) {
      await sendWhatsApp(user.whatsapp, message);
    }
  }
}

function scheduleNotifications() {
  const users = loadUsers();
  users.forEach(user => {
    if (user.schedule) {
      cron.schedule(user.schedule, () => {
        notifyUser(user).catch(err => console.error(`Error notifying ${user.name}:`, err));
      }, {
        timezone: 'Etc/UTC' // You can adjust this or make it user-configurable
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

app.get('/test-notify', async (req, res) => {
  const users = loadUsers();
  for (const user of users) {
    await notifyUser(user);
  }
  res.send('Test notifications sent (check your email and Telegram)!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  scheduleNotifications();
}); 