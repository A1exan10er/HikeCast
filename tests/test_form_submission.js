/**
 * Quick test to check if the dashboard UI can save extreme weather settings
 */

// Test the form submission directly
async function testFormSubmission() {
    console.log('🧪 Testing Dashboard Form Submission for Extreme Weather Settings\n');
    
    const testFormData = {
        name: 'QuickTestUser',
        locations: ['Munich, Germany'],
        channels: ['telegram'],
        telegram_chat_id: '999888777',
        schedule: '0 9 * * *',
        timezone: 'Europe/Berlin',
        forecastDays: ['today'],
        enableAIAnalysis: true,
        enableExtremeWeatherAlerts: true,
        extremeWeatherCheckInterval: '0 */3 * * *'  // Every 3 hours
    };
    
    try {
        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testFormData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ User creation successful:', result.message);
            
            // Now check if the user was saved with extreme weather settings
            const getUsersResponse = await fetch('http://localhost:3000/users');
            const usersData = await getUsersResponse.json();
            
            const createdUser = usersData.users.find(u => u.name === testFormData.name);
            
            if (createdUser) {
                console.log('\n📊 User Settings:');
                console.log(`   - Name: ${createdUser.name}`);
                console.log(`   - Extreme Weather Alerts: ${createdUser.enableExtremeWeatherAlerts !== false ? 'Enabled' : 'Disabled'}`);
                console.log(`   - Check Interval: ${createdUser.extremeWeatherCheckInterval || 'Not set'}`);
                console.log(`   - AI Analysis: ${createdUser.enableAIAnalysis !== false ? 'Enabled' : 'Disabled'}`);
                
                if (createdUser.enableExtremeWeatherAlerts !== false && createdUser.extremeWeatherCheckInterval === testFormData.extremeWeatherCheckInterval) {
                    console.log('\n🎉 SUCCESS: Extreme weather settings were saved correctly!');
                } else {
                    console.log('\n❌ ISSUE: Extreme weather settings were not saved correctly');
                    console.log('Expected:', testFormData.extremeWeatherCheckInterval);
                    console.log('Actual:', createdUser.extremeWeatherCheckInterval);
                }
            } else {
                console.log('\n❌ User not found in database');
            }
            
            // Clean up - delete the test user
            const deleteResponse = await fetch(`http://localhost:3000/users/${encodeURIComponent(testFormData.name)}`, {
                method: 'DELETE'
            });
            
            if (deleteResponse.ok) {
                console.log('\n🧹 Test user cleaned up successfully');
            }
            
        } else {
            console.log('❌ User creation failed:', result.message);
            if (result.errors) {
                console.log('Errors:', result.errors);
            }
        }
        
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
    }
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment - use axios which is already installed
    const axios = require('axios');
    
    // Replace fetch with axios in the test
    global.fetch = async (url, options = {}) => {
        try {
            const config = {
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body
            };
            
            const response = await axios(config);
            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                json: async () => response.data
            };
        } catch (error) {
            return {
                ok: false,
                status: error.response?.status || 500,
                json: async () => error.response?.data || { message: error.message }
            };
        }
    };
    
    testFormSubmission().catch(console.error);
}

module.exports = { testFormSubmission };
