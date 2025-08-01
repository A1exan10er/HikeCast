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

// Analyze hourly weather patterns to identify short-duration dangerous weather
function analyzeHourlyWeatherPatterns(hourly, dayIndex = 0) {
  const patterns = {};
  
  if (!hourly || !hourly.time || !hourly.weathercode) {
    return patterns;
  }
  
  // Get hourly data for the specific day (24 hours starting from dayIndex * 24)
  const startHour = dayIndex * 24;
  const endHour = Math.min(startHour + 24, hourly.time.length);
  
  let dangerousHours = [];
  let severeHours = [];
  
  for (let h = startHour; h < endHour; h++) {
    const weatherCode = hourly.weathercode[h];
    const localHour = h - startHour; // Hour within the day (0-23)
    
    if (EXTREME_WEATHER_THRESHOLDS.weatherCodes.dangerous.includes(weatherCode)) {
      dangerousHours.push(localHour);
    } else if (EXTREME_WEATHER_THRESHOLDS.weatherCodes.severe.includes(weatherCode)) {
      severeHours.push(localHour);
    }
  }
  
  // Analyze patterns
  patterns.dangerousHours = dangerousHours;
  patterns.severeHours = severeHours;
  patterns.dangerousDuration = dangerousHours.length;
  patterns.severeDuration = severeHours.length;
  patterns.totalBadWeatherHours = dangerousHours.length + severeHours.length;
  
  // Determine if it's short-duration (less than 3 hours of dangerous weather)
  patterns.isShortDangerous = dangerousHours.length > 0 && dangerousHours.length <= 2;
  patterns.isShortSevere = severeHours.length > 0 && severeHours.length <= 3;
  
  // Find time windows for safe hiking
  patterns.safeHours = [];
  for (let h = 0; h < 24; h++) {
    const actualHour = startHour + h;
    if (actualHour < endHour) {
      const weatherCode = hourly.weathercode[actualHour];
      if (!EXTREME_WEATHER_THRESHOLDS.weatherCodes.dangerous.includes(weatherCode) &&
          !EXTREME_WEATHER_THRESHOLDS.weatherCodes.severe.includes(weatherCode)) {
        patterns.safeHours.push(h);
      }
    }
  }
  
  return patterns;
}

