import { runTasksWithSummary, runTasksWithSummaryAndLogging, formatSummary } from './dist/index.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testBasicSummary() {
  console.log('🧪 Test 1: Basic Summary Generation\n');
  
  const tasks = [
    async () => {
      await delay(200);
      return 'Task 1 success';
    },
    async () => {
      await delay(100);
      throw new Error('Task 2 failed');
    },
    async () => {
      await delay(300);
      return 'Task 3 success';
    }
  ];

  const summary = await runTasksWithSummary(tasks, { 
    concurrency: 3 
  });
  
  console.log('📊 Basic Summary:');
  console.log(formatSummary(summary));
  console.log('');
}

async function testSummaryWithRetries() {
  console.log('🧪 Test 2: Summary with Retries and Timeouts\n');
  
  let attempt1 = 0;
  let attempt2 = 0;
  
  const tasks = [
    // Success on 2nd attempt
    async () => {
      attempt1++;
      if (attempt1 < 2) {
        throw new Error('First attempt failed');
      }
      await delay(150);
      return 'Success after retry';
    },
    
    // Timeout then success
    async () => {
      attempt2++;
      const duration = attempt2 < 2 ? 1500 : 200; // First attempt times out
      await delay(duration);
      return 'Success after timeout retry';
    },
    
    // Always fails
    async () => {
      throw new Error('Always fails');
    },
    
    // Always times out
    async () => {
      await delay(2000);
      return 'Never succeeds';
    }
  ];

  const summary = await runTasksWithSummaryAndLogging(tasks, { 
    concurrency: 2,
    retries: 2,
    retryDelay: 300,
    timeout: 1000
  });
  
  console.log('\n📊 Retry & Timeout Summary:');
  console.log(formatSummary(summary));
  console.log('');
}

async function testErrorAggregation() {
  console.log('🧪 Test 3: Error Aggregation and Categorization\n');
  
  const tasks = [
    // Database connection errors (multiple tasks with same error)
    async () => { throw new Error('Database connection timeout'); },
    async () => { throw new Error('Database connection timeout'); },
    async () => { throw new Error('Database connection timeout'); },
    
    // API errors
    async () => { throw new Error('API rate limit exceeded'); },
    async () => { throw new Error('API rate limit exceeded'); },
    
    // Network timeouts
    async () => { await delay(1500); return 'success'; },
    async () => { await delay(1500); return 'success'; },
    
    // Unique errors
    async () => { throw new Error('File not found'); },
    async () => { throw new Error('Permission denied'); }
  ];

  const summary = await runTasksWithSummary(tasks, { 
    concurrency: 3,
    timeout: 1000,
    retries: 1,
    retryDelay: 200
  });
  
  console.log('📊 Error Aggregation Summary:');
  console.log(formatSummary(summary));
  console.log('');
}

async function testPerformanceMetrics() {
  console.log('🧪 Test 4: Performance Metrics Analysis\n');
  
  const tasks = Array.from({ length: 20 }, (_, i) => async () => {
    const duration = 100 + (i * 50); // Varying durations
    await delay(duration);
    return `Task ${i + 1} completed in ${duration}ms`;
  });

  const summary = await runTasksWithSummary(tasks, { 
    concurrency: 5 
  });
  
  console.log('📊 Performance Summary:');
  console.log(formatSummary(summary));
  
  // Additional performance analysis
  console.log('\n📈 Additional Performance Metrics:');
  console.log(`   Fastest task: ${Math.min(...summary.results.map(r => r.duration || 0)).toFixed(2)}ms`);
  console.log(`   Slowest task: ${Math.max(...summary.results.map(r => r.duration || 0)).toFixed(2)}ms`);
  console.log(`   Median duration: ${getMedian(summary.results.map(r => r.duration || 0)).toFixed(2)}ms`);
  console.log(`   Tasks per second: ${(summary.results.length / (summary.executionTime / 1000)).toFixed(2)}`);
  console.log('');
}

async function testRealWorldScenario() {
  console.log('🧪 Test 5: Real-world API Processing Summary\n');
  
  const apiEndpoints = [
    { name: 'user-service', delay: 150, failRate: 0.1 },
    { name: 'auth-service', delay: 200, failRate: 0.05 },
    { name: 'payment-service', delay: 800, failRate: 0.3 },
    { name: 'inventory-service', delay: 300, failRate: 0.2 },
    { name: 'notification-service', delay: 1200, failRate: 0.1 }, // Will timeout
    { name: 'analytics-service', delay: 100, failRate: 0.05 },
    { name: 'recommendation-service', delay: 1500, failRate: 0.2 }, // Will timeout
    { name: 'search-service', delay: 250, failRate: 0.15 }
  ];

  const tasks = apiEndpoints.map(api => async () => {
    if (Math.random() < api.failRate) {
      await delay(50);
      throw new Error(`${api.name} returned 500 error`);
    }
    
    await delay(api.delay);
    return {
      service: api.name,
      status: 'success',
      responseTime: api.delay
    };
  });

  const summary = await runTasksWithSummaryAndLogging(tasks, { 
    concurrency: 4,
    timeout: 1000,
    retries: 2,
    retryDelay: 500,
    exponentialBackoff: true
  });
  
  console.log('\n📊 API Processing Summary:');
  console.log(formatSummary(summary));
  
  // Service-specific analysis
  console.log('\n🔍 Service Analysis:');
  summary.results.forEach((result, index) => {
    const api = apiEndpoints[index];
    if (result.success) {
      console.log(`✅ ${api.name}: Healthy (${result.duration?.toFixed(0)}ms)`);
    } else if (result.timedOut) {
      console.log(`⏰ ${api.name}: Timeout (exceeded 1000ms limit)`);
    } else {
      console.log(`❌ ${api.name}: Failed (${result.error?.message})`);
    }
  });
  console.log('');
}

async function testEmptyAndEdgeCases() {
  console.log('🧪 Test 6: Edge Cases and Empty Task Lists\n');
  
  // Empty task list
  console.log('Empty task list:');
  const emptySummary = await runTasksWithSummary([], {});
  console.log(formatSummary(emptySummary));
  
  // Single task
  console.log('\nSingle successful task:');
  const singleSummary = await runTasksWithSummary([
    async () => {
      await delay(100);
      return 'Single task success';
    }
  ], {});
  console.log(formatSummary(singleSummary));
  
  // Single failing task with retries
  console.log('\nSingle failing task with retries:');
  const failingSummary = await runTasksWithSummary([
    async () => {
      throw new Error('Always fails');
    }
  ], { retries: 3, retryDelay: 100 });
  console.log(formatSummary(failingSummary));
  console.log('');
}

function getMedian(numbers) {
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

async function runAllSummaryTests() {
  console.log('🚀 Testing Phase 4: Task Result Reporting\n');
  console.log('=' .repeat(60) + '\n');
  
  try {
    await testBasicSummary();
    await testSummaryWithRetries();
    await testErrorAggregation();
    await testPerformanceMetrics();
    await testRealWorldScenario();
    await testEmptyAndEdgeCases();
    
    console.log('✅ All summary tests completed successfully!');
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   • Comprehensive execution summaries');
    console.log('   • Error aggregation and categorization');
    console.log('   • Performance metrics and timing analysis');
    console.log('   • Success/failure/timeout breakdowns');
    console.log('   • Retry statistics and history');
    console.log('   • Human-readable formatted reports');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runAllSummaryTests();