// services/notificationService.js
const axios = require('axios');
const nodemailer = require('nodemailer');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Send Telegram message
async function sendTelegram(chatId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping Telegram message.');
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    console.log(`🔍 Attempting Telegram send to chat ID: ${chatId} (type: ${typeof chatId})`);
    
    // Convert to completely plain text - remove ALL formatting
    let plainMessage = message
      .replace(/\*\*(.*?)\*\*/g, '$1')     // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')         // Remove *italic*
      .replace(/`(.*?)`/g, '$1')           // Remove `code`
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove [link](url)
      .replace(/#{1,6}\s+/g, '')           // Remove # headers
      .replace(/[_~|]/g, '')               // Remove other markdown chars
      .replace(/─+/g, '---')               // Replace special dashes
      .replace(/\n\n\n+/g, '\n\n');       // Clean up excessive newlines
    
    // Telegram has a 4096 character limit
    const maxLength = 4000; // Conservative buffer
    
    if (plainMessage.length <= maxLength) {
      const payload = {
        chat_id: parseInt(chatId), // Convert to number if it's a string
        text: plainMessage
        // NO parse_mode - send as pure plain text
      };
      
      console.log(`🔍 Sending plain text message (${plainMessage.length} chars)`);
      
      const response = await axios.post(url, payload);
      console.log(`✅ Telegram message sent successfully to ${chatId}`);
    } else {
      // Split long messages
      console.log(`🔍 Message too long (${plainMessage.length} chars), splitting...`);
      
      const parts = splitLongMessage(plainMessage, maxLength);
      
      for (let i = 0; i < parts.length; i++) {
        const partMessage = i === 0 ? parts[i] : `Part ${i + 1}:\n\n${parts[i]}`;
        
        const payload = {
          chat_id: parseInt(chatId),
          text: partMessage
          // NO parse_mode
        };
        
        await axios.post(url, payload);
        console.log(`✅ Telegram message part ${i + 1}/${parts.length} sent`);
        
        // Delay between parts
        if (i < parts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Telegram API Error for chat ID ${chatId}:`);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full Error:', error.message);
    throw error;
  }
}

// Simple message splitting function
function splitLongMessage(message, maxLength) {
  const parts = [];
  let current = '';
  const lines = message.split('\n');
  
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLength) {
      if (current.trim()) {
        parts.push(current.trim());
        current = '';
      }
      
      // If single line is too long, split by words
      if (line.length > maxLength) {
        const words = line.split(' ');
        let tempLine = '';
        
        for (const word of words) {
          if (tempLine.length + word.length + 1 > maxLength) {
            if (tempLine.trim()) {
              if (current) {
                current += '\n' + tempLine.trim();
              } else {
                current = tempLine.trim();
              }
            }
            tempLine = word;
          } else {
            tempLine += (tempLine ? ' ' : '') + word;
          }
        }
        
        if (tempLine.trim()) {
          if (current) {
            current += '\n' + tempLine.trim();
          } else {
            current = tempLine.trim();
          }
        }
      } else {
        current = line;
      }
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
}

async function sendEmail(email, subject, message) {
  if (!gmailUser || !gmailPass) {
    console.warn('GMAIL_USER or GMAIL_PASS not set, skipping email.');
    return;
  }
  
  try {
    let transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"HikeCastBot" <${gmailUser}>`,
      to: email,
      subject: subject,
      text: message,
      html: `<pre>${message}</pre>`,
    });
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
}

// WhatsApp notification using Meta Business Platform
async function sendWhatsApp(phone, message) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not set, skipping WhatsApp message.');
    return;
  }

  try {
    const formattedPhone = phone.replace(/^\+/, '').replace(/\D/g, '');
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`WhatsApp message sent successfully. Message ID: ${response.data.messages[0].id}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendTelegram,
  sendEmail,
  sendWhatsApp
};
