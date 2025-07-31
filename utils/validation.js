// utils/validation.js
const cron = require('node-cron');

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
  
  if (userData.extremeWeatherCheckInterval && !cron.validate(userData.extremeWeatherCheckInterval)) {
    errors.push('Invalid extreme weather check interval (must be valid cron format)');
  }
  
  return errors;
}

module.exports = {
  validateUserData
};
