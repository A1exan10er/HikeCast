/**
 * Simple test to verify that the fix for extreme weather settings is working
 */

const axios = require('axios');

async function quickTest() {
    console.log('🔧 Quick test of extreme weather settings fix...\n');
    
    const testData = {
        name: 'FixTestUser',
        locations: ['Berlin, Germany'],
        channels: ['telegram'],
        telegram_chat_id: '111222333',
        enableExtremeWeatherAlerts: true,
        extremeWeatherCheckInterval: '0 */4 * * *'  // Every 4 hours
    };
    
    try {
        // Create user
        const createResponse = await axios.post('http://localhost:3000/users', testData);
        console.log('✅ User created:', createResponse.data.message);
        
        // Get user to check settings
        const getUserResponse = await axios.get('http://localhost:3000/users');
        const user = getUserResponse.data.users.find(u => u.name === testData.name);
        
        console.log('\nUser extreme weather settings:');
        console.log('- Enabled:', user.enableExtremeWeatherAlerts);
        console.log('- Interval:', user.extremeWeatherCheckInterval);
        console.log('- Expected:', testData.extremeWeatherCheckInterval);
        
        const success = user.extremeWeatherCheckInterval === testData.extremeWeatherCheckInterval;
        console.log('\n' + (success ? '🎉 SUCCESS: Fix is working!' : '❌ Still broken'));
        
        // Cleanup
        await axios.delete(`http://localhost:3000/users/${testData.name}`);
        console.log('🧹 Test user cleaned up');
        
    } catch (error) {
        console.log('❌ Test failed:', error.response?.data || error.message);
    }
}

quickTest();
