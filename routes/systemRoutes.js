// routes/systemRoutes.js
const express = require('express');
const { checkExtremeWeatherForEnabledUsers } = require('../services/extremeWeatherService');

function createSystemRoutes(db, scheduleNotifications, scheduleExtremeWeatherChecks) {
  const router = express.Router();

  // Get system status
  router.get('/status', async (req, res) => {
    try {
      const users = await db.getAllUsers();
      const stats = {
        totalUsers: users.length,
        usersWithTelegram: users.filter(u => u.telegram_chat_id).length,
        usersWithEmail: users.filter(u => u.email).length,
        usersWithWhatsApp: users.filter(u => u.whatsapp).length,
        usersWithAIEnabled: users.filter(u => u.enableAIAnalysis).length,
        usersWithExtremeWeatherEnabled: users.filter(u => u.enableExtremeWeatherAlerts).length
      };

      res.json({
        status: 'success',
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        },
        database: {
          connected: true,
          userCount: stats.totalUsers,
          stats
        },
        environment: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          hasTelegramKey: !!process.env.TELEGRAM_BOT_TOKEN,
          hasEmailConfig: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
          hasWhatsAppConfig: !!process.env.WHATSAPP_ACCESS_TOKEN
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Trigger manual notification for all users
  router.post('/notify-all', async (req, res) => {
    try {
      const users = await db.getAllUsers();
      const { notifyUser } = require('../services/forecastService');
      
      let successCount = 0;
      let failureCount = 0;
      const results = [];
      
      for (const user of users) {
        try {
          await notifyUser(user);
          successCount++;
          results.push({
            user: user.name,
            status: 'success'
          });
        } catch (error) {
          failureCount++;
          results.push({
            user: user.name,
            status: 'error',
            error: error.message
          });
        }
      }
      
      res.json({
        status: 'success',
        message: `Notifications sent. Success: ${successCount}, Failed: ${failureCount}`,
        results,
        summary: {
          total: users.length,
          success: successCount,
          failed: failureCount
        }
      });
      
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Reschedule all notifications
  router.post('/reschedule', async (req, res) => {
    try {
      await scheduleNotifications();
      await scheduleExtremeWeatherChecks();
      
      res.json({
        status: 'success',
        message: 'All schedules updated successfully'
      });
      
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Health check endpoint
  router.get('/health', async (req, res) => {
    try {
      // Simple health check - verify database connection
      await db.getAllUsers();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

module.exports = createSystemRoutes;
