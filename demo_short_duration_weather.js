// demo_short_duration_weather.js
console.log('🌦️  HikeCast Short-Duration Weather Demo');
console.log('======================================\n');

const { analyzeExtremeWeather } = require('./services/extremeWeatherService');

// Demo function to show before/after comparison
function demonstrateWeatherAnalysis() {
  console.log('📋 SCENARIO: Thunderstorm predicted for 2-3 PM today\n');
  
  // Create realistic weather data
  const baseTime = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
  
  const weatherData = {
    current: {
      temperature_2m: 24,
      weathercode: 1 // Currently clear
    },
    daily: {
      time: [baseTime.split('T')[0]],
      temperature_2m_max: [27],
      temperature_2m_min: [19],
      precipitation_sum: [8],
      weathercode: [95] // Daily shows thunderstorm
    },
    hourly: {
      time: Array.from({length: 24}, (_, i) => 
        new Date(Date.parse(baseTime) + i * 60 * 60 * 1000).toISOString()
      ),
      weathercode: Array.from({length: 24}, (_, i) => {
        // Thunderstorm only 2-3 PM (hours 14-15)
        return (i >= 14 && i <= 15) ? 95 : 1;
      }),
      temperature_2m: Array.from({length: 24}, (_, i) => 19 + Math.sin(i/24 * Math.PI) * 8),
      precipitation: Array.from({length: 24}, (_, i) => (i >= 14 && i <= 15) ? 4 : 0)
    }
  };
  
  const alerts = analyzeExtremeWeather(weatherData, 'Mount Washington Trail');
  
  console.log('🤖 NEW SMART ANALYSIS RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (alerts.length === 0) {
    console.log('No weather alerts generated.');
  } else {
    alerts.forEach((alert, index) => {
      const emoji = {
        'CRITICAL': '🔴',
        'HIGH': '🟡', 
        'MEDIUM': '🟠',
        'LOW': '🟢'
      }[alert.severity] || '⚪';
      
      console.log(`${emoji} [${alert.severity}] ${alert.message}\n`);
    });
  }
  
  console.log('🆚 COMPARISON WITH OLD SYSTEM:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ OLD: "DANGEROUS CONDITIONS - Thunderstorm - Hiking PROHIBITED"');
  console.log('✅ NEW: "SHORT-TERM THUNDERSTORM: Expected 14:00-16:00 (2h) - Plan around this window"');
  console.log('✅ NEW: "SAFE HIKING WINDOWS: 0:00-12:00 - Good conditions for outdoor activities"\n');
  
  console.log('🎯 KEY IMPROVEMENTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━');
  console.log('• ⏰ Time-specific warnings instead of blanket prohibitions');
  console.log('• 🟢 Identifies safe windows for hiking');
  console.log('• 📊 Smarter severity levels (HIGH vs CRITICAL)');
  console.log('• 🎯 Actionable advice: "Plan around this window"');
  console.log('• 📱 Reduces unnecessary alarm fatigue\n');
  
  console.log('🏃‍♂️ PRACTICAL IMPACT:');
  console.log('━━━━━━━━━━━━━━━━━━');
  console.log('• Hikers can plan morning activities (6 AM - 2 PM)');
  console.log('• Avoid outdoor exposure during 2-3 PM thunderstorm');
  console.log('• Resume activities after 4 PM if conditions clear');
  console.log('• Better user experience with specific timing information\n');
}

// Run the demonstration
demonstrateWeatherAnalysis();

console.log('🎉 This demonstrates how HikeCast now provides more nuanced,');
console.log('   time-aware weather guidance instead of overly dramatic warnings!');
