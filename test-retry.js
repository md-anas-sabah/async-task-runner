import { runTasks, runTasksWithLogging } from './dist/index.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testBasicRetry() {
  console.log('🧪 Test 1: Basic Retry Functionality\n');
  
  let attempt1 = 0;
  let attempt2 = 0;
  
  const tasks = [
    async () => {
      attempt1++;
      if (attempt1 < 3) {
        throw new Error(`Attempt ${attempt1} failed`);
      }
      return `Task 1 succeeded on attempt ${attempt1}`;
    },
    async () => {
      attempt2++;
      if (attempt2 < 2) {
        throw new Error(`Attempt ${attempt2} failed`);
      }
      return `Task 2 succeeded on attempt ${attempt2}`;
    }
  ];

  const results = await runTasks(tasks, { 
    concurrency: 2, 
    retries: 3,
    retryDelay: 100
  });
  
  console.log('Results:');
  results.forEach((result, index) => {
    console.log(`Task ${index + 1}:`, {
      success: result.success,
      attempts: result.attempts,
      result: result.result,
      retryCount: result.retryHistory?.length || 0
    });
  });
  console.log('');
}

async function testExponentialBackoff() {
  console.log('🧪 Test 2: Exponential Backoff\n');
  
  let attempt = 0;
  const startTime = Date.now();
  
  const tasks = [
    async () => {
      attempt++;
      const currentTime = Date.now();
      console.log(`Attempt ${attempt} at ${currentTime - startTime}ms`);
      
      if (attempt < 4) {
        throw new Error(`Attempt ${attempt} failed`);
      }
      return 'Finally succeeded!';
    }
  ];

  const results = await runTasksWithLogging(tasks, { 
    retries: 4,
    retryDelay: 500,
    exponentialBackoff: true,
    maxRetryDelay: 5000
  });
  
  const totalTime = Date.now() - startTime;
  console.log(`\nTotal time: ${totalTime}ms`);
  console.log('Retry history:', results[0]?.retryHistory?.map(h => h.delay));
  console.log('');
}

async function testMaxRetryDelay() {
  console.log('🧪 Test 3: Max Retry Delay Limit\n');
  
  let attempt = 0;
  
  const tasks = [
    async () => {
      attempt++;
      console.log(`Attempt ${attempt}`);
      
      if (attempt < 6) {
        throw new Error(`Attempt ${attempt} failed`);
      }
      return 'Success after many attempts';
    }
  ];

  const results = await runTasksWithLogging(tasks, { 
    retries: 6,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxRetryDelay: 2000  // Cap at 2 seconds
  });
  
  console.log('Retry delays:', results[0]?.retryHistory?.map(h => h.delay));
  console.log('Result:', results[0]?.success ? 'Success' : 'Failed');
  console.log('');
}

async function testMixedSuccessFailure() {
  console.log('🧪 Test 4: Mixed Success and Failure with Retries\n');
  
  const tasks = [
    // This task succeeds immediately
    async () => {
      return 'Immediate success';
    },
    
    // This task succeeds on 2nd attempt
    (() => {
      let attempts = 0;
      return async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('First attempt failed');
        }
        return 'Success on retry';
      };
    })(),
    
    // This task fails all attempts
    async () => {
      throw new Error('Always fails');
    },
    
    // This task succeeds on 3rd attempt
    (() => {
      let attempts = 0;
      return async () => {
        attempts++;
        await delay(50);
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'Success after 2 retries';
      };
    })()
  ];

  const results = await runTasksWithLogging(tasks, { 
    concurrency: 2,
    retries: 2,
    retryDelay: 200
  });
  
  console.log('\nSummary:');
  results.forEach((result, index) => {
    console.log(`Task ${index + 1}:`, {
      success: result.success,
      attempts: result.attempts,
      retries: result.retryHistory?.length || 0,
      finalResult: result.success ? result.result : result.error?.message
    });
  });
  console.log('');
}

async function testRetryWithConcurrency() {
  console.log('🧪 Test 5: Retry with Concurrency Control\n');
  
  const tasks = Array.from({ length: 6 }, (_, i) => {
    let attempts = 0;
    return async () => {
      attempts++;
      console.log(`Task ${i + 1} - Attempt ${attempts}`);
      
      // Simulate different failure patterns
      const failCount = (i % 3) + 1; // Fail 1-3 times
      if (attempts <= failCount) {
        throw new Error(`Task ${i + 1} attempt ${attempts} failed`);
      }
      
      return `Task ${i + 1} completed`;
    };
  });

  const startTime = Date.now();
  const results = await runTasksWithLogging(tasks, { 
    concurrency: 3,
    retries: 4,
    retryDelay: 300
  });
  const totalTime = Date.now() - startTime;
  
  console.log(`\nCompleted in ${totalTime}ms`);
  
  const successCount = results.filter(r => r.success).length;
  const totalRetries = results.reduce((sum, r) => sum + (r.retryHistory?.length || 0), 0);
  
  console.log(`Success rate: ${successCount}/${results.length}`);
  console.log(`Total retries: ${totalRetries}`);
  console.log('');
}

async function runAllRetryTests() {
  console.log('🚀 Testing Phase 2: Retry Logic\n');
  console.log('=========================================\n');
  
  try {
    await testBasicRetry();
    await testExponentialBackoff();
    await testMaxRetryDelay();
    await testMixedSuccessFailure();
    await testRetryWithConcurrency();
    
    console.log('✅ All retry tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runAllRetryTests();