// services/aiService.js
const { GoogleGenAI } = require('@google/genai');
const { getWeatherDescription } = require('./weatherService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({}) : null;

// Analyze weather with Gemini AI and provide hiking suggestions
async function analyzeWeatherWithGemini(weatherData, location) {
  if (!genAI) {
    console.warn('Gemini API key not set, skipping AI analysis.');
    return null;
  }

  try {
    console.log(`🔍 Starting Gemini analysis for ${location}`);
    const weatherDescription = getWeatherDescription(weatherData.weatherCode);
    
    const prompt = `
Analyze the following weather data for hiking in ${location} and provide balanced, practical recommendations:

Weather Details:
- Location: ${location}
- Forecast: ${weatherData.dayLabel} (${weatherData.date})
- Temperature: Max ${weatherData.tempMax}°C, Min ${weatherData.tempMin}°C
- Precipitation: ${weatherData.precip}mm
- Weather Condition: ${weatherDescription}

Please provide:
1. A hiking suitability rating (1-10, where 10 is perfect for hiking)
2. Specific recommendations for hiking gear and preparation
3. Best time of day for hiking (if suitable)
4. Any safety concerns or warnings
5. Alternative outdoor activities if hiking isn't recommended

IMPORTANT: Keep descriptions realistic and proportionate to actual risk. Use calm, practical language. Only express urgency for genuinely dangerous conditions (severe storms, extreme temperatures, etc.). For moderate weather like light-moderate rain or cool temperatures, focus on practical preparation rather than dramatic warnings.

Keep the response concise but informative, suitable for a weather notification message.
Note: This forecast is for ${weatherData.dayLabel.toLowerCase()}.
`;

    console.log(`🔍 Sending request to Gemini with model: gemini-2.5-flash`);
    
    // Use the correct API structure for @google/genai
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log(`✅ Gemini response received successfully`);
    return response.text;
  } catch (error) {
    console.error(`❌ Gemini API Error for ${location}:`);
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null; // Don't throw, just return null to continue
  }
}

// AI analysis for extreme weather conditions
async function analyzeExtremeWeatherWithGemini(alerts, location) {
  if (!genAI) {
    console.warn('Gemini API key not set, skipping extreme weather AI analysis.');
    return null;
  }
  
  try {
    console.log(`🔍 Starting Gemini extreme weather analysis for ${location}`);
    
    const alertDescriptions = alerts.map(alert => `${alert.type}: ${alert.message}`).join('\n');
    
    const prompt = `
Analyze the following extreme weather alerts for ${location} and provide appropriate safety recommendations:

EXTREME WEATHER ALERTS:
${alertDescriptions}

Please provide:
1. Immediate safety actions to take
2. Specific risks to consider
3. What outdoor activities should be avoided or postponed
4. Practical preparedness recommendations
5. When conditions might improve

IMPORTANT: Match the urgency of your language to the actual severity of conditions. For moderate extreme weather (heavy rain, cold temperatures), use firm but calm guidance. Reserve emergency language only for truly life-threatening situations (violent storms, dangerous temperatures below -15°C or above 40°C, severe flooding risk). Focus on practical safety measures rather than dramatic descriptions.

Keep the response clear and focused on safety while maintaining proportionate tone.
`;

    console.log(`🔍 Sending extreme weather request to Gemini with model: gemini-2.5-flash`);
    
    // Use the correct API structure
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    console.log(`✅ Gemini extreme weather analysis completed`);
    return response.text;
  } catch (error) {
    console.error(`❌ Gemini extreme weather analysis error for ${location}:`);
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

module.exports = {
  analyzeWeatherWithGemini,
  analyzeExtremeWeatherWithGemini
};
