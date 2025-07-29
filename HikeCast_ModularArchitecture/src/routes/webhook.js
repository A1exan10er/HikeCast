// filepath: /HikeCast/HikeCast/src/routes/webhook.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Add webhook verification endpoint for WhatsApp
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.json({
      status: 'WhatsApp Webhook Endpoint',
      message: 'This endpoint is ready to receive WhatsApp webhooks',
      timestamp: new Date().toISOString()
    });
  }
});

// Add webhook endpoint to receive WhatsApp messages (POST)
router.post('/webhook', express.json(), async (req, res) => {
  const body = req.body;
  
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(entry => {
      // Process each entry here
      const messagingEvents = entry.changes[0].value.messages;
      messagingEvents.forEach(event => {
        // Handle incoming message event
        notificationController.handleIncomingMessage(event);
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;