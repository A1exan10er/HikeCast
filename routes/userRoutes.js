// routes/userRoutes.js
const express = require('express');
const { validateUserData } = require('../utils/validation');
const { notifyUser } = require('../services/forecastService');

function createUserRoutes(db, scheduleNotifications, scheduleExtremeWeatherChecks) {
  const router = express.Router();

  // Get all users
  router.get('/', async (req, res) => {
    try {
      const users = await db.getAllUsers();
      // Remove sensitive information for API response
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        locations: user.locations,
        channels: user.channels,
        schedule: user.schedule,
        timezone: user.timezone,
        forecastDays: user.forecastDays,
        enableAIAnalysis: user.enableAIAnalysis,
        enableExtremeWeatherAlerts: user.enableExtremeWeatherAlerts,
        extremeWeatherCheckInterval: user.extremeWeatherCheckInterval,
        hasValidTelegramId: !!user.telegram_chat_id,
        hasValidEmail: !!user.email,
        hasValidWhatsApp: !!user.whatsapp,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      res.json({
        status: 'success',
        users: sanitizedUsers,
        count: users.length
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Get specific user
  router.get('/:identifier', async (req, res) => {
    try {
      const user = await db.getUserByIdentifier(req.params.identifier);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        locations: user.locations,
        channels: user.channels,
        schedule: user.schedule,
        timezone: user.timezone,
        enableExtremeWeatherAlerts: user.enableExtremeWeatherAlerts,
        extremeWeatherCheckInterval: user.extremeWeatherCheckInterval,
        forecastDays: user.forecastDays,
        enableAIAnalysis: user.enableAIAnalysis,
        hasValidTelegramId: !!user.telegram_chat_id,
        hasValidEmail: !!user.email,
        hasValidWhatsApp: !!user.whatsapp,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
      
      res.json({
        status: 'success',
        user: sanitizedUser
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Add new user
  router.post('/', async (req, res) => {
    try {
      const newUserData = req.body;
      
      // Validate user data
      const validationErrors = validateUserData(newUserData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      // Check if user already exists
      const existingUser = await db.getUserByIdentifier(newUserData.name);
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this name already exists'
        });
      }
      
      // Set defaults
      const userData = {
        name: newUserData.name.trim(),
        locations: newUserData.locations,
        channels: newUserData.channels,
        telegram_chat_id: newUserData.telegram_chat_id || null,
        email: newUserData.email || null,
        whatsapp: newUserData.whatsapp || null,
        schedule: newUserData.schedule || "0 7 * * *",
        timezone: newUserData.timezone || "UTC",
        forecastDays: newUserData.forecastDays || ["Saturday", "Sunday"],
        enableAIAnalysis: newUserData.enableAIAnalysis,
        enableExtremeWeatherAlerts: newUserData.enableExtremeWeatherAlerts,
        extremeWeatherCheckInterval: newUserData.extremeWeatherCheckInterval
      };
      
      const newUser = await db.addUser(userData);
      
      // Reschedule notifications and extreme weather checks to include new user
      await scheduleNotifications();
      await scheduleExtremeWeatherChecks();
      
      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          locations: newUser.locations,
          channels: newUser.channels,
          schedule: newUser.schedule,
          timezone: newUser.timezone,
          forecastDays: newUser.forecastDays
        }
      });
      
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Update user
  router.put('/:identifier', async (req, res) => {
    try {
      const updatedData = req.body;
      
      // Get current user first
      const currentUser = await db.getUserByIdentifier(req.params.identifier);
      if (!currentUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      // Merge and validate updated data
      const mergedData = { ...currentUser, ...updatedData };
      const validationErrors = validateUserData(mergedData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      const updatedUser = await db.updateUser(req.params.identifier, updatedData);
      
      // Reschedule notifications with updated user data
      await scheduleNotifications();
      await scheduleExtremeWeatherChecks();
      
      res.json({
        status: 'success',
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          locations: updatedUser.locations,
          channels: updatedUser.channels,
          schedule: updatedUser.schedule,
          timezone: updatedUser.timezone,
          forecastDays: updatedUser.forecastDays
        }
      });
      
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.message === 'User not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  });

  // Delete user
  router.delete('/:identifier', async (req, res) => {
    try {
      const deletedUser = await db.deleteUser(req.params.identifier);
      
      // Reschedule notifications without deleted user
      await scheduleNotifications();
      await scheduleExtremeWeatherChecks();
      
      res.json({
        status: 'success',
        message: 'User deleted successfully',
        deletedUser: {
          name: deletedUser.name
        }
      });
      
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.message === 'User not found') {
        res.status(404).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  });

  // Test notification for specific user
  router.post('/:identifier/test', async (req, res) => {
    try {
      const user = await db.getUserByIdentifier(req.params.identifier);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      // Send test notification
      await notifyUser(user);
      
      res.json({
        status: 'success',
        message: `Test notification sent to ${user.name}`
      });
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        status: 'error',
        message: `Failed to send notification: ${error.message}`
      });
    }
  });

  return router;
}

module.exports = createUserRoutes;
