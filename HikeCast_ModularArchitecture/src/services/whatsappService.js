// src/services/whatsappService.js
const axios = require('axios');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function sendWhatsAppMessage(to, message) {
    try {
        const response = await axios.post(`${WHATSAPP_API_URL}/messages`, {
            to,
            message: {
                text: message
            }
        }, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.message);
        throw new Error('Failed to send WhatsApp message');
    }
}

module.exports = {
    sendWhatsAppMessage
};