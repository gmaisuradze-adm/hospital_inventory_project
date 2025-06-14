const { spawn } = require('child_process');
const path = require('path');

describe('AI Module Integration Tests', () => {
  // Test the Python bridge directly
  test('Python bridge should handle health check command', (done) => {
    const bridgePath = path.join(__dirname, '../../../ai-module/integration_bridge.py');
    const pythonProcess = spawn('python3', [bridgePath]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        expect(result.success).toBe(true);
        expect(result.message).toContain('healthy');
        done();
      } catch (error) {
        done(error);
      }
    });
    
    // Send health check command
    const command = JSON.stringify({
      action: 'health_check',
      data: {}
    });
    
    pythonProcess.stdin.write(command);
    pythonProcess.stdin.end();
  });

  // Test forecast command
  test('Python bridge should handle forecast command', (done) => {
    const bridgePath = path.join(__dirname, '../../../ai-module/integration_bridge.py');
    const pythonProcess = spawn('python3', [bridgePath]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        expect(result.success).toBe(true);
        expect(result.predictions).toBeDefined();
        expect(Array.isArray(result.predictions)).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    });
    
    // Send forecast command
    const command = JSON.stringify({
      action: 'forecast',
      data: {
        itemId: 'test-item-123',
        forecastHorizon: 30,
        historicalData: [
          { date: '2024-01-01', demand: 100, consumed: 95 },
          { date: '2024-01-02', demand: 105, consumed: 100 },
          { date: '2024-01-03', demand: 110, consumed: 108 },
          { date: '2024-01-04', demand: 95, consumed: 90 },
          { date: '2024-01-05', demand: 120, consumed: 115 }
        ]
      }
    });
    
    pythonProcess.stdin.write(command);
    pythonProcess.stdin.end();
  });

  // Test optimize command
  test('Python bridge should handle optimize command', (done) => {
    const bridgePath = path.join(__dirname, '../../../ai-module/integration_bridge.py');
    const pythonProcess = spawn('python3', [bridgePath]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        expect(result.success).toBe(true);
        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
        if (result.recommendations.length > 0) {
          expect(result.recommendations[0].reorderPoint).toBeGreaterThanOrEqual(0);
        }
        done();
      } catch (error) {
        done(error);
      }
    });
    
    // Send optimize command
    const command = JSON.stringify({
      action: 'optimize',
      data: {
        item: {
          id: 'test-item-456',
          name: 'Test Medical Supply',
          category: 'Medical',
          currentStock: 500,
          unit: 'units',
          cost: 25.50
        },
        constraints: {
          maxBudget: 10000,
          storageCapacity: 2000,
          serviceLevel: 0.95
        },
        historicalData: [
          { date: '2024-01-01', demand: 50, consumed: 48, stockLevel: 500 },
          { date: '2024-01-02', demand: 55, consumed: 52, stockLevel: 448 },
          { date: '2024-01-03', demand: 45, consumed: 43, stockLevel: 405 },
          { date: '2024-01-04', demand: 60, consumed: 58, stockLevel: 347 },
          { date: '2024-01-05', demand: 52, consumed: 50, stockLevel: 297 }
        ]
      }
    });
    
    pythonProcess.stdin.write(command);
    pythonProcess.stdin.end();
  });

  // Test error handling
  test('Python bridge should handle invalid commands gracefully', (done) => {
    const bridgePath = path.join(__dirname, '../../../ai-module/integration_bridge.py');
    const pythonProcess = spawn('python3', [bridgePath]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      try {
        const result = JSON.parse(output);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Unknown action');
        done();
      } catch (error) {
        done(error);
      }
    });
    
    // Send invalid command
    const command = JSON.stringify({
      action: 'invalid_action',
      data: {}
    });
    
    pythonProcess.stdin.write(command);
    pythonProcess.stdin.end();
  });
});
