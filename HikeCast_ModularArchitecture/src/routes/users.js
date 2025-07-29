// filepath: /HikeCast/HikeCast/src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get all users
router.get('/', userController.getAllUsers);

// Get specific user
router.get('/:identifier', userController.getUserById);

// Add new user
router.post('/', userController.createUser);

// Update user
router.put('/:identifier', userController.updateUser);

// Delete user
router.delete('/:identifier', userController.deleteUser);

// Test notification for specific user
router.post('/:identifier/test', userController.testUserNotification);

module.exports = router;