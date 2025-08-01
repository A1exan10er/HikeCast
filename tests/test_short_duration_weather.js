// tests/test_short_duration_weather.js
const { analyzeExtremeWeather, EXTREME_WEATHER_THRESHOLDS } = require('../services/extremeWeatherService');

// Mock weather data with short-duration thunderstorm
function createMockWeatherDataWithShortThunderstorm() {
  const baseTime = new Date('2025-08-01T00:00:00Z').toISOString();
  
  // Create 24 hours of hourly data for today
  const hourlyData = {
    time: [],
    weathercode: [],
    temperature_2m: [],
    precipitation: []
  };
  
  // Generate 24 hours of data
  for (let i = 0; i < 24; i++) {
    const time = new Date(Date.parse(baseTime) + i * 60 * 60 * 1000).toISOString();
    hourlyData.time.push(time);
    hourlyData.temperature_2m.push(22); // Normal temperature
    hourlyData.precipitation.push(0); // No precipitation except during storm
    
    // Thunderstorm only during hours 14-15 (2-3 PM)
    if (i >= 14 && i <= 15) {
      hourlyData.weathercode.push(95); // Thunderstorm (dangerous)
      hourlyData.precipitation.push(5); // Some rain during storm
    } else {
      hourlyData.weathercode.push(1); // Clear/sunny (safe)
    }
  }
  
  return {
    current: {
      temperature_2m: 22,
      weathercode: 1
    },
    daily: {
      time: [baseTime.split('T')[0]],
      temperature_2m_max: [25],
      temperature_2m_min: [18],
      precipitation_sum: [10],
      weathercode: [95] // Daily shows thunderstorm (but it's short)
    },
    hourly: hourlyData
  };
}

// Mock weather data with extended thunderstorm
function createMockWeatherDataWithExtendedThunderstorm() {
  const baseTime = new Date('2025-08-01T00:00:00Z').toISOString();
  
  const hourlyData = {
    time: [],
    weathercode: [],
    temperature_2m: [],
    precipitation: []
  };
  
  // Generate 24 hours of data
  for (let i = 0; i < 24; i++) {
    const time = new Date(Date.parse(baseTime) + i * 60 * 60 * 1000).toISOString();
    hourlyData.time.push(time);
    hourlyData.temperature_2m.push(22);
    
    // Extended thunderstorm during hours 10-16 (6 hours)
    if (i >= 10 && i <= 16) {
      hourlyData.weathercode.push(95); // Thunderstorm
      hourlyData.precipitation.push(8);
    } else {
      hourlyData.weathercode.push(1); // Clear
      hourlyData.precipitation.push(0);
    }
  }
  
  return {
    current: {
      temperature_2m: 22,
      weathercode: 1
    },
    daily: {
      time: [baseTime.split('T')[0]],
      temperature_2m_max: [25],
      temperature_2m_min: [18],
      precipitation_sum: [48],
      weathercode: [95]
    },
    hourly: hourlyData
  };
}

function testShortDurationThunderstorm() {
  console.log('\n🧪 Testing Short-Duration Thunderstorm Analysis...');
  
  const mockData = createMockWeatherDataWithShortThunderstorm();
  const alerts = analyzeExtremeWeather(mockData, 'Test Location');
  
  console.log(`Found ${alerts.length} alerts:`);
  alerts.forEach((alert, index) => {
    console.log(`${index + 1}. [${alert.severity}] ${alert.type}: ${alert.message}`);
  });
  
  // Verify we have the expected alert types
  const shortDangerousAlert = alerts.find(a => a.type === 'SHORT_DANGEROUS_CONDITIONS');
  const safeWindowAlert = alerts.find(a => a.type === 'SAFE_HIKING_WINDOWS');
  const prohibitedAlert = alerts.find(a => a.message.includes('PROHIBITED'));
  
  console.log('\n✅ Verification:');
  console.log(`- Short dangerous conditions alert: ${shortDangerousAlert ? '✅ Found' : '❌ Missing'}`);
  console.log(`- Safe hiking windows alert: ${safeWindowAlert ? '✅ Found' : '❌ Missing'}`);
  console.log(`- Hiking prohibited alert: ${prohibitedAlert ? '❌ Found (should not be present)' : '✅ Correctly absent'}`);
  
  if (shortDangerousAlert) {
    console.log(`- Short dangerous duration: ${shortDangerousAlert.hourlyPattern?.dangerousDuration}h`);
    console.log(`- Dangerous hours: ${shortDangerousAlert.hourlyPattern?.dangerousHours.join(', ')}`);
  }
  
  return alerts;
}

