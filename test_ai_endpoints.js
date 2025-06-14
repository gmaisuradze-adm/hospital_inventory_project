const axios = require('axios');

// Test script for AI module API endpoints
async function testAIEndpoints() {
    console.log('Testing AI Module Backend Endpoints...\n');

    // First, let's try to login to get a token
    try {
        console.log('1. Testing login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@hospital.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✓ Login successful, token received');
        
        // Get inventory items first
        console.log('\n2. Getting inventory items...');
        const inventoryResponse = await axios.get('http://localhost:3001/api/inventory?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const items = inventoryResponse.data.items;
        console.log(`✓ Found ${items.length} inventory items`);
        
        if (items.length === 0) {
            console.log('❌ No inventory items found. Seeding database might be needed.');
            return;
        }
        
        const testItem = items[0];
        console.log(`   Using test item: ${testItem.name} (ID: ${testItem.id})`);
        
        // Test AI forecast endpoint
        console.log('\n3. Testing AI forecast endpoint...');
        try {
            const forecastResponse = await axios.post('http://localhost:3001/api/ai/forecast', {
                itemId: testItem.id,
                forecastHorizon: 30,
                modelType: 'auto'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✓ Forecast endpoint successful');
            console.log(`   Model used: ${forecastResponse.data.model_used}`);
            console.log(`   Forecast points: ${forecastResponse.data.forecast.length}`);
        } catch (error) {
            console.log('❌ Forecast endpoint failed:', error.response?.data || error.message);
        }
        
        // Test AI optimization endpoint
        console.log('\n4. Testing AI optimization endpoint...');
        try {
            const optimizeResponse = await axios.post('http://localhost:3001/api/ai/optimize', {
                itemId: testItem.id,
                serviceLevel: 0.95,
                holdingCostRate: 0.25,
                orderingCost: 150
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✓ Optimization endpoint successful');
            console.log(`   Recommendations: ${optimizeResponse.data.recommendations.length}`);
            if (optimizeResponse.data.recommendations.length > 0) {
                const rec = optimizeResponse.data.recommendations[0];
                console.log(`   Status: ${rec.status}`);
                if (rec.status === 'success') {
                    console.log(`   Recommended stock: ${rec.recommendedStockLevel}`);
                    console.log(`   Reorder point: ${rec.reorderPoint}`);
                }
            }
        } catch (error) {
            console.log('❌ Optimization endpoint failed:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data || error.message);
        console.log('Make sure the backend is running and the database is seeded.');
    }
}

testAIEndpoints().catch(console.error);
