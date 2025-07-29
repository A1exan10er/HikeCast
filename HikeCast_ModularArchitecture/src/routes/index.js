// filepath: /HikeCast/HikeCast/src/routes/index.js
import express from 'express';
import dashboardRoutes from './dashboard.js';
import userRoutes from './users.js';
import webhookRoutes from './webhook.js';

const router = express.Router();

// Use the dashboard routes
router.use('/dashboard', dashboardRoutes);

// Use the user routes
router.use('/users', userRoutes);

// Use the webhook routes
router.use('/webhook', webhookRoutes);

export default router;