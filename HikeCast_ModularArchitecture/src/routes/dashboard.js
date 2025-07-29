const express = require('express');
const router = express.Router();
const { loadUsers, loadStats } = require('../controllers/userController');

// Serve the dashboard HTML
router.get('/', async (req, res) => {
    try {
        const dashboardHTML = await loadDashboardHTML();
        res.send(dashboardHTML);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Function to load the dashboard HTML
async function loadDashboardHTML() {
    // Load the HTML content from the views directory
    const fs = require('fs').promises;
    const path = require('path');
    const dashboardPath = path.join(__dirname, '../views/dashboard.html');
    return await fs.readFile(dashboardPath, 'utf8');
}

// Load users and stats for the dashboard
router.get('/stats', async (req, res) => {
    try {
        const users = await loadUsers();
        const stats = await loadStats();
        res.json({ users, stats });
    } catch (error) {
        console.error('Error loading stats:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;