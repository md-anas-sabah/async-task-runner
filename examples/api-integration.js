/**
 * API Integration Example
 * 
 * This example demonstrates how to use async-task-runner for batch API processing.
 * It shows how to handle API rate limits, retries, and error handling when 
 * processing multiple API endpoints concurrently.
 */

import { runTasksWithSummary, formatSummary } from '../dist/index.js';

// Simulate API calls with realistic behavior
const mockApiCall = (endpoint, delay = 1000, failureRate = 0.1) => async () => {
  console.log(`🌐 Calling API: ${endpoint}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500));
  
  // Simulate failures
  if (Math.random() < failureRate) {
    const errors = [
      'Rate limit exceeded (429)',
      'Server error (500)', 
      'Network timeout',
      'Service unavailable (503)',
      'Authentication failed (401)'
    ];
    throw new Error(errors[Math.floor(Math.random() * errors.length)]);
  }
  
  // Simulate successful response
  const responses = {
    '/users': () => ({
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        active: Math.random() > 0.2
      }))
    }),
    '/orders': () => ({
      orders: Array.from({ length: 5 }, (_, i) => ({
        id: `order-${i + 1}`,
        total: (Math.random() * 500 + 50).toFixed(2),
        status: ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)]
      }))
    }),
    '/products': () => ({
      products: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: (Math.random() * 200 + 10).toFixed(2),
        inStock: Math.random() > 0.3
      }))
    }),
    '/analytics': () => ({
      metrics: {
        pageViews: Math.floor(Math.random() * 10000 + 1000),
        uniqueVisitors: Math.floor(Math.random() * 1000 + 100),
        conversionRate: (Math.random() * 10 + 1).toFixed(2)
      }
    })
  };
  
  const responseGenerator = responses[endpoint] || (() => ({ data: 'Generic response' }));
  return {
    endpoint,
    timestamp: new Date().toISOString(),
    data: responseGenerator()
  };
};

// User enrichment pipeline
const enrichUser = (userId) => async () => {
  console.log(`👤 Enriching user ${userId}`);
  
  // Simulate multiple API calls for user enrichment
  const delay = Math.random() * 1000 + 200;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simulate occasional failures
  if (Math.random() < 0.15) {
    throw new Error(`Failed to fetch data for user ${userId}`);
  }
  
  return {
    userId,
    profile: {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    preferences: {
      theme: ['light', 'dark'][Math.floor(Math.random() * 2)],
      notifications: Math.random() > 0.3,
      language: ['en', 'es', 'fr'][Math.floor(Math.random() * 3)]
    },
    analytics: {
      loginCount: Math.floor(Math.random() * 100 + 1),
      lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpent: (Math.random() * 1000).toFixed(2)
    }
  };
};

// Data synchronization task
const syncDataSource = (source) => async () => {
  console.log(`🔄 Syncing data from ${source.name}`);
  
  const delay = source.complexity * 1000 + Math.random() * 500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Higher failure rate for complex sources
  if (Math.random() < source.complexity * 0.1) {
    throw new Error(`Failed to sync ${source.name}: ${source.errorType}`);
  }
  
  const recordCount = Math.floor(Math.random() * 1000 + 100);
  
  return {
    source: source.name,
    recordsSynced: recordCount,
    duration: delay,
    lastSync: new Date().toISOString(),
    status: 'completed'
  };
};

async function apiIntegrationDemo() {
  console.log('🚀 API Integration Demo with async-task-runner');
  console.log('='.repeat(50));
  
  console.log('📋 Demo 1: Basic API Endpoints Processing');
  console.log('-'.repeat(30));
  
  // Basic API endpoints
  const apiEndpoints = [
    '/users',
    '/orders', 
    '/products',
    '/analytics',
    '/settings',
    '/notifications',
    '/reports',
    '/dashboard'
  ];
  
  const apiTasks = apiEndpoints.map(endpoint => 
    mockApiCall(endpoint, 800, 0.2) // 800ms base delay, 20% failure rate
  );
  
  console.log(`🌐 Processing ${apiEndpoints.length} API endpoints...`);
  console.log('⚙️  Configuration:');
  console.log('   • Concurrency: 3 (respect API rate limits)');
  console.log('   • Retries: 2 (handle temporary failures)');
  console.log('   • Timeout: 5 seconds per request');
  console.log('   • Exponential backoff for retries');
  console.log('');
  
  const apiSummary = await runTasksWithSummary(apiTasks, {
    concurrency: 3,           // Don't overwhelm the API
    retries: 2,              // Retry failed requests
    timeout: 5000,           // 5 second timeout
    retryDelay: 1000,        // 1 second base delay
    exponentialBackoff: true, // Increase delay for retries
    maxRetryDelay: 5000      // Cap retry delay at 5 seconds
  });
  
  console.log('📊 API Processing Results:');
  const successfulApis = apiSummary.results.filter(r => r.success);
  console.log(`✅ Successfully processed ${successfulApis.length} endpoints:`);
  
  successfulApis.forEach((result, index) => {
    const response = result.result;
    console.log(`   ${index + 1}. ${response.endpoint} (${result.duration.toFixed(0)}ms)`);
  });
  
  const failedApis = apiSummary.results.filter(r => !r.success);
  if (failedApis.length > 0) {
    console.log(`\\n❌ Failed endpoints: ${failedApis.length}`);
    failedApis.forEach((result, index) => {
      console.log(`   ${index + 1}. ${apiEndpoints[result.taskIndex]}: ${result.error}`);
    });
  }
  console.log('');
  
  console.log('📋 Demo 2: User Data Enrichment Pipeline');
  console.log('-'.repeat(30));
  
  // User enrichment pipeline
  const userIds = Array.from({ length: 15 }, (_, i) => i + 1);
  const enrichmentTasks = userIds.map(enrichUser);
  
  console.log(`👥 Enriching data for ${userIds.length} users...`);
  console.log('⚙️  Configuration:');
  console.log('   • Concurrency: 5 (parallel user processing)');
  console.log('   • Retries: 3 (important user data)');
  console.log('   • Timeout: 3 seconds per user');
  console.log('');
  
  const enrichmentSummary = await runTasksWithSummary(enrichmentTasks, {
    concurrency: 5,       // Process 5 users at once
    retries: 3,          // Retry failed enrichments
    timeout: 3000,       // 3 second timeout per user
    retryDelay: 500,     // 500ms base delay
    exponentialBackoff: true
  });
  
  console.log('📊 User Enrichment Results:');
  const enrichedUsers = enrichmentSummary.results.filter(r => r.success);
  console.log(`✅ Successfully enriched ${enrichedUsers.length} users:`);
  
  // Show sample enriched data
  if (enrichedUsers.length > 0) {
    const sample = enrichedUsers[0].result;
    console.log(`\\n   Sample enriched user data:`);
    console.log(`   • User ID: ${sample.userId}`);
    console.log(`   • Name: ${sample.profile.name}`);
    console.log(`   • Theme: ${sample.preferences.theme}`);
    console.log(`   • Login count: ${sample.analytics.loginCount}`);
    console.log(`   • Total spent: $${sample.analytics.totalSpent}`);
  }
  console.log('');
  
  console.log('📋 Demo 3: Data Source Synchronization');
  console.log('-'.repeat(30));
  
  // Data synchronization sources
  const dataSources = [
    { name: 'CRM Database', complexity: 2, errorType: 'Connection timeout' },
    { name: 'Payment Gateway', complexity: 1, errorType: 'Authentication failed' },
    { name: 'Analytics Service', complexity: 3, errorType: 'Rate limit exceeded' },
    { name: 'Email Platform', complexity: 1, errorType: 'API key invalid' },
    { name: 'Social Media APIs', complexity: 2, errorType: 'Service unavailable' },
    { name: 'Customer Support', complexity: 1, errorType: 'Quota exceeded' },
    { name: 'Inventory System', complexity: 3, errorType: 'Database locked' },
    { name: 'Shipping Provider', complexity: 2, errorType: 'Network error' }
  ];
  
  const syncTasks = dataSources.map(syncDataSource);
  
  console.log(`🔄 Synchronizing ${dataSources.length} data sources...`);
  console.log('⚙️  Configuration:');
  console.log('   • Concurrency: 4 (parallel sync operations)');
  console.log('   • Retries: 2 (handle network issues)');
  console.log('   • Timeout: 8 seconds (complex operations)');
  console.log('');
  
  const syncSummary = await runTasksWithSummary(syncTasks, {
    concurrency: 4,       // Sync 4 sources at once
    retries: 2,          // Retry failed syncs
    timeout: 8000,       // 8 second timeout
    retryDelay: 2000,    // 2 second delay between retries
    exponentialBackoff: true
  });
  
  console.log('📊 Data Synchronization Results:');
  const successfulSyncs = syncSummary.results.filter(r => r.success);
  console.log(`✅ Successfully synchronized ${successfulSyncs.length} sources:`);
  
  let totalRecords = 0;
  successfulSyncs.forEach((result, index) => {
    const sync = result.result;
    totalRecords += sync.recordsSynced;
    console.log(`   ${index + 1}. ${sync.source}: ${sync.recordsSynced} records (${result.duration.toFixed(0)}ms)`);
  });
  
  console.log(`\\n📈 Total records synchronized: ${totalRecords.toLocaleString()}`);
  console.log('');
  
  // Combined summary
  console.log('📈 Overall Performance Summary:');
  console.log('='.repeat(30));
  
  const totalTasks = apiSummary.results.length + enrichmentSummary.results.length + syncSummary.results.length;
  const totalSuccessful = successfulApis.length + enrichedUsers.length + successfulSyncs.length;
  const overallSuccessRate = ((totalSuccessful / totalTasks) * 100).toFixed(1);
  
  console.log(`🎯 Overall Results:`);
  console.log(`   • Total tasks: ${totalTasks}`);
  console.log(`   • Successful: ${totalSuccessful}`);
  console.log(`   • Success rate: ${overallSuccessRate}%`);
  console.log(`   • API endpoints: ${successfulApis.length}/${apiSummary.results.length}`);
  console.log(`   • User enrichments: ${enrichedUsers.length}/${enrichmentSummary.results.length}`);
  console.log(`   • Data syncs: ${successfulSyncs.length}/${syncSummary.results.length}`);
  
  console.log('\\n🎯 Key Benefits Demonstrated:');
  console.log('  • Concurrent API processing improves throughput');
  console.log('  • Intelligent retry handling for network issues');
  console.log('  • Timeout protection prevents hanging requests');
  console.log('  • Rate limiting respects API constraints');
  console.log('  • Comprehensive error tracking and reporting');
  console.log('  • Scalable architecture for batch operations');
  
  return { apiSummary, enrichmentSummary, syncSummary };
}

// Real-world API integration patterns
async function realWorldAPIPatterns() {
  console.log('\\n🌐 Real-World API Integration Patterns');
  console.log('='.repeat(50));
  
  const examples = \`
// E-commerce Product Sync
const syncProducts = (productIds) => {
  const tasks = productIds.map(id => async () => {
    const [product, inventory, pricing] = await Promise.all([
      fetch(\`/api/products/\${id}\`).then(r => r.json()),
      fetch(\`/api/inventory/\${id}\`).then(r => r.json()),
      fetch(\`/api/pricing/\${id}\`).then(r => r.json())
    ]);
    
    return { id, product, inventory, pricing };
  });
  
  return runTasksWithSummary(tasks, {
    concurrency: 5,
    retries: 3,
    timeout: 10000,
    exponentialBackoff: true
  });
};

// Social Media Content Aggregation
const aggregateContent = (platforms) => {
  const tasks = platforms.map(platform => async () => {
    const response = await fetch(\`/api/\${platform}/posts\`, {
      headers: { Authorization: \`Bearer \${getToken(platform)}\` }
    });
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    
    return response.json();
  });
  
  return runTasksWithLogging(tasks, {
    concurrency: 2,        // Respect rate limits
    retries: 5,           // Social APIs can be flaky
    retryDelay: 5000,     // Longer delays for rate limits
    maxRetryDelay: 60000, // Up to 1 minute
    timeout: 15000
  });
};

// Webhook Processing
const processWebhooks = (webhookEvents) => {
  const tasks = webhookEvents.map(event => async () => {
    // Validate webhook signature
    if (!validateSignature(event)) {
      throw new Error('Invalid webhook signature');
    }
    
    // Process based on event type
    switch (event.type) {
      case 'payment.completed':
        return processPayment(event.data);
      case 'user.created':
        return processNewUser(event.data);
      case 'order.updated':
        return processOrderUpdate(event.data);
      default:
        return processGenericEvent(event);
    }
  });
  
  return runTasks(tasks, {
    concurrency: 10,       // High concurrency for webhooks
    retries: 2,           // Limited retries for real-time events
    timeout: 5000         // Quick timeout for responsiveness
  });
};

// Data Migration Pipeline
const migrateData = (batchSize = 100) => {
  const tasks = [];
  
  for (let offset = 0; offset < totalRecords; offset += batchSize) {
    tasks.push(async () => {
      const records = await fetchRecords(offset, batchSize);
      const transformed = transformRecords(records);
      const result = await insertRecords(transformed);
      
      return {
        batch: offset / batchSize + 1,
        processed: records.length,
        inserted: result.insertedCount
      };
    });
  }
  
  return runTasksWithSummary(tasks, {
    concurrency: 3,        // Conservative for DB operations
    retries: 3,           // Important for data integrity
    timeout: 30000,       // Longer timeout for batch operations
    retryDelay: 2000
  });
};
  \`;
  
  console.log(examples);
}

// Run the demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  apiIntegrationDemo()
    .then(() => realWorldAPIPatterns())
    .catch(console.error);
}