import { runTasks, runTasksWithLogging } from './src/index.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateApiRequest(endpoint: string, duration: number, failureRate = 0): Promise<any> {
  if (Math.random() < failureRate) {
    await delay(50);
    throw new Error(`${endpoint} API returned 500 error`);
  }
  
  await delay(duration);
  return {
    endpoint,
    data: `Response from ${endpoint}`,
    responseTime: duration,
    timestamp: new Date().toISOString()
  };
}

async function webScrapingWithTimeout() {
  console.log('🕷️  Web Scraping with Timeout Protection\n');
  
  const scrapingTasks = [
    async () => simulateApiRequest('fast-api', 300),
    async () => simulateApiRequest('medium-api', 800),
    async () => simulateApiRequest('slow-api', 1500), // Will timeout
    async () => simulateApiRequest('unreliable-api', 600, 0.3),
    async () => simulateApiRequest('very-slow-api', 3000), // Will timeout
  ];

  console.log('Scraping with 1 second timeout per request...');
  
  const results = await runTasksWithLogging(scrapingTasks, {
    concurrency: 3,
    timeout: 1000, // 1 second timeout
    retries: 2,
    retryDelay: 500
  });

  console.log('\n📊 Scraping Results:');
  results.forEach((result, index) => {
    const apiName = ['fast-api', 'medium-api', 'slow-api', 'unreliable-api', 'very-slow-api'][index];
    
    if (result.success) {
      console.log(`✅ ${apiName}: Success (${result.duration?.toFixed(0)}ms, ${result.attempts} attempts)`);
    } else if (result.timedOut) {
      console.log(`⏰ ${apiName}: Timed out (${result.duration?.toFixed(0)}ms total, ${result.attempts} attempts)`);
    } else {
      console.log(`❌ ${apiName}: Failed - ${result.error?.message}`);
    }
  });
}

async function emailSendingWithTimeout() {
  console.log('\n📧 Email Sending with Timeout Control\n');
  
  const emailTasks = [
    async () => {
      await simulateApiRequest('smtp-server-1', 200);
      return { status: 'sent', server: 'smtp-1', messageId: 'msg_001' };
    },
    async () => {
      await simulateApiRequest('smtp-server-2', 1200); // Will timeout
      return { status: 'sent', server: 'smtp-2', messageId: 'msg_002' };
    },
    async () => {
      await simulateApiRequest('smtp-server-3', 400);
      return { status: 'sent', server: 'smtp-3', messageId: 'msg_003' };
    }
  ];

  const results = await runTasks(emailTasks, {
    concurrency: 2,
    timeout: 1000, // 1 second timeout for email sending
    retries: 1,
    retryDelay: 1000
  });

  const successful = results.filter(r => r.success).length;
  const timedOut = results.filter(r => r.timedOut).length;

  console.log(`📈 Email Results: ${successful}/3 sent, ${timedOut} timed out`);
  console.log('Average duration:', `${results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length}ms`);
}

async function databaseOperationsWithTimeout() {
  console.log('\n🗄️  Database Operations with Timeout Safety\n');
  
  const dbOperations = [
    async () => {
      await delay(150);
      return { operation: 'SELECT', rows: 100, duration: 150 };
    },
    async () => {
      await delay(2000); // This will timeout
      return { operation: 'BULK_INSERT', rows: 10000, duration: 2000 };
    },
    async () => {
      await delay(500);
      return { operation: 'UPDATE', rows: 50, duration: 500 };
    },
    async () => {
      await delay(1800); // This will timeout  
      return { operation: 'COMPLEX_JOIN', rows: 500, duration: 1800 };
    }
  ];

  console.log('Running database operations with 1.5 second timeout...');
  
  const results = await runTasksWithLogging(dbOperations, {
    concurrency: 2,
    timeout: 1500,
    retries: 0 // No retries for DB operations
  });

  console.log('\n📊 Database Results:');
  let totalRows = 0;
  
  results.forEach((result, index) => {
    const opName = ['SELECT', 'BULK_INSERT', 'UPDATE', 'COMPLEX_JOIN'][index];
    
    if (result.success) {
      const data = result.result as any;
      totalRows += data.rows;
      console.log(`✅ ${opName}: ${data.rows} rows (${result.duration?.toFixed(0)}ms)`);
    } else if (result.timedOut) {
      console.log(`⏰ ${opName}: Timed out after ${result.duration?.toFixed(0)}ms`);
    }
  });
  
  console.log(`\nTotal rows processed: ${totalRows}`);
}