function testExtendedThunderstorm() {
  console.log('\n🧪 Testing Extended Thunderstorm Analysis...');
  
  const mockData = createMockWeatherDataWithExtendedThunderstorm();
  const alerts = analyzeExtremeWeather(mockData, 'Test Location');
  
  console.log(`Found ${alerts.length} alerts:`);
  alerts.forEach((alert, index) => {
    console.log(`${index + 1}. [${alert.severity}] ${alert.type}: ${alert.message}`);
  });
  
  // Verify we have critical alerts for extended storm
  const dangerousAlert = alerts.find(a => a.type === 'DANGEROUS_CONDITIONS');
  const shortDangerousAlert = alerts.find(a => a.type === 'SHORT_DANGEROUS_CONDITIONS');
  
  console.log('\n✅ Verification:');
  console.log(`- Extended dangerous conditions alert: ${dangerousAlert ? '✅ Found' : '❌ Missing'}`);
  console.log(`- Short dangerous conditions alert: ${shortDangerousAlert ? '❌ Found (should not be present)' : '✅ Correctly absent'}`);
  
  return alerts;
}

function testNormalWeather() {
  console.log('\n🧪 Testing Normal Weather (No Alerts)...');
  
  const normalWeather = {
    current: {
      temperature_2m: 22,
      weathercode: 1
    },
    daily: {
      time: ['2025-08-01'],
      temperature_2m_max: [25],
      temperature_2m_min: [18],
      precipitation_sum: [2],
      weathercode: [1] // Clear weather
    },
    hourly: {
      time: Array.from({length: 24}, (_, i) => 
        new Date(Date.parse('2025-08-01T00:00:00Z') + i * 60 * 60 * 1000).toISOString()
      ),
      weathercode: Array(24).fill(1), // All clear
      temperature_2m: Array(24).fill(22),
      precipitation: Array(24).fill(0)
    }
  };
  
  const alerts = analyzeExtremeWeather(normalWeather, 'Test Location');
  
  console.log(`Found ${alerts.length} alerts (should be 0):`);
  alerts.forEach((alert, index) => {
    console.log(`${index + 1}. [${alert.severity}] ${alert.type}: ${alert.message}`);
  });
  
  console.log('\n✅ Verification:');
  console.log(`- No alerts for normal weather: ${alerts.length === 0 ? '✅ Correct' : '❌ Unexpected alerts found'}`);
  
  return alerts;
}

function runAllTests() {
  console.log('🌦️  SHORT-DURATION WEATHER ANALYSIS TESTS');
  console.log('==========================================');
  
  try {
    const shortTest = testShortDurationThunderstorm();
    const extendedTest = testExtendedThunderstorm();
    const normalTest = testNormalWeather();
    
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    
    // Summary checks
    const shortHasAppropriateAlert = shortTest.some(a => a.type === 'SHORT_DANGEROUS_CONDITIONS');
    const extendedHasProhibition = extendedTest.some(a => a.type === 'DANGEROUS_CONDITIONS');
    const normalHasNoAlerts = normalTest.length === 0;
    
    console.log(`✅ Short thunderstorm correctly identified: ${shortHasAppropriateAlert}`);
    console.log(`✅ Extended thunderstorm triggers prohibition: ${extendedHasProhibition}`);
    console.log(`✅ Normal weather produces no alerts: ${normalHasNoAlerts}`);
    
    const allTestsPassed = shortHasAppropriateAlert && extendedHasProhibition && normalHasNoAlerts;
    console.log(`\n🎯 ALL TESTS PASSED: ${allTestsPassed ? '✅ YES' : '❌ NO'}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 Short-duration weather analysis is working correctly!');
      console.log('The system now properly distinguishes between:');
      console.log('- Short thunderstorms (1-2 hours) → Timing advice + safe windows');
      console.log('- Extended bad weather (3+ hours) → Hiking prohibition');
      console.log('- Normal weather → No unnecessary alerts');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testShortDurationThunderstorm,
  testExtendedThunderstorm,
  testNormalWeather,
  runAllTests
};
