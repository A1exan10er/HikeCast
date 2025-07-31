// utils/dateUtils.js

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

module.exports = {
  getDayName,
  getFormattedDate,
  getRelativeDayLabel
};
