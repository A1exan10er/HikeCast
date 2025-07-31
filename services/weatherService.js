// services/weatherService.js
const axios = require('axios');

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

// Fetch extended weather data including current conditions
async function getExtendedWeather(location) {
  const geo = await geocodeLocation(location);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weathercode,windspeed_10m&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=7&timezone=auto`;
  const response = await axios.get(url);
  return { geo, weather: response.data };
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

// Provide basic weather assessment without AI
function getBasicWeatherAssessment(dayData) {
  const { tempMax, tempMin, precip, weatherCode } = dayData;
  let assessment = '';
  
  // Temperature assessment
  if (tempMax >= 25) {
    assessment += 'Warm weather ideal for hiking. ';
  } else if (tempMax >= 15) {
    assessment += 'Pleasant temperatures for outdoor activities. ';
  } else if (tempMax >= 5) {
    assessment += 'Cool weather, dress warmly. ';
  } else {
    assessment += 'Cold conditions, ensure proper winter gear. ';
  }
  
  // Precipitation assessment
  if (precip > 10) {
    assessment += 'Heavy rain expected - consider postponing outdoor plans.';
  } else if (precip > 2) {
    assessment += 'Light to moderate rain - pack waterproof gear.';
  } else if (precip > 0) {
    assessment += 'Minimal precipitation expected.';
  } else {
    assessment += 'Dry conditions expected.';
  }
  
  // Weather condition assessment
  if (weatherCode >= 95) {
    assessment += ' Thunderstorms forecasted - stay indoors.';
  } else if (weatherCode >= 80) {
    assessment += ' Rain showers likely.';
  } else if (weatherCode >= 70) {
    assessment += ' Snow conditions expected.';
  } else if (weatherCode >= 60) {
    assessment += ' Rainy weather ahead.';
  } else if (weatherCode <= 3) {
    assessment += ' Clear to partly cloudy skies.';
  }
  
  return assessment;
}

module.exports = {
  geocodeLocation,
  getWeather,
  getExtendedWeather,
  getWeatherDescription,
  getBasicWeatherAssessment
};