async function microserviceCallsWithTimeout() {
  console.log('\n🔗 Microservice Calls with Circuit Breaker Pattern\n');
  
  const services = [
    { name: 'user-service', delay: 300 },
    { name: 'payment-service', delay: 2000 }, // Will timeout
    { name: 'inventory-service', delay: 150 },
    { name: 'notification-service', delay: 800 },
    { name: 'analytics-service', delay: 1600 } // Will timeout
  ];

  const serviceTasks = services.map(service => async () => {
    await delay(service.delay);
    return {
      service: service.name,
      status: 'healthy',
      responseTime: service.delay,
      version: '1.0.0'
    };
  });

  const results = await runTasks(serviceTasks, {
    concurrency: 5, // Call all services concurrently
    timeout: 1000, // 1 second circuit breaker
    retries: 2,
    retryDelay: 200,
    exponentialBackoff: true
  });

  console.log('🔄 Service Health Check Results:');
  const healthyServices = results.filter(r => r.success).length;
  const timeoutServices = results.filter(r => r.timedOut).length;
  
  results.forEach((result, index) => {
    const service = services[index];
    if (result.success) {
      console.log(`✅ ${service.name}: Healthy (${result.duration?.toFixed(0)}ms)`);
    } else if (result.timedOut) {
      console.log(`🚨 ${service.name}: Circuit breaker triggered (timeout)`);
    }
  });
  
  console.log(`\n📊 Service Status: ${healthyServices}/${services.length} healthy`);
  console.log(`Circuit breaker activated for ${timeoutServices} services`);
}

async function adaptiveTimeoutExample() {
  console.log('\n⚡ Adaptive Timeout Based on Task Type\n');
  
  const tasks = [
    // Quick operations - short timeout
    { name: 'cache-lookup', fn: async () => { await delay(100); return 'cache hit'; }, timeout: 300 },
    { name: 'memory-operation', fn: async () => { await delay(50); return 'data processed'; }, timeout: 200 },
    
    // Medium operations - medium timeout  
    { name: 'database-query', fn: async () => { await delay(800); return 'query result'; }, timeout: 1500 },
    { name: 'api-call', fn: async () => { await delay(1200); return 'api response'; }, timeout: 2000 },
    
    // Heavy operations - long timeout
    { name: 'file-processing', fn: async () => { await delay(3000); return 'file processed'; }, timeout: 5000 },
    { name: 'ml-inference', fn: async () => { await delay(2500); return 'prediction result'; }, timeout: 4000 }
  ];

  console.log('Running tasks with adaptive timeouts...');
  
  for (const task of tasks) {
    const results = await runTasks([task.fn], {
      concurrency: 1,
      timeout: task.timeout,
      retries: 1
    });
    
    const result = results[0];
    if (result?.success) {
      console.log(`✅ ${task.name}: Success (${result.duration?.toFixed(0)}ms / ${task.timeout}ms limit)`);
    } else if (result?.timedOut) {
      console.log(`⏰ ${task.name}: Timeout (${result.duration?.toFixed(0)}ms / ${task.timeout}ms limit)`);
    }
  }
}

async function main() {
  console.log('🚀 Phase 3 Demo: Advanced Timeout Support Examples\n');
  console.log('=' .repeat(60) + '\n');
  
  try {
    await webScrapingWithTimeout();
    await emailSendingWithTimeout();
    await databaseOperationsWithTimeout();
    await microserviceCallsWithTimeout();
    await adaptiveTimeoutExample();
    
    console.log('\n✅ All timeout examples completed!');
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   • Task timeout with AbortController');
    console.log('   • Precise duration tracking');
    console.log('   • Timeout + retry combinations');
    console.log('   • Circuit breaker patterns for microservices');
    console.log('   • Adaptive timeout strategies');
    console.log('   • Production-ready timeout handling');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

main().catch(console.error);