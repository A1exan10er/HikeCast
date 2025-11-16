// services/conversationService.js
const { getWeather } = require('./weatherService');

/**
 * Handle incoming user messages and generate appropriate responses
 */
async function handleUserMessage(message, userId) {
  const text = message.toLowerCase().trim();
  
  // Command handlers
  if (text === '/start' || text === '/help') {
    return getHelpMessage();
  }
  
  if (text === '/status') {
    return await getStatusMessage(userId);
  }
  
  // Weather query detection
  if (isWeatherQuery(text)) {
    return await handleWeatherQuery(text, userId);
  }
  
  // General AI-powered response
  return await handleGeneralQuery(text);
}

/**
 * Check if message is a weather-related query
 */
function isWeatherQuery(text) {
  const weatherKeywords = [
    'weather', 'forecast', 'rain', 'temperature', 'wind',
    'hiking', 'conditions', 'tomorrow', 'today', 'weekend',
    'sunny', 'cloudy', 'snow', 'storm', 'hot', 'cold'
  ];
  
  return weatherKeywords.some(keyword => text.includes(keyword));
}

/**
 * Handle weather-specific queries
 */
async function handleWeatherQuery(query, userId) {
  try {
    // Extract location from query or use user's default location
    const location = await extractLocationFromQuery(query, userId);
    
    if (!location) {
      return "I'd love to help with the weather! Which location are you asking about? You can say something like:\n\n" +
             "• 'What's the weather in Stuttgart?'\n" +
             "• 'Will it rain tomorrow in Munich?'\n" +
             "• 'Hiking conditions for Berlin this weekend'";
    }
    
    const { geo, weather } = await getWeather(location);
    
    // Use AI to answer the specific query
    const response = await generateAIWeatherResponse(query, geo, weather);
    
    return `📍 ${geo.name}, ${geo.country}\n\n${response}`;
    
  } catch (error) {
    console.error('Error handling weather query:', error);
    return "I'm having trouble checking the weather right now. Please try again in a moment!";
  }
}

/**
 * Generate AI-powered weather response
 */
async function generateAIWeatherResponse(query, geo, weather) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are HikeCast, a friendly hiking weather assistant. 

User asked: "${query}"

Location: ${geo.name}, ${geo.country}

Current weather:
- Temperature: ${weather.current.temperature_2m}°C
- Weather: ${weather.current.weather_code}
- Wind Speed: ${weather.current.wind_speed_10m} km/h
- Precipitation: ${weather.current.precipitation} mm

Next 3 days forecast:
${weather.daily.time.slice(0, 3).map((date, i) => 
  `Day ${i + 1} (${date}): Temp ${weather.daily.temperature_2m_min[i]}°C - ${weather.daily.temperature_2m_max[i]}°C, Precipitation ${weather.daily.precipitation_sum[i]}mm`
).join('\n')}

Provide a helpful, conversational answer to their specific question. Keep it natural, friendly, and concise (2-4 sentences). Focus on what they asked about.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback to basic response
    return `Current temperature: ${weather.current.temperature_2m}°C\nWind: ${weather.current.wind_speed_10m} km/h\n\nLooks like ${weather.current.precipitation > 0 ? 'rainy' : 'dry'} conditions!`;
  }
}

/**
 * Extract location from user query or database
 */
async function extractLocationFromQuery(query, userId) {
  // Try to extract location from query
  // Match patterns like "in Stuttgart", "for Berlin", "at Munich"
  const locationPatterns = [
    /\bin\s+([a-zA-Z][a-zA-Z\s,]+?)(?:\?|$|\s+tomorrow|\s+today|\s+tonight|\s+weekend)/i,
    /\bfor\s+([a-zA-Z][a-zA-Z\s,]+?)(?:\?|$|\s+tomorrow|\s+today|\s+tonight|\s+weekend)/i,
    /\bat\s+([a-zA-Z][a-zA-Z\s,]+?)(?:\?|$|\s+tomorrow|\s+today|\s+tonight|\s+weekend)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      let location = match[1].trim();
      // Remove any trailing time-related words that might have been caught
      location = location.replace(/\b(tomorrow|today|tonight|weekend|this|next|morning|afternoon|evening|night)$/gi, '').trim();
      if (location && location.length > 1) {
        return location;
      }
    }
  }
  
  // Try to get user's saved locations
  try {
    const UserDatabase = require('../database');
    const db = new UserDatabase();
    const user = await db.getUserByIdentifier(userId);
    
    if (user && user.locations && user.locations.length > 0) {
      return user.locations[0]; // Use first saved location
    }
  } catch (error) {
    console.error('Error fetching user locations:', error);
  }
  
  return null;
}

/**
 * Handle general queries using AI
 */
async function handleGeneralQuery(query) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are HikeCast, a friendly hiking weather assistant. A user asked: "${query}"

Provide a helpful, conversational response. If it's not weather-related, politely guide them back to weather topics or suggest using /help. Keep it brief and friendly (2-3 sentences).`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Error with AI response:', error);
    return "I'm here to help with hiking weather questions! Try asking me about the weather, or type /help to see what I can do.";
  }
}

/**
 * Get help message
 */
function getHelpMessage() {
  return `🏔️ HikeCast Weather Bot - Help

I can help you with:

📍 Weather Queries
• "What's the weather in Stuttgart?"
• "Will it rain tomorrow in Munich?"
• "Hiking conditions for Berlin this weekend"

⚙️ Commands
• /start - Welcome message
• /help - Show this help message
• /status - Check your notification settings

💬 Just Ask!
Feel free to ask me anything about weather and hiking conditions. I'll do my best to help!

🔔 Scheduled Notifications
You're receiving scheduled weather forecasts. Visit the dashboard to manage your settings.`;
}

/**
 * Get status message for a user
 */
async function getStatusMessage(userId) {
  try {
    const UserDatabase = require('../database');
    const db = new UserDatabase();
    const user = await db.getUserByIdentifier(userId);
    
    if (!user) {
      return "I couldn't find your user settings. Please contact the administrator or visit the dashboard to set up your account.";
    }
    
    const locationsText = user.locations && user.locations.length > 0 
      ? user.locations.join(', ') 
      : 'None set';
    const channelsText = user.channels && user.channels.length > 0
      ? user.channels.join(', ')
      : 'None set';
    const aiStatus = user.enableAIAnalysis ? 'Enabled' : 'Disabled';
    const extremeWeatherStatus = user.enableExtremeWeatherAlerts ? 'Enabled' : 'Disabled';
    
    return `⚙️ Your HikeCast Settings

📍 Locations: ${locationsText}
📱 Channels: ${channelsText}
📅 Schedule: ${user.schedule || 'Not set'}
🌍 Timezone: ${user.timezone || 'UTC'}
🤖 AI Analysis: ${aiStatus}
🚨 Extreme Weather Alerts: ${extremeWeatherStatus}

💬 Need to change something? Visit the dashboard or contact the administrator.`;
    
  } catch (error) {
    console.error('Error fetching user status:', error);
    return "I couldn't retrieve your settings right now. Please try again later!";
  }
}

module.exports = {
  handleUserMessage,
  getHelpMessage,
  getStatusMessage
};
