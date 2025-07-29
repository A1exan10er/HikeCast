// filepath: /HikeCast/HikeCast/src/controllers/weatherController.js
const weatherService = require('../services/weatherService');

async function getWeatherData(req, res) {
    try {
        const location = req.query.location;
        const weatherData = await weatherService.fetchWeather(location);
        res.json({
            status: 'success',
            data: weatherData
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

async function checkExtremeWeather(req, res) {
    try {
        const extremeWeatherData = await weatherService.checkExtremeWeatherForAllUsers();
        res.json({
            status: 'success',
            message: 'Extreme weather check completed',
            data: extremeWeatherData
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

module.exports = {
    getWeatherData,
    checkExtremeWeather
};