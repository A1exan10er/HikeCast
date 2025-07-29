// filepath: /HikeCast/HikeCast/tests/services.test.js
const request = require('supertest');
const app = require('../src/app'); // Adjust the path as necessary
const weatherService = require('../src/services/weatherService');
const telegramService = require('../src/services/telegramService');
const emailService = require('../src/services/emailService');
const whatsappService = require('../src/services/whatsappService');

jest.mock('../src/services/weatherService');
jest.mock('../src/services/telegramService');
jest.mock('../src/services/emailService');
jest.mock('../src/services/whatsappService');

describe('Service Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Weather Service', () => {
        it('should fetch weather data successfully', async () => {
            const mockWeatherData = { temperature: 20, condition: 'Clear' };
            weatherService.fetchWeatherData.mockResolvedValue(mockWeatherData);

            const response = await request(app).get('/weather'); // Adjust the endpoint as necessary
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockWeatherData);
        });

        it('should handle errors when fetching weather data', async () => {
            weatherService.fetchWeatherData.mockRejectedValue(new Error('Failed to fetch'));

            const response = await request(app).get('/weather'); // Adjust the endpoint as necessary
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to fetch');
        });
    });

    describe('Telegram Service', () => {
        it('should send a message successfully', async () => {
            const mockResponse = { status: 'success' };
            telegramService.sendMessage.mockResolvedValue(mockResponse);

            const response = await request(app).post('/telegram/send'); // Adjust the endpoint as necessary
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResponse);
        });

        it('should handle errors when sending a message', async () => {
            telegramService.sendMessage.mockRejectedValue(new Error('Failed to send'));

            const response = await request(app).post('/telegram/send'); // Adjust the endpoint as necessary
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to send');
        });
    });

    describe('Email Service', () => {
        it('should send an email successfully', async () => {
            const mockResponse = { status: 'success' };
            emailService.sendEmail.mockResolvedValue(mockResponse);

            const response = await request(app).post('/email/send'); // Adjust the endpoint as necessary
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResponse);
        });

        it('should handle errors when sending an email', async () => {
            emailService.sendEmail.mockRejectedValue(new Error('Failed to send email'));

            const response = await request(app).post('/email/send'); // Adjust the endpoint as necessary
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to send email');
        });
    });

    describe('WhatsApp Service', () => {
        it('should send a WhatsApp message successfully', async () => {
            const mockResponse = { status: 'success' };
            whatsappService.sendMessage.mockResolvedValue(mockResponse);

            const response = await request(app).post('/whatsapp/send'); // Adjust the endpoint as necessary
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResponse);
        });

        it('should handle errors when sending a WhatsApp message', async () => {
            whatsappService.sendMessage.mockRejectedValue(new Error('Failed to send WhatsApp message'));

            const response = await request(app).post('/whatsapp/send'); // Adjust the endpoint as necessary
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to send WhatsApp message');
        });
    });
});