import { runTasksWithSummary, runTasksWithSummaryAndLogging, formatSummary } from './src/index.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function basicSummaryExample() {
  console.log('📊 Basic Summary Example\n');
  
  const webScrapingTasks = [
    async () => {
      await delay(300);
      return { url: 'https://api.example1.com', data: 'Page content 1' };
    },
    async () => {
      await delay(150);
      throw new Error('HTTP 404: Page not found');
    },
    async () => {
      await delay(500);
      return { url: 'https://api.example2.com', data: 'Page content 2' };
    },
    async () => {
      await delay(200);
      throw new Error('HTTP 500: Server error');
    }
  ];

  const summary = await runTasksWithSummary(webScrapingTasks, {
    concurrency: 2,
    retries: 1,
    retryDelay: 500
  });

  console.log(formatSummary(summary));
  
  console.log('\n🔍 Programmatic Access:');
  console.log(`Success rate: ${(summary.success / (summary.success + summary.failed) * 100).toFixed(1)}%`);
  console.log(`Average response time: ${summary.averageDuration.toFixed(2)}ms`);
  console.log(`Most common error: ${summary.errors[0]?.message || 'None'}`);
  console.log('');
}

async function bulkEmailSummaryExample() {
  console.log('📧 Bulk Email Processing Summary\n');
  
  const emailBatch = Array.from({ length: 50 }, (_, i) => async () => {
    // Simulate different email processing scenarios
    await delay(50 + Math.random() * 200);
    
    const rand = Math.random();
    if (rand < 0.05) {
      throw new Error('SMTP authentication failed');
    } else if (rand < 0.08) {
      throw new Error('Recipient address invalid');
    } else if (rand < 0.12) {
      throw new Error('Message size too large');
    }
    
    return {
      emailId: `email_${i + 1}`,
      recipient: `user${i + 1}@example.com`,
      status: 'sent',
      messageId: `msg_${Date.now()}_${i}`
    };
  });

  const summary = await runTasksWithSummary(emailBatch, {
    concurrency: 8,
    retries: 2,
    retryDelay: 1000,
    timeout: 2000
  });

  console.log(formatSummary(summary));
  
  // Email-specific metrics
  console.log('\n📈 Email Campaign Analysis:');
  console.log(`Delivery rate: ${(summary.success / emailBatch.length * 100).toFixed(1)}%`);
  console.log(`Emails per second: ${(summary.success / (summary.executionTime / 1000)).toFixed(2)}`);
  console.log(`Bounce rate: ${((summary.failed - summary.timedOut) / emailBatch.length * 100).toFixed(1)}%`);
  console.log('');
}

async function databaseMigrationSummary() {
  console.log('🗄️  Database Migration Summary\n');
  
  const migrationTasks = [
    // Table creation tasks
    async () => { await delay(500); return { table: 'users', action: 'created', rows: 0 }; },
    async () => { await delay(300); return { table: 'products', action: 'created', rows: 0 }; },
    async () => { await delay(200); return { table: 'orders', action: 'created', rows: 0 }; },
    
    // Data import tasks
    async () => { await delay(2000); return { table: 'users', action: 'populated', rows: 10000 }; },
    async () => { await delay(3000); return { table: 'products', action: 'populated', rows: 5000 }; },
    async () => { 
      await delay(4000); // This will timeout
      return { table: 'orders', action: 'populated', rows: 25000 }; 
    },
    
    // Index creation
    async () => { await delay(800); return { table: 'users', action: 'indexed', indexes: 3 }; },
    async () => { 
      await delay(600);
      throw new Error('Unique constraint violation on products.sku');
    },
    async () => { await delay(400); return { table: 'orders', action: 'indexed', indexes: 2 }; }
  ];

  const summary = await runTasksWithSummaryAndLogging(migrationTasks, {
    concurrency: 3,
    timeout: 3500, // 3.5 second timeout
    retries: 1,
    retryDelay: 2000
  });

  console.log('\n' + formatSummary(summary));
  
  // Migration-specific analysis
  console.log('\n🔍 Migration Analysis:');
  const successful = summary.results.filter(r => r.success);
  const totalRows = successful.reduce((sum, r) => sum + (r.result?.rows || 0), 0);
  
  console.log(`Tables processed: ${successful.length}/${migrationTasks.length}`);
  console.log(`Total rows migrated: ${totalRows.toLocaleString()}`);
  console.log(`Migration throughput: ${(totalRows / (summary.executionTime / 1000)).toFixed(0)} rows/second`);
  console.log('');
}

