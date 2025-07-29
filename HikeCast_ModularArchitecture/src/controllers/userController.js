// This file contains user management functions, including creating, updating, and retrieving user data.

const db = require('../database/database');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json({ status: 'success', users });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Get specific user
exports.getUserById = async (req, res) => {
    const { identifier } = req.params;
    try {
        const user = await db.getUser(identifier);
        if (user) {
            res.json({ status: 'success', user });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Create new user
exports.createUser = async (req, res) => {
    const newUser = req.body;
    try {
        const createdUser = await db.createUser(newUser);
        res.status(201).json({ status: 'success', message: 'User created', user: createdUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    const { identifier } = req.params;
    const updatedData = req.body;
    try {
        const updatedUser = await db.updateUser(identifier, updatedData);
        if (updatedUser) {
            res.json({ status: 'success', message: 'User updated', user: updatedUser });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const { identifier } = req.params;
    try {
        const result = await db.deleteUser(identifier);
        if (result) {
            res.json({ status: 'success', message: 'User deleted' });
        } else {
            res.status(404).json({ status: 'error', message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};