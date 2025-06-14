const { spawn } = require('child_process');
const path = require('path');

// Test function to verify AI module integration
async function testAIIntegration() {
    console.log('Testing AI Module Integration...');
    
    const aiModulePath = path.join(__dirname, 'ai-module');
    const bridgePath = path.join(aiModulePath, 'integration_bridge.py');
    
    const testData = {
        action: 'health_check'
    };
    
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [bridgePath], {
            cwd: aiModulePath,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    console.log('✅ AI Module Response:', output);
                    resolve({ success: true, output, code });
                } catch (error) {
                    console.log('❌ Failed to parse response:', error.message);
                    resolve({ success: false, error: error.message, output, errorOutput });
                }
            } else {
                console.log('❌ AI Module failed with code:', code);
                console.log('Error output:', errorOutput);
                resolve({ success: false, code, errorOutput, output });
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.log('❌ Failed to start Python process:', error.message);
            reject(error);
        });
        
        // Send test data
        pythonProcess.stdin.write(JSON.stringify(testData) + '\n');
        pythonProcess.stdin.end();
    });
}

// Test forecasting with sample data
async function testForecastingIntegration() {
    console.log('\nTesting Forecasting Integration...');
    
    const aiModulePath = path.join(__dirname, 'ai-module');
    const bridgePath = path.join(aiModulePath, 'integration_bridge.py');
    
    const testData = {
        action: 'forecast',
        data: {
            item_id: 'test-item-1',
            item_name: 'Test Medical Equipment',
            historical_data: [
                { date: '2024-01-01', quantity: 10 },
                { date: '2024-01-02', quantity: 12 },
                { date: '2024-01-03', quantity: 8 },
                { date: '2024-01-04', quantity: 15 },
                { date: '2024-01-05', quantity: 11 },
                { date: '2024-01-06', quantity: 13 },
                { date: '2024-01-07', quantity: 9 },
                { date: '2024-01-08', quantity: 14 },
                { date: '2024-01-09', quantity: 10 },
                { date: '2024-01-10', quantity: 16 }
            ],
            forecast_horizon: 7,
            model_type: 'auto'
        }
    };
    
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [bridgePath], {
            cwd: aiModulePath,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    console.log('✅ Forecasting Response:', output);
                    resolve({ success: true, output, code });
                } catch (error) {
                    console.log('❌ Failed to parse response:', error.message);
                    resolve({ success: false, error: error.message, output, errorOutput });
                }
            } else {
                console.log('❌ Forecasting failed with code:', code);
                console.log('Error output:', errorOutput);
                resolve({ success: false, code, errorOutput, output });
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.log('❌ Failed to start Python process:', error.message);
            reject(error);
        });
        
        // Send test data
        pythonProcess.stdin.write(JSON.stringify(testData) + '\n');
        pythonProcess.stdin.end();
    });
}

// Run tests
async function runTests() {
    try {
        console.log('🚀 Starting AI Module Integration Tests\n');
        
        // Run health check test
        const healthResult = await testAIIntegration();
        if (!healthResult.success) {
            console.log('❌ Health check failed');
            return;
        }
        
        // Run forecasting test
        const forecastResult = await testForecastingIntegration();
        if (!forecastResult.success) {
            console.log('❌ Forecasting test failed');
            return;
        }
        
        console.log('\n✅ All integration tests passed!');
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Run the tests
runTests();