// Format time ranges for human-readable display
function formatTimeRanges(hours) {
  if (hours.length === 0) return '';
  
  hours.sort((a, b) => a - b);
  const ranges = [];
  let start = hours[0];
  let end = hours[0];
  
  for (let i = 1; i < hours.length; i++) {
    if (hours[i] === end + 1) {
      end = hours[i];
    } else {
      ranges.push(start === end ? `${start}:00` : `${start}:00-${end + 1}:00`);
      start = end = hours[i];
    }
  }
  ranges.push(start === end ? `${start}:00` : `${start}:00-${end + 1}:00`);
  
  return ranges.join(', ');
}

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
    
    // Dangerous weather codes - check hourly patterns first
    if (EXTREME_WEATHER_THRESHOLDS.weatherCodes.dangerous.includes(dayData.weatherCode)) {
      const hourlyPattern = analyzeHourlyWeatherPatterns(hourly, i);
      const condition = getWeatherDescription(dayData.weatherCode);
      
      if (hourlyPattern.isShortDangerous && hourlyPattern.dangerousDuration <= 2) {
        const dangerousTime = formatTimeRanges(hourlyPattern.dangerousHours);
        alerts.push({
          type: 'SHORT_DANGEROUS_CONDITIONS',
          severity: 'HIGH',
          day: dayName,
          relativeDay,
          hourlyPattern,
          message: `⚠️ SHORT-TERM ${condition.toUpperCase()} ${relativeDay}: Expected ${dangerousTime} (${hourlyPattern.dangerousDuration}h) - Plan around this window`
        });
        
        // Add safe time suggestions if there are good windows
        if (hourlyPattern.safeHours.length >= 6) {
          const safeTime = formatTimeRanges(hourlyPattern.safeHours.slice(0, 12)); // Show first 12 safe hours
          alerts.push({
            type: 'SAFE_HIKING_WINDOWS',
            severity: 'LOW',
            day: dayName,
            relativeDay,
            message: `✅ SAFE HIKING WINDOWS ${relativeDay}: ${safeTime} - Good conditions for outdoor activities`
          });
        }
      } else {
        alerts.push({
          type: 'DANGEROUS_CONDITIONS',
          severity: 'CRITICAL',
          day: dayName,
          relativeDay,
          message: `⚠️ DANGEROUS CONDITIONS ${relativeDay}: ${condition} - Extended bad weather, hiking NOT recommended`
        });
      }
    } else if (EXTREME_WEATHER_THRESHOLDS.weatherCodes.severe.includes(dayData.weatherCode)) {
      const hourlyPattern = analyzeHourlyWeatherPatterns(hourly, i);
      const condition = getWeatherDescription(dayData.weatherCode);
      
      if (hourlyPattern.isShortSevere && hourlyPattern.severeDuration <= 3) {
        const severeTime = formatTimeRanges(hourlyPattern.severeHours);
        alerts.push({
          type: 'SHORT_SEVERE_CONDITIONS',
          severity: 'MEDIUM',
          day: dayName,
          relativeDay,
          hourlyPattern,
          message: `⚠️ SHORT-TERM ${condition.toUpperCase()} ${relativeDay}: Expected ${severeTime} (${hourlyPattern.severeDuration}h) - Caution during this period`
        });
      } else {
        alerts.push({
          type: 'SEVERE_CONDITIONS',
          severity: 'HIGH',
          day: dayName,
          relativeDay,
          message: `⚠️ SEVERE CONDITIONS ${relativeDay}: ${condition} - Extreme caution required`
        });
      }
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
  const mediumAlerts = alerts.filter(a => a.severity === 'MEDIUM');
  const lowAlerts = alerts.filter(a => a.severity === 'LOW');
  
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
  
  if (mediumAlerts.length > 0) {
    message += `🟠 **MEDIUM PRIORITY ALERTS**:\n`;
    mediumAlerts.forEach(alert => {
      message += `• ${alert.message}\n`;
    });
    message += `\n`;
  }
  
  if (lowAlerts.length > 0) {
    message += `🟢 **HELPFUL INFORMATION**:\n`;
    lowAlerts.forEach(alert => {
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
  
  // Provide different recommendations based on alert severity
  const hasShortDangerous = alerts.some(a => a.type === 'SHORT_DANGEROUS_CONDITIONS');
  const hasShortSevere = alerts.some(a => a.type === 'SHORT_SEVERE_CONDITIONS');
  const hasSafeWindows = alerts.some(a => a.type === 'SAFE_HIKING_WINDOWS');
  
  if (criticalAlerts.length > 0 && !hasShortDangerous) {
    // Critical alerts with extended bad weather
    message += `• Cancel all outdoor activities for the affected period\n`;
    message += `• Stay indoors and monitor weather updates\n`;
    message += `• Prepare emergency supplies\n`;
    message += `• Avoid travel unless absolutely necessary\n`;
  } else if (hasShortDangerous || hasShortSevere) {
    // Short-duration bad weather with safe windows
    message += `• Plan activities around the short-term bad weather window\n`;
    message += `• Monitor real-time weather updates before departing\n`;
    message += `• Have emergency shelter plans for unexpected weather changes\n`;
    message += `• Consider shorter hikes with easy escape routes\n`;
    if (hasSafeWindows) {
      message += `• Take advantage of the safe hiking windows indicated above\n`;
    }
  } else {
    // Standard recommendations for other alerts
    message += `• Exercise increased caution during outdoor activities\n`;
    message += `• Monitor weather conditions regularly\n`;
    message += `• Prepare appropriate gear for conditions\n`;
    message += `• Have backup plans ready\n`;
  }
  
  message += `\n📱 Stay safe and check weather updates regularly!`;
  
  // Adjust subject and priority based on short-duration vs extended alerts
  let priority = 'HIGH';
  if (criticalAlerts.length > 0 && !hasShortDangerous) {
    priority = 'CRITICAL';
  } else if (hasShortDangerous || hasShortSevere) {
    priority = 'TIMING-SENSITIVE';
  }
  
  const subject = `🚨 EXTREME WEATHER ALERT - ${geo.name} - ${priority} PRIORITY`;
  
  // Send to all available channels for critical alerts (but not for short-duration alerts)
  const channels = (criticalAlerts.length > 0 && !hasShortDangerous) ? ['telegram', 'email'] : user.channels;
  
  if (channels.includes('telegram') && user.telegram_chat_id) {
    await sendTelegram(user.telegram_chat_id, message);
  }
  if (channels.includes('email') && user.email) {
    await sendEmail(user.email, subject, message);
  }
  
  console.log(`🚨 Extreme weather alert sent to ${user.name} for ${location}`);
}

// Send status update when no extreme weather is detected
async function sendExtremeWeatherStatusUpdate(user, location, geo) {
  const timestamp = new Date().toISOString();
  const subject = `✅ HikeCast: Weather Status Update for ${location}`;
  
  const message = `🌤️ **Weather Status Update**

📍 **Location**: ${location}
🔍 **Check Time**: ${new Date().toLocaleString()}
✅ **Status**: No extreme weather alerts detected

Good news! Current weather conditions are within normal parameters for hiking and outdoor activities.

📊 **System Status**: 
• Extreme weather monitoring is active
• Automatic checks are running as scheduled
• This message confirms your alerts are working properly

🎯 **Next Actions**:
• Continue with your planned outdoor activities
• Regular monitoring will continue automatically
• You'll be notified immediately if conditions change

---
📱 HikeCast Weather Monitoring System
⏰ Generated: ${timestamp}`;

  const channels = user.channels || ['telegram', 'email'];
  
  if (channels.includes('telegram') && user.telegram_chat_id) {
    await sendTelegram(user.telegram_chat_id, message);
  }
  if (channels.includes('email') && user.email) {
    await sendEmail(user.email, subject, message);
  }
  
  console.log(`✅ Weather status update sent to ${user.name} for ${location}`);
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
            // Send a status notification to confirm the feature is working
            await sendExtremeWeatherStatusUpdate(user, location, geo);
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
            // Send a status notification to confirm the feature is working
            await sendExtremeWeatherStatusUpdate(user, location, geo);
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
  sendExtremeWeatherStatusUpdate,
  checkExtremeWeatherForEnabledUsers,
  checkSpecificUsersExtremeWeather
};
