import { runTasksWithSummary, formatSummary } from './dist/index.js';

async function comprehensiveTest() {
  console.log('🚀 Running Comprehensive Integration Test');
  console.log('='.repeat(50));
  
  const tasks = [
    () => new Promise(resolve => setTimeout(() => resolve('Quick success'), 100)),
    () => new Promise((resolve, reject) => setTimeout(() => reject(new Error('Quick failure')), 150)),
    () => new Promise(resolve => setTimeout(() => resolve('Medium task'), 500)),
    () => new Promise(resolve => setTimeout(() => resolve('Slow success'), 1500)), // Should timeout
    async () => {
      // Retry test - fails first 2 times
      if (!this.attempt) this.attempt = 0;
      this.attempt++;
      if (this.attempt < 3) throw new Error('Retry test');
      return 'Success after retries';
    },
    () => new Promise(resolve => setTimeout(() => resolve('Final success'), 200))
  ];
  
  const summary = await runTasksWithSummary(tasks, {
    concurrency: 3,
    retries: 3,
    retryDelay: 200,
    exponentialBackoff: true,
    maxRetryDelay: 2000,
    timeout: 1000
  });
  
  console.log(formatSummary(summary));
  
  // Verify key metrics
  console.log('\n🔍 Integration Test Verification:');
  console.log('✅ Summary generated:', !!summary);
  console.log('✅ Has results:', summary.results.length > 0);
  console.log('✅ Has performance data:', !!summary.performance);
  console.log('✅ Has error breakdown:', !!summary.errorBreakdown);
  console.log('✅ Success rate calculated:', typeof summary.successRate === 'number');
  
  return summary;
}

comprehensiveTest().catch(console.error);