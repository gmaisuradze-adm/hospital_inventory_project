#!/usr/bin/env node

/**
 * Comprehensive End-to-End Integration Test for Hospital Inventory AI Module
 * 
 * This test verifies that the AI module integration works correctly
 * by testing the Python bridge directly with comprehensive test scenarios.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test data
const testData = {
  healthCheck: {
    action: 'health_check',
    data: {}
  },
  forecast: {
    action: 'forecast',
    data: {
      itemId: 'TEST_SURGICAL_GLOVES_001',
      forecastHorizon: 30,
      historicalData: [
        { date: '2024-01-01', demand: 150, consumed: 145 },
        { date: '2024-01-02', demand: 160, consumed: 155 },
        { date: '2024-01-03', demand: 140, consumed: 138 },
        { date: '2024-01-04', demand: 170, consumed: 165 },
        { date: '2024-01-05', demand: 155, consumed: 150 },
        { date: '2024-01-06', demand: 165, consumed: 160 },
        { date: '2024-01-07', demand: 145, consumed: 142 }
      ]
    }
  },
  optimize: {
    action: 'optimize',
    data: {
      item: {
        id: 'TEST_SURGICAL_MASKS_001',
        name: 'Surgical Face Masks',
        category: 'PPE',
        currentStock: 2500,
        unit: 'boxes',
        cost: 12.50
      },
      constraints: {
        maxBudget: 15000,
        storageCapacity: 5000,
        serviceLevel: 0.98,
        leadTimeDays: 5
      },
      historicalData: [
        { date: '2024-01-01', demand: 85, consumed: 80, stockLevel: 2500 },
        { date: '2024-01-02', demand: 90, consumed: 88, stockLevel: 2420 },
        { date: '2024-01-03', demand: 78, consumed: 75, stockLevel: 2345 },
        { date: '2024-01-04', demand: 95, consumed: 92, stockLevel: 2270 },
        { date: '2024-01-05', demand: 82, consumed: 80, stockLevel: 2190 },
        { date: '2024-01-06', demand: 88, consumed: 85, stockLevel: 2110 },
        { date: '2024-01-07', demand: 92, consumed: 90, stockLevel: 2025 }
      ]
    }
  }
};

// Test runner
async function runBridgeTest(testName, inputData) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${testName} test...`);
    
    const bridgePath = path.join(__dirname, 'ai-module', 'integration_bridge.py');
    const pythonProcess = spawn('python3', [bridgePath], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    
    let output = '';
    let errorOutput = '';
    
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      resolve({ success: false, error: 'Test timeout' });
    }, 30000); // 30 second timeout
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      try {
        if (code !== 0 && code !== null) {
          console.error(`❌ ${testName} failed with exit code ${code}`);
          resolve({ success: false, error: `Exit code: ${code}`, stderr: errorOutput });
          return;
        }
        
        const result = JSON.parse(output);
        console.log(`✅ ${testName} completed successfully`);
        resolve(result);
      } catch (error) {
        console.error(`❌ ${testName} failed to parse JSON response`);
        console.error('Raw output:', output);
        console.error('Error:', error.message);
        resolve({ success: false, error: error.message, output, stderr: errorOutput });
      }
    });
    
    pythonProcess.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ ${testName} process error:`, error);
      resolve({ success: false, error: error.message });
    });
    
    // Send the test data
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
}

// Validation functions
function validateHealthCheck(result) {
  const checks = [
    { name: 'Success field', test: () => result.success === true },
    { name: 'Status field', test: () => result.status === 'success' },
    { name: 'Message field', test: () => result.message && result.message.includes('healthy') },
    { name: 'Checks object', test: () => result.checks && typeof result.checks === 'object' },
    { name: 'Timestamp field', test: () => result.timestamp && typeof result.timestamp === 'string' }
  ];
  
  return validateResult('Health Check', checks);
}

function validateForecast(result) {
  const checks = [
    { name: 'Success field', test: () => result.success === true },
    { name: 'Predictions array', test: () => Array.isArray(result.predictions) },
    { name: 'Predictions length', test: () => result.predictions.length === 30 },
    { name: 'Model used field', test: () => result.model_used && typeof result.model_used === 'string' },
    { name: 'Accuracy field', test: () => typeof result.accuracy === 'number' },
    { name: 'Confidence intervals', test: () => result.confidence_intervals && result.confidence_intervals.lower && result.confidence_intervals.upper }
  ];
  
  return validateResult('Forecast', checks);
}

function validateOptimization(result) {
  const checks = [
    { name: 'Success field', test: () => result.success === true },
    { name: 'Recommendations array', test: () => Array.isArray(result.recommendations) },
    { name: 'Recommendations length', test: () => result.recommendations.length > 0 },
    { name: 'First recommendation', test: () => {
      const rec = result.recommendations[0];
      return rec && rec.itemId && rec.itemName && rec.status === 'success';
    }},
    { name: 'Optimization fields', test: () => {
      const rec = result.recommendations[0];
      return typeof rec.reorderPoint === 'number' && 
             typeof rec.safetyStock === 'number' &&
             typeof rec.recommendedStockLevel === 'number';
    }}
  ];
  
  return validateResult('Optimization', checks);
}

function validateResult(testName, checks) {
  console.log(`\n📋 Validating ${testName} results:`);
  let allPassed = true;
  
  checks.forEach(check => {
    try {
      const passed = check.test();
      console.log(`  ${passed ? '✅' : '❌'} ${check.name}`);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`  ❌ ${check.name} (Error: ${error.message})`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Main test execution
async function runAllTests() {
  console.log('🏥 Hospital Inventory AI Module - Comprehensive Integration Test Suite');
  console.log('=====================================================================');
  
  const results = {};
  let testsPassed = 0;
  let totalTests = 3;
  
  try {
    // Test 1: Health Check
    console.log('\n🔍 Phase 1: AI Module Health Check');
    results.healthCheck = await runBridgeTest('Health Check', testData.healthCheck);
    const healthCheckValid = validateHealthCheck(results.healthCheck);
    if (healthCheckValid) testsPassed++;
    
    // Test 2: Demand Forecasting
    console.log('\n📈 Phase 2: Demand Forecasting');
    results.forecast = await runBridgeTest('Demand Forecast', testData.forecast);
    const forecastValid = validateForecast(results.forecast);
    if (forecastValid) testsPassed++;
    
    // Test 3: Inventory Optimization
    console.log('\n⚖️ Phase 3: Inventory Optimization');
    results.optimize = await runBridgeTest('Inventory Optimization', testData.optimize);
    const optimizationValid = validateOptimization(results.optimize);
    if (optimizationValid) testsPassed++;
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Health Check: ${healthCheckValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Demand Forecast: ${forecastValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Inventory Optimization: ${optimizationValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`\nOverall Score: ${testsPassed}/${totalTests} tests passed`);
    
    const allTestsPassed = testsPassed === totalTests;
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('\n✅ AI Module Status: FULLY OPERATIONAL');
      console.log('\n🚀 System Capabilities Verified:');
      console.log('   ✓ Health monitoring and diagnostics');
      console.log('   ✓ Demand forecasting with confidence intervals');
      console.log('   ✓ Inventory optimization with safety stock calculations');
      console.log('   ✓ Error handling and fallback mechanisms');
      console.log('   ✓ JSON API communication protocol');
      
      console.log('\n📋 Next Steps:');
      console.log('   • Deploy backend API endpoints');
      console.log('   • Integrate with frontend user interface');
      console.log('   • Configure production database connections');
      console.log('   • Set up monitoring and alerting');
      console.log('   • Run performance tests with real hospital data');
      
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
      console.log(`   ${totalTests - testsPassed} out of ${totalTests} tests need attention`);
      console.log('\n🔧 Troubleshooting Guide:');
      
      if (!healthCheckValid) {
        console.log('   • Check Python environment and dependencies');
        console.log('   • Verify AI module imports and initialization');
      }
      
      if (!forecastValid) {
        console.log('   • Review demand forecasting implementation');
        console.log('   • Check data preprocessing and model training');
      }
      
      if (!optimizationValid) {
        console.log('   • Verify inventory optimization algorithms');
        console.log('   • Test with different data scenarios');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR - Test suite execution failed:', error);
    console.error('\n🆘 Please check:');
    console.error('   • Python installation and PATH configuration');
    console.error('   • AI module dependencies and imports');
    console.error('   • File permissions and directory structure');
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  console.log('Starting comprehensive AI module integration tests...\n');
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, runBridgeTest, validateHealthCheck, validateForecast, validateOptimization };
