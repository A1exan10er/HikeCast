const request = require('supertest');
const app = require('../src/app'); // Adjust the path as necessary

describe('Dashboard Routes', () => {
    it('should return the dashboard HTML', async () => {
        const response = await request(app).get('/dashboard');
        expect(response.status).toBe(200);
        expect(response.text).toContain('<title>HikeCast User Management Dashboard</title>');
    });

    // Add more tests for other dashboard-related functionalities as needed
});

describe('User Routes', () => {
    it('should get all users', async () => {
        const response = await request(app).get('/users');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.users)).toBe(true);
    });

    // Add more tests for user-related functionalities as needed
});

// Add more describe blocks for other route tests as necessary