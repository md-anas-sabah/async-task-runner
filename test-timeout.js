import { runTasks, runTasksWithLogging } from './dist/index.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testBasicTimeout() {
  console.log('🧪 Test 1: Basic Timeout Functionality\n');
  
  const tasks = [
    async () => {
      await delay(500);
      return 'Fast task completed';
    },
    async () => {
      await delay(2000); // This will timeout
      return 'Slow task completed';
    },
    async () => {
      await delay(300);
      return 'Another fast task';
    }
  ];

  const results = await runTasksWithLogging(tasks, { 
    concurrency: 3,
    timeout: 1000 // 1 second timeout
  });
  
  console.log('\n📊 Results:');
  results.forEach((result, index) => {
    console.log(`Task ${index + 1}:`, {
      success: result.success,
      timedOut: result.timedOut,
      duration: result.duration ? `${result.duration.toFixed(2)}ms` : 'N/A',
      result: result.success ? result.result : result.error?.message
    });
  });
  console.log('');
}

async function testTimeoutWithRetries() {
  console.log('🧪 Test 2: Timeout with Retry Logic\n');
  
  let attempt = 0;
  
  const tasks = [
    // This task will timeout on first 2 attempts, succeed on 3rd
    async () => {
      attempt++;
      const duration = attempt < 3 ? 1500 : 200; // First 2 attempts timeout
      await delay(duration);
      return `Succeeded on attempt ${attempt}`;
    },
    
    // This task always times out
    async () => {
      await delay(2000);
      return 'Never succeeds';
    }
  ];

  const results = await runTasksWithLogging(tasks, { 
    concurrency: 2,
    timeout: 1000,
    retries: 3,
    retryDelay: 500
  });
  
  console.log('\n📊 Results:');
  results.forEach((result, index) => {
    console.log(`Task ${index + 1}:`, {
      success: result.success,
      attempts: result.attempts,
      timedOut: result.timedOut,
      duration: result.duration ? `${result.duration.toFixed(2)}ms` : 'N/A'
    });
    
    if (result.retryHistory) {
      console.log(`  Retry history:`, result.retryHistory.map(h => ({
        attempt: h.attempt,
        timedOut: h.timedOut,
        duration: `${h.duration?.toFixed(2)}ms`
      })));
    }
  });
  console.log('');
}

async function testMixedTimeoutScenarios() {
  console.log('🧪 Test 3: Mixed Timeout Scenarios\n');
  
  const tasks = [
    // Success - completes quickly
    async () => {
      await delay(100);
      return 'Quick success';
    },
    
    // Timeout - takes too long
    async () => {
      await delay(2000);
      return 'Too slow';
    },
    
    // Error before timeout
    async () => {
      await delay(100);
      throw new Error('Regular error');
    },
    
    // Success but close to timeout
    async () => {
      await delay(800);
      return 'Just made it';
    }
  ];

  const startTime = Date.now();
  const results = await runTasks(tasks, { 
    concurrency: 4,
    timeout: 1000
  });
  const totalTime = Date.now() - startTime;
  
  console.log(`Total execution time: ${totalTime}ms\n`);
  
  console.log('📊 Results Summary:');
  const successful = results.filter(r => r.success).length;
  const timedOut = results.filter(r => r.timedOut).length;
  const failed = results.filter(r => !r.success && !r.timedOut).length;
  
  console.log(`  Successful: ${successful}`);
  console.log(`  Timed out: ${timedOut}`);
  console.log(`  Failed (other): ${failed}`);
  console.log('');
}

async function testNoTimeoutConfiguration() {
  console.log('🧪 Test 4: No Timeout Configuration (Should not timeout)\n');
  
  const tasks = [
    async () => {
      await delay(2000);
      return 'Slow but completed';
    },
    async () => {
      await delay(3000);
      return 'Very slow but completed';
    }
  ];

  const startTime = Date.now();
  const results = await runTasks(tasks, { 
    concurrency: 2
    // No timeout specified
  });
  const totalTime = Date.now() - startTime;
  
  console.log(`Total time: ${totalTime}ms`);
  console.log('All tasks should complete without timeout:');
  
  results.forEach((result, index) => {
    console.log(`Task ${index + 1}:`, {
      success: result.success,
      timedOut: result.timedOut || false,
      duration: result.duration ? `${result.duration.toFixed(2)}ms` : 'N/A'
    });
  });
  console.log('');
}

