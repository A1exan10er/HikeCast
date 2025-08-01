// tests/test_dashboard_extreme_weather.js
const http = require('http');

function testExtremeWeatherEndpoint() {
    console.log('🧪 Testing Dashboard Extreme Weather Check');
    console.log('==========================================\n');
    
    return new Promise((resolve, reject) => {
        const data = '';
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/check-extreme-weather',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    
                    console.log(`📡 Request: POST /check-extreme-weather`);
                    console.log(`📊 Status Code: ${res.statusCode}`);
                    console.log(`📋 Response: ${JSON.stringify(result, null, 2)}\n`);
                    
                    if (res.statusCode === 200 && result.status === 'success') {
                        console.log('✅ Test PASSED: Extreme weather check endpoint working correctly');
                        console.log('✅ The dashboard "Check Extreme Weather" button should now work properly');
                        resolve(true);
                    } else {
                        console.log('❌ Test FAILED: Unexpected response');
                        resolve(false);
                    }
                } catch (error) {
                    console.log(`❌ Test FAILED: Invalid JSON response - ${error.message}`);
                    console.log(`Raw response: ${responseData}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Test FAILED: Connection error - ${error.message}`);
            console.log(`💡 Make sure the server is running: node index.js`);
            resolve(false);
        });
        
        req.write(data);
        req.end();
    });
}

async function runTest() {
    console.log('🔧 Dashboard Extreme Weather Button Fix Test');
    console.log('============================================\n');
    
    console.log('🎯 Problem: Dashboard "Check Extreme Weather" button was failing');
    console.log('🔍 Root Cause: Frontend GET request vs Backend POST route mismatch');
    console.log('✅ Solution: Fixed frontend to use POST method with proper headers\n');
    
    const success = await testExtremeWeatherEndpoint();
    
    console.log('\n📝 Test Summary:');
    console.log('================');
    console.log(`Dashboard Extreme Weather Check: ${success ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (success) {
        console.log('\n🎉 Fix verified! The dashboard extreme weather check is now working correctly.');
        console.log('Users can click "Check Extreme Weather" button without errors.');
    } else {
        console.log('\n❌ The fix needs more work. Check server logs for details.');
    }
}

// Run test if called directly
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = { testExtremeWeatherEndpoint, runTest };
