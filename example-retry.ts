import { runTasks, runTasksWithLogging } from './src/index.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateApiCall(id: number, failureRate = 0.3): Promise<{ id: number; data: string; timestamp: string }> {
  await delay(100 + Math.random() * 200);
  
  if (Math.random() < failureRate) {
    throw new Error(`API ${id} temporarily unavailable`);
  }
  
  return {
    id,
    data: `Data from API endpoint ${id}`,
    timestamp: new Date().toISOString()
  };
}

async function webScrapingExample() {
  console.log('🕷️  Web Scraping with Retry Logic\n');
  
  const urls = [
    'https://api.example1.com/data',
    'https://api.example2.com/data', 
    'https://api.example3.com/data',
    'https://api.example4.com/data',
    'https://api.example5.com/data',
  ];

  const scrapeTasks = urls.map((url, index) => async () => {
    return await simulateApiCall(index + 1, 0.4); // 40% failure rate
  });

  console.log('Scraping with retries and exponential backoff...');
  
  const results = await runTasksWithLogging(scrapeTasks, {
    concurrency: 3,
    retries: 3,
    retryDelay: 500,
    exponentialBackoff: true,
    maxRetryDelay: 5000
  });

  console.log('\n📊 Scraping Results:');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ ${urls[index]}: Success (${result.attempts} attempts)`);
    } else {
      console.log(`❌ ${urls[index]}: Failed after ${result.attempts} attempts`);
      if (result.retryHistory) {
        console.log(`   Retry delays: ${result.retryHistory.map(h => h.delay + 'ms').join(', ')}`);
      }
    }
  });
}

async function bulkEmailExample() {
  console.log('\n📧 Bulk Email Sending with Smart Retries\n');
  
  const emails = [
    { to: 'user1@example.com', subject: 'Welcome!' },
    { to: 'user2@example.com', subject: 'Newsletter' },
    { to: 'user3@example.com', subject: 'Updates' },
    { to: 'user4@example.com', subject: 'Promotion' },
    { to: 'user5@example.com', subject: 'Survey' }
  ];

  const emailTasks = emails.map(email => async () => {
    await delay(50 + Math.random() * 100);
    
    // Simulate different failure scenarios
    const rand = Math.random();
    if (rand < 0.2) {
      throw new Error('SMTP server timeout');
    } else if (rand < 0.3) {
      throw new Error('Rate limit exceeded');
    }
    
    return {
      email: email.to,
      status: 'sent',
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  });

  const results = await runTasks(emailTasks, {
    concurrency: 2, // Conservative for email sending
    retries: 4,
    retryDelay: 2000, // 2 second base delay
    exponentialBackoff: true,
    maxRetryDelay: 30000 // Cap at 30 seconds
  });

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalRetries = results.reduce((sum, r) => sum + (r.retryHistory?.length || 0), 0);

  console.log(`📈 Email Campaign Results:`);
  console.log(`   Sent: ${successful}/${emails.length} emails`);
  console.log(`   Failed: ${failed} emails`);
  console.log(`   Total retries: ${totalRetries}`);
  console.log(`   Success rate: ${((successful / emails.length) * 100).toFixed(1)}%`);
}

async function databaseBatchExample() {
  console.log('\n🗄️  Database Batch Operations with Retry\n');
  
  const records = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Record ${i + 1}`,
    value: Math.floor(Math.random() * 1000)
  }));

  const dbTasks = records.map(record => async () => {
    await delay(20 + Math.random() * 80);
    
    // Simulate database connection issues
    if (Math.random() < 0.25) {
      throw new Error('Database connection timeout');
    }
    
    return {
      id: record.id,
      status: 'inserted',
      insertedAt: new Date().toISOString()
    };
  });

  console.log('Processing database inserts with retry logic...');
  
  const results = await runTasksWithLogging(dbTasks, {
    concurrency: 5, // Higher concurrency for DB operations
    retries: 2,
    retryDelay: 1000,
    exponentialBackoff: false // Linear backoff for DB operations
  });

  const inserted = results.filter(r => r.success).length;
  console.log(`\n📊 Database Results: ${inserted}/${records.length} records inserted successfully`);
}

async function main() {
  console.log('🚀 Phase 2 Demo: Advanced Retry Logic Examples\n');
  console.log('=' .repeat(60) + '\n');
  
  try {
    await webScrapingExample();
    await bulkEmailExample();
    await databaseBatchExample();
    
    console.log('\n✅ All retry examples completed!');
    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   • Intelligent retry with exponential backoff');
    console.log('   • Configurable retry attempts and delays');
    console.log('   • Max delay caps for reasonable wait times');
    console.log('   • Detailed retry history tracking');
    console.log('   • Silent vs. verbose logging modes');
    console.log('   • Production-ready error handling');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

main().catch(console.error);