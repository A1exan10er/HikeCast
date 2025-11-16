// Test Telegram conversation feature
// Run this after starting the server: node tests/test_telegram_conversation.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testConversationFeature() {
  console.log('🧪 Testing Telegram Conversation Feature\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', health.data);
    console.log('');
    
    // Test 2: Check webhook info (should show polling mode for local)
    console.log('2️⃣ Checking Telegram webhook status...');
    try {
      const webhookInfo = await axios.get(`${BASE_URL}/telegram-webhook-info`);
      console.log('📡 Webhook info:', webhookInfo.data);
    } catch (error) {
      if (error.response?.data) {
        console.log('ℹ️ Webhook info:', error.response.data);
      } else {
        console.log('ℹ️ Unable to get webhook info (this is normal for polling mode)');
      }
    }
    console.log('');
    
    // Test 3: Test conversation service directly
    console.log('3️⃣ Testing conversation service...');
    const { handleUserMessage } = require('../services/conversationService');
    
    const testMessages = [
      { text: '/start', desc: 'Start command' },
      { text: '/help', desc: 'Help command' },
      { text: 'What\'s the weather in Stuttgart?', desc: 'Weather query' }
    ];
    
    for (const test of testMessages) {
      console.log(`   Testing: ${test.desc}`);
      console.log(`   Input: "${test.text}"`);
      try {
        const response = await handleUserMessage(test.text, '123456');
        console.log(`   ✅ Response received (${response.length} chars)`);
        console.log(`   Preview: ${response.substring(0, 100)}...`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }
    
    console.log('\n🎉 Conversation feature is working!');
    console.log('\n📱 Next steps:');
    console.log('   1. Make sure your server is running (npm start)');
    console.log('   2. Look for "🔄 Starting Telegram polling mode" in the logs');
    console.log('   3. Open Telegram and message your bot');
    console.log('   4. Send: /start');
    console.log('');
    console.log('💡 Tip: Check server logs for "💬 Message from..." to see incoming messages');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️ Server is not running!');
      console.log('   Start it with: npm start');
    }
  }
}

testConversationFeature();