async function microserviceHealthCheckSummary() {
  console.log('🔗 Microservice Health Check Summary\n');
  
  const services = [
    { name: 'auth-service', baseDelay: 100, failRate: 0.05 },
    { name: 'user-service', baseDelay: 150, failRate: 0.1 },
    { name: 'payment-service', baseDelay: 300, failRate: 0.15 },
    { name: 'inventory-service', baseDelay: 200, failRate: 0.08 },
    { name: 'notification-service', baseDelay: 250, failRate: 0.12 },
    { name: 'analytics-service', baseDelay: 400, failRate: 0.05 },
    { name: 'recommendation-service', baseDelay: 500, failRate: 0.2 },
    { name: 'search-service', baseDelay: 180, failRate: 0.1 }
  ];

  const healthCheckTasks = services.map(service => async () => {
    const jitter = Math.random() * 100; // Add some randomness
    await delay(service.baseDelay + jitter);
    
    if (Math.random() < service.failRate) {
      const errors = [
        'Connection refused',
        'Service unavailable',
        'Database connection timeout',
        'Rate limit exceeded'
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }
    
    return {
      service: service.name,
      status: 'healthy',
      responseTime: service.baseDelay + jitter,
      version: '1.0.0',
      uptime: Math.floor(Math.random() * 1000000)
    };
  });

  const summary = await runTasksWithSummary(healthCheckTasks, {
    concurrency: 4,
    timeout: 1000,
    retries: 2,
    retryDelay: 300,
    exponentialBackoff: true
  });

  console.log(formatSummary(summary));
  
  // Service health analysis
  console.log('\n🏥 Service Health Analysis:');
  const healthyServices = summary.results.filter(r => r.success);
  const healthyPercentage = (healthyServices.length / services.length * 100).toFixed(1);
  
  console.log(`System health: ${healthyPercentage}% (${healthyServices.length}/${services.length} services)`);
  console.log(`Average response time: ${summary.averageDuration.toFixed(2)}ms`);
  
  if (summary.errors.length > 0) {
    console.log('\n🚨 Critical Issues:');
    summary.errors.forEach(error => {
      const affectedServices = error.taskIndexes.map(i => services[i]?.name).join(', ');
      console.log(`   ${error.message}: ${affectedServices}`);
    });
  }
  console.log('');
}

async function performanceComparisonExample() {
  console.log('⚡ Performance Comparison Example\n');
  
  // Simulate different processing strategies
  const strategies = [
    { name: 'Sequential Processing', concurrency: 1 },
    { name: 'Moderate Concurrency', concurrency: 3 },
    { name: 'High Concurrency', concurrency: 8 }
  ];

  const createTasks = () => Array.from({ length: 20 }, (_, i) => async () => {
    await delay(100 + Math.random() * 200);
    return `Task ${i + 1} completed`;
  });

  console.log('Testing different concurrency strategies...\n');
  
  for (const strategy of strategies) {
    const tasks = createTasks();
    const summary = await runTasksWithSummary(tasks, {
      concurrency: strategy.concurrency
    });
    
    console.log(`📊 ${strategy.name} (concurrency: ${strategy.concurrency})`);
    console.log(`   Execution time: ${summary.executionTime}ms`);
    console.log(`   Throughput: ${(tasks.length / (summary.executionTime / 1000)).toFixed(2)} tasks/second`);
    console.log(`   Average task duration: ${summary.averageDuration.toFixed(2)}ms`);
    console.log('');
  }
}

async function main() {
  console.log('🚀 Phase 4 Demo: Advanced Task Result Reporting\n');
  console.log('=' .repeat(70) + '\n');
  
  try {
    await basicSummaryExample();
    await bulkEmailSummaryExample();
    await databaseMigrationSummary();
    await microserviceHealthCheckSummary();
    await performanceComparisonExample();
    
    console.log('✅ All summary examples completed!');
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   • Comprehensive execution analytics');
    console.log('   • Intelligent error categorization');
    console.log('   • Performance metrics and benchmarking');
    console.log('   • Human-readable formatted reports');
    console.log('   • Real-world scenario analysis');
    console.log('   • Programmatic access to all metrics');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

main().catch(console.error);