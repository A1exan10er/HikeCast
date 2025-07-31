// services/extremeWeatherService.js
const { getExtendedWeather, getWeatherDescription } = require('./weatherService');
const { analyzeExtremeWeatherWithGemini } = require('./aiService');
const { sendTelegram, sendEmail } = require('./notificationService');
const { getDayName, getRelativeDayLabel } = require('../utils/dateUtils');

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
  
  // Add AI analysis for extreme weather only if user has it enabled
  if (user.enableAIAnalysis !== false) {
    try {
      const geminiAnalysis = await analyzeExtremeWeatherWithGemini(alerts, location);
      
      if (geminiAnalysis) {
        message += `🤖 **AI Safety Analysis**:\n${geminiAnalysis}\n\n`;
      } else {
        message += `📊 **Basic Safety Assessment**: Weather conditions pose significant risk. Follow safety recommendations below.\n\n`;
      }
    } catch (error) {
      console.error(`Gemini extreme weather analysis failed:`, error.message);
      message += `📊 **Basic Safety Assessment**: Weather conditions pose significant risk. Follow safety recommendations below.\n\n`;
    }
  } else {
    // User has disabled AI analysis, show basic assessment only
    message += `📊 **Safety Assessment**: Extreme weather conditions detected. Follow safety recommendations below.\n\n`;
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

// Check and send extreme weather alerts for users who have enabled them
async function checkExtremeWeatherForEnabledUsers(loadUsers) {
  try {
    console.log('🔍 Starting extreme weather check for enabled users...');
    const users = await loadUsers();
    
    // Filter users who have extreme weather alerts enabled
    const enabledUsers = users.filter(user => user.enableExtremeWeatherAlerts !== false);
    console.log(`Checking extreme weather for ${enabledUsers.length} of ${users.length} users with alerts enabled`);
    
    if (enabledUsers.length === 0) {
      console.log('No users have extreme weather alerts enabled');
      return;
    }
    
    for (const user of enabledUsers) {
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
    console.log('✅ Extreme weather check completed for enabled users');
  } catch (error) {
    console.error('❌ Error in checkExtremeWeatherForEnabledUsers:', error.message);
    throw error;
  }
}

// Check extreme weather for specific users
async function checkSpecificUsersExtremeWeather(users) {
  try {
    console.log(`🔍 Starting extreme weather check for ${users.length} specific users...`);
    
    for (const user of users) {
      // Double-check that user still has alerts enabled
      if (user.enableExtremeWeatherAlerts === false) {
        console.log(`Skipping ${user.name} - extreme weather alerts disabled`);
        continue;
      }
      
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
    console.log('✅ Extreme weather check completed for specific users');
  } catch (error) {
    console.error('❌ Error in checkSpecificUsersExtremeWeather:', error.message);
    throw error;
  }
}

module.exports = {
  EXTREME_WEATHER_THRESHOLDS,
  analyzeExtremeWeather,
  sendExtremeWeatherAlert,
  checkExtremeWeatherForEnabledUsers,
  checkSpecificUsersExtremeWeather
};
