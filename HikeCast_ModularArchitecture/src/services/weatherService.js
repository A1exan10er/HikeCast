// This file contains functions for interacting with weather APIs and processing weather data.

import fetch from 'node-fetch';

const WEATHER_API_URL = process.env.WEATHER_API_URL;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

export async function getWeather(location) {
    try {
        const response = await fetch(`${WEATHER_API_URL}?q=${location}&appid=${WEATHER_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Error fetching weather data: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        throw error;
    }
}

export function processWeatherData(weatherData) {
    // Process and format the weather data as needed
    return {
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
    };
}