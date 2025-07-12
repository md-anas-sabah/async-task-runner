import { runTasks } from './dist/index.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testBasicUsage() {
  console.log('🧪 Test 1: Basic Usage with 3 tasks\n');
  
  const tasks = [
    async () => {
      await delay(500);
      return 'Task 1 result';
    },
    async () => {
      await delay(300);
      return 'Task 2 result';
    },
    async () => {
      await delay(700);
      return 'Task 3 result';
    }
  ];

  const results = await runTasks(tasks, { concurrency: 2 });
  
  console.log('Results:', results);
  console.log('Success count:', results.filter(r => r.success).length);
  console.log('');
}

async function testErrorHandling() {
  console.log('🧪 Test 2: Error Handling\n');
  
  const tasks = [
    async () => {
      await delay(100);
      return 'Success 1';
    },
    async () => {
      await delay(200);
      throw new Error('Task failed!');
    },
    async () => {
      await delay(150);
      return 'Success 2';
    }
  ];

  const results = await runTasks(tasks, { concurrency: 3 });
  
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ Task ${index + 1}: ${result.result}`);
    } else {
      console.log(`❌ Task ${index + 1}: ${result.error.message}`);
    }
  });
  console.log('');
}

async function testConcurrencyControl() {
  console.log('🧪 Test 3: Concurrency Control (limit 2)\n');
  
  const startTimes = [];
  const endTimes = [];
  
  const tasks = Array.from({ length: 5 }, (_, i) => async () => {
    startTimes[i] = Date.now();
    console.log(`Task ${i + 1} started`);
    await delay(1000);
    endTimes[i] = Date.now();
    console.log(`Task ${i + 1} finished`);
    return `Task ${i + 1} result`;
  });

  const start = Date.now();
  const results = await runTasks(tasks, { concurrency: 2 });
  const totalTime = Date.now() - start;
  
  console.log(`\nTotal time: ${totalTime}ms`);
  console.log('All tasks completed:', results.every(r => r.success));
  console.log('');
}

async function testLargeTaskSet() {
  console.log('🧪 Test 4: Large Task Set (50 tasks, concurrency 5)\n');
  
  const tasks = Array.from({ length: 50 }, (_, i) => async () => {
    await delay(Math.random() * 100);
    return `Task ${i + 1} done`;
  });

  const start = Date.now();
  const results = await runTasks(tasks, { concurrency: 5 });
  const totalTime = Date.now() - start;
  
  console.log(`Completed ${results.length} tasks in ${totalTime}ms`);
  console.log('Success rate:', `${results.filter(r => r.success).length}/${results.length}`);
  console.log('');
}

async function testRealWorldExample() {
  console.log('🧪 Test 5: Real-world Example (API calls simulation)\n');
  
  const mockApiCall = (id, delay_ms, shouldFail = false) => async () => {
    console.log(`📡 Calling API ${id}...`);
    await delay(delay_ms);
    
    if (shouldFail) {
      throw new Error(`API ${id} returned 500`);
    }
    
    return {
      id,
      data: `Response from API ${id}`,
      timestamp: new Date().toISOString()
    };
  };

  const apiTasks = [
    mockApiCall(1, 300),
    mockApiCall(2, 500),
    mockApiCall(3, 200, true), // This one fails
    mockApiCall(4, 400),
    mockApiCall(5, 600),
  ];

  const results = await runTasks(apiTasks, { concurrency: 3 });
  
  console.log('\n📊 API Results:');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ API ${index + 1}:`, result.result.data);
    } else {
      console.log(`❌ API ${index + 1}:`, result.error.message);
    }
  });
  console.log('');
}

async function runAllTests() {
  console.log('🚀 Testing async-task-runner package\n');
  console.log('==========================================\n');
  
  try {
    await testBasicUsage();
    await testErrorHandling();
    await testConcurrencyControl();
    await testLargeTaskSet();
    await testRealWorldExample();
    
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runAllTests();