/**
 * UI Integration Test for Extreme Weather Configuration
 * Tests the complete flow from frontend form to backend processing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
async function makeRequest(method, path, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${path}`,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Request failed: ${method} ${path}`, error.response?.data || error.message);
        throw error;
    }
}

// Test cases
async function runTests() {
    console.log('🧪 Starting UI Integration Tests for Extreme Weather Configuration\n');
    
    // Test 1: Create user with extreme weather alerts enabled
    console.log('Test 1: Creating user with extreme weather alerts enabled...');
    try {
        const userData = {
            name: 'TestUser_ExtremeWeather',
            locations: ['Berlin, Germany'],
            channels: ['telegram'],
            telegram_chat_id: '123456789',
            schedule: '0 8 * * *',
            timezone: 'Europe/Berlin',
            forecastDays: ['today', 'tomorrow'],
            enableAIAnalysis: true,
            enableExtremeWeatherAlerts: true,
            extremeWeatherCheckInterval: '0 * * * *' // Every hour
        };
        
        const result = await makeRequest('POST', '/users', userData);
        console.log('✅ User created successfully:', result.message);
        
        // Verify user was created with correct settings
        const users = await makeRequest('GET', '/users');
        const createdUser = users.users.find(u => u.name === userData.name);
        
        if (createdUser) {
            console.log('✅ User found in database');
            console.log(`   - Extreme Weather Alerts: ${createdUser.enable_extreme_weather_alerts ? 'Enabled' : 'Disabled'}`);
            console.log(`   - Check Interval: ${createdUser.extreme_weather_check_interval}`);
            
            if (createdUser.enable_extreme_weather_alerts && createdUser.extreme_weather_check_interval === userData.extremeWeatherCheckInterval) {
                console.log('✅ Extreme weather settings saved correctly');
            } else {
                console.log('❌ Extreme weather settings not saved correctly');
            }
        } else {
            console.log('❌ User not found in database');
        }
    } catch (error) {
        console.log('❌ Test 1 failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Update user with custom extreme weather interval
    console.log('Test 2: Updating user with custom extreme weather interval...');
    try {
        const updateData = {
            name: 'TestUser_ExtremeWeather',
            locations: ['Berlin, Germany'],
            channels: ['telegram'],
            telegram_chat_id: '123456789',
            schedule: '0 8 * * *',
            timezone: 'Europe/Berlin',
            forecastDays: ['today', 'tomorrow'],
            enableAIAnalysis: true,
            enableExtremeWeatherAlerts: true,
            extremeWeatherCheckInterval: '*/15 * * * *' // Every 15 minutes
        };
        
        const result = await makeRequest('PUT', '/users/TestUser_ExtremeWeather', updateData);
        console.log('✅ User updated successfully:', result.message);
        
        // Verify user was updated with new settings
        const users = await makeRequest('GET', '/users');
        const updatedUser = users.users.find(u => u.name === updateData.name);
        
        if (updatedUser && updatedUser.extreme_weather_check_interval === updateData.extremeWeatherCheckInterval) {
            console.log('✅ Custom extreme weather interval updated correctly');
            console.log(`   - New Check Interval: ${updatedUser.extreme_weather_check_interval}`);
        } else {
            console.log('❌ Custom extreme weather interval not updated correctly');
        }
    } catch (error) {
        console.log('❌ Test 2 failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: Disable extreme weather alerts
    console.log('Test 3: Disabling extreme weather alerts...');
    try {
        const updateData = {
            name: 'TestUser_ExtremeWeather',
            locations: ['Berlin, Germany'],
            channels: ['telegram'],
            telegram_chat_id: '123456789',
            schedule: '0 8 * * *',
            timezone: 'Europe/Berlin',
            forecastDays: ['today', 'tomorrow'],
            enableAIAnalysis: true,
            enableExtremeWeatherAlerts: false,
            extremeWeatherCheckInterval: '0 */2 * * *' // Should be ignored when disabled
        };
        
        const result = await makeRequest('PUT', '/users/TestUser_ExtremeWeather', updateData);
        console.log('✅ User updated successfully:', result.message);
        
        // Verify user was updated with disabled alerts
        const users = await makeRequest('GET', '/users');
        const updatedUser = users.users.find(u => u.name === updateData.name);
        
        if (updatedUser && !updatedUser.enable_extreme_weather_alerts) {
            console.log('✅ Extreme weather alerts disabled correctly');
            console.log(`   - Alerts Enabled: ${updatedUser.enable_extreme_weather_alerts}`);
        } else {
            console.log('❌ Extreme weather alerts not disabled correctly');
        }
    } catch (error) {
        console.log('❌ Test 3 failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 4: Test cron validation with invalid expression
    console.log('Test 4: Testing cron validation with invalid expression...');
    try {
        const invalidData = {
            name: 'TestUser_InvalidCron',
            locations: ['Berlin, Germany'],
            channels: ['telegram'],
            telegram_chat_id: '123456789',
            schedule: '0 8 * * *',
            timezone: 'Europe/Berlin',
            forecastDays: ['today'],
            enableAIAnalysis: true,
            enableExtremeWeatherAlerts: true,
            extremeWeatherCheckInterval: 'invalid cron expression'
        };
        
        try {
            await makeRequest('POST', '/users', invalidData);
            console.log('❌ Expected validation error but user was created');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validation correctly rejected invalid cron expression');
                console.log(`   - Error: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
    } catch (error) {
        console.log('❌ Test 4 failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 5: Verify predefined interval options work
    console.log('Test 5: Testing predefined interval options...');
    const predefinedIntervals = [
        '*/30 * * * *',  // Every 30 minutes
        '0 * * * *',     // Every hour
        '0 */2 * * *',   // Every 2 hours
        '0 */4 * * *',   // Every 4 hours
        '0 8,20 * * *',  // Twice daily
        '0 8 * * *'      // Once daily
    ];
    
    for (let i = 0; i < predefinedIntervals.length; i++) {
        const interval = predefinedIntervals[i];
        try {
            const userData = {
                name: `TestUser_Predefined_${i}`,
                locations: ['Berlin, Germany'],
                channels: ['telegram'],
                telegram_chat_id: `12345678${i}`,
                schedule: '0 8 * * *',
                timezone: 'Europe/Berlin',
                forecastDays: ['today'],
                enableAIAnalysis: true,
                enableExtremeWeatherAlerts: true,
                extremeWeatherCheckInterval: interval
            };
            
            const result = await makeRequest('POST', '/users', userData);
            console.log(`✅ User with interval "${interval}" created successfully`);
        } catch (error) {
            console.log(`❌ Failed to create user with interval "${interval}":`, error.message);
        }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Cleanup: Delete test users
    console.log('Cleanup: Deleting test users...');
    const testUserNames = [
        'TestUser_ExtremeWeather',
        ...predefinedIntervals.map((_, i) => `TestUser_Predefined_${i}`)
    ];
    
    for (const userName of testUserNames) {
        try {
            await makeRequest('DELETE', `/users/${encodeURIComponent(userName)}`);
            console.log(`✅ Deleted ${userName}`);
        } catch (error) {
            console.log(`⚠️ Could not delete ${userName}:`, error.response?.data?.message || error.message);
        }
    }
    
    console.log('\n🎉 All UI Integration Tests completed!');
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