async function testConcurrentTimeouts() {
  console.log('🧪 Test 5: Concurrent Tasks with Timeouts\n');
  
  const tasks = Array.from({ length: 8 }, (_, i) => async () => {
    const baseDelay = 500;
    const variableDelay = Math.random() * 1000; // 0-1000ms additional
    const totalDelay = baseDelay + variableDelay;
    
    console.log(`Task ${i + 1} will take ${totalDelay.toFixed(0)}ms`);
    await delay(totalDelay);
    
    return `Task ${i + 1} completed in ${totalDelay.toFixed(0)}ms`;
  });

  const results = await runTasksWithLogging(tasks, { 
    concurrency: 4,
    timeout: 1000, // Some will timeout, some won't
    retries: 1,
    retryDelay: 200
  });
  
  console.log('\n📊 Concurrent Results:');
  const successful = results.filter(r => r.success).length;
  const timedOut = results.filter(r => r.timedOut).length;
  const totalRetries = results.reduce((sum, r) => sum + (r.retryHistory?.length || 0), 0);
  
  console.log(`Success rate: ${successful}/${tasks.length}`);
  console.log(`Timeout count: ${timedOut}`);
  console.log(`Total retries: ${totalRetries}`);
  console.log('');
}

async function testRealWorldScenario() {
  console.log('🧪 Test 6: Real-world API Timeout Scenario\n');
  
  const apiEndpoints = [
    { name: 'fast-api', delay: 200 },
    { name: 'medium-api', delay: 800 },
    { name: 'slow-api', delay: 1500 }, // Will timeout
    { name: 'unreliable-api', delay: 600, failRate: 0.7 },
    { name: 'timeout-api', delay: 2000 } // Will always timeout
  ];

  const tasks = apiEndpoints.map(api => async () => {
    if (api.failRate && Math.random() < api.failRate) {
      await delay(100);
      throw new Error(`${api.name} returned 500 error`);
    }
    
    await delay(api.delay);
    return {
      endpoint: api.name,
      data: `Response from ${api.name}`,
      responseTime: api.delay
    };
  });

  const results = await runTasksWithLogging(tasks, { 
    concurrency: 3,
    timeout: 1000,
    retries: 2,
    retryDelay: 300,
    exponentialBackoff: true
  });
  
  console.log('\n🌐 API Call Results:');
  results.forEach((result, index) => {
    const api = apiEndpoints[index];
    if (result.success) {
      console.log(`✅ ${api.name}: Success (${result.attempts} attempts, ${result.duration?.toFixed(2)}ms)`);
    } else if (result.timedOut) {
      console.log(`⏰ ${api.name}: Timed out after ${result.attempts} attempts`);
    } else {
      console.log(`❌ ${api.name}: Failed - ${result.error?.message}`);
    }
  });
  console.log('');
}

async function runAllTimeoutTests() {
  console.log('🚀 Testing Phase 3: Timeout Support\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    await testBasicTimeout();
    await testTimeoutWithRetries();
    await testMixedTimeoutScenarios();
    await testNoTimeoutConfiguration();
    await testConcurrentTimeouts();
    await testRealWorldScenario();
    
    console.log('✅ All timeout tests completed successfully!');
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   • Task timeout with AbortController support');
    console.log('   • Timeout detection and proper error handling');
    console.log('   • Timeout + retry combinations');
    console.log('   • Duration tracking for all tasks');
    console.log('   • Timeout history in retry attempts');
    console.log('   • Graceful handling of concurrent timeouts');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runAllTimeoutTests();