// services/forecastService.js
const { getWeather, getWeatherDescription, getBasicWeatherAssessment } = require('./weatherService');
const { analyzeWeatherWithGemini } = require('./aiService');
const { sendTelegram, sendEmail } = require('./notificationService');
const { getDayName, getFormattedDate, getRelativeDayLabel } = require('../utils/dateUtils');

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
        
        // Include AI analysis only if user has it enabled
        if (user.enableAIAnalysis !== false) {
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
        } else {
          // User has disabled AI analysis, show basic assessment only
          message += `📊 **Weather Summary**: ${getBasicWeatherAssessment(dayData)}`;
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

module.exports = {
  getRequestedForecastDays,
  notifyUser
};
