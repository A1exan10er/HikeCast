// This file provides various helper functions used throughout the application.

export function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

export function formatTime(date) {
    return new Date(date).toLocaleTimeString();
}

export function generateRandomId(length = 10) {
    return Math.random().toString(36).substr(2, length);
}

export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

export function isValidPhoneNumber(phone) {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(String(phone));
}