// services/telegramPollingService.js
// Telegram polling service for local development (alternative to webhooks)

const axios = require('axios');
const { handleUserMessage } = require('./conversationService');
const { sendTelegram } = require('./notificationService');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let offset = 0;
let isPolling = false;

/**
 * Start polling for Telegram messages (for local development)
 */
async function startPolling() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set, skipping Telegram polling.');
    return;
  }

  if (isPolling) {
    console.log('ℹ️ Telegram polling already running');
    return;
  }

  isPolling = true;
  console.log('🔄 Starting Telegram polling for local development...');
  
  // First, delete any existing webhook
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    console.log('✅ Cleared any existing webhook');
  } catch (error) {
    console.error('❌ Error clearing webhook:', error.message);
  }

  poll();
}

/**
 * Stop polling
 */
function stopPolling() {
  isPolling = false;
  console.log('🛑 Telegram polling stopped');
}

/**
 * Poll for new messages
 */
async function poll() {
  if (!isPolling) return;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
    const response = await axios.get(url, {
      params: {
        offset: offset,
        timeout: 30,
        allowed_updates: ['message']
      },
      timeout: 35000 // 35 seconds to account for long polling
    });

    const updates = response.data.result;

    if (updates && updates.length > 0) {
      for (const update of updates) {
        offset = update.update_id + 1;
        
        if (update.message && update.message.text) {
          await handleMessage(update.message);
        }
      }
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      // Timeout is normal for long polling, just continue
    } else {
      console.error('❌ Polling error:', error.message);
      // Wait a bit before retrying on error
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Continue polling
  if (isPolling) {
    setImmediate(poll);
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message) {
  try {
    const chatId = message.chat.id;
    const userId = message.from.id.toString(); // Use sender's user ID, not chat ID
    const messageText = message.text;
    const isGroupChat = message.chat.type === 'group' || message.chat.type === 'supergroup';
    
    console.log(`💬 Message from ${message.from.first_name} (${message.from.id}) in ${isGroupChat ? 'group' : 'private'} chat ${chatId}: ${messageText}`);
    
    // In group chats, only respond if bot is mentioned or it's a bot command
    if (isGroupChat) {
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
      
      // Check if it's a command directed at the bot (e.g., /start@PackYourPonchoBot)
      const isBotCommand = messageText.startsWith('/') && messageText.includes(`@${botUsername}`);
      
      // Check for @mention in the text
      const isMentioned = message.entities && message.entities.some(entity => 
        entity.type === 'mention' && messageText.includes(`@${botUsername}`)
      );
      
      // Also check for text_mention type (when user clicks on bot name)
      const isTextMentioned = message.entities && message.entities.some(entity => 
        entity.type === 'text_mention' && entity.user && entity.user.is_bot
      );
      
      // Check if message contains @botname anywhere
      const hasAtMention = messageText.includes(`@${botUsername}`);
      
      if (!isBotCommand && !isMentioned && !isTextMentioned && !hasAtMention) {
        console.log(`ℹ️ Ignoring group message (bot not mentioned)`);
        return;
      }
      
      console.log(`✅ Bot mentioned in group chat, processing message`);
    }
    
    // Remove bot mention from message text for processing
    let cleanedText = messageText;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || '';
    if (botUsername) {
      // Remove @botname and also bot commands like /start@botname
      cleanedText = messageText
        .replace(new RegExp(`@${botUsername}\\s*`, 'gi'), '')
        .replace(new RegExp(`@${botUsername}`, 'gi'), '')
        .trim();
    }
    
    // Handle the user's message
    const response = await handleUserMessage(cleanedText, userId);
    
    // Send response back to chat
    await sendTelegram(chatId, response);
    
    console.log(`✅ Response sent to chat ${chatId}`);
  } catch (error) {
    console.error('❌ Error handling message:', error);
    
    // Try to send error message to user
    try {
      await sendTelegram(message.chat.id, "Sorry, I encountered an error processing your message. Please try again later!");
    } catch (sendError) {
      console.error('❌ Error sending error message:', sendError);
    }
  }
}

module.exports = {
  startPolling,
  stopPolling
};
