// src/services/telegramService.js
const fetch = require('node-fetch');

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

/**
 * Sends a message to a specified Telegram chat.
 * @param {string} chatId - The chat ID to send the message to.
 * @param {string} message - The message to send.
 * @returns {Promise<Object>} - The response from the Telegram API.
 */
async function sendTelegramMessage(chatId, message) {
    const response = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
        }),
    });

    if (!response.ok) {
        throw new Error(`Error sending message: ${response.statusText}`);
    }

    return response.json();
}

module.exports = {
    sendTelegramMessage,
};