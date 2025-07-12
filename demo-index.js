#!/usr/bin/env node

/**
 * 🚀 Async Task Runner - Complete Demo
 * 
 * This file demonstrates ALL features and use cases of the async-task-runner package.
 * Run with: node demo-index.js
 */

import {
  // Phase 1-4: Core functionality
  runTasks,
  runTasksWithLogging,
  runTasksWithSummary,
  formatSummary,
  
  // Phase 8: Advanced features
  runAdvancedTasks,
  runPriorityTasks,
  runTasksInBatches,
  AdvancedTaskRunner,
  EventDrivenTaskRunner,
  TaskBatch,
  PriorityTaskQueue
} from './dist/index.js';

// 🎨 Console styling
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, title, message = '') {
  console.log(`${color}${colors.bright}${title}${colors.reset}${color}${message}${colors.reset}`);
}

function separator(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`${colors.cyan}${colors.bright}🚀 ${title.toUpperCase()}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// 📝 Sample tasks for demonstrations
const sampleTasks = {
  // Simple HTTP requests
  httpTasks: [
    () => fetch('https://httpbin.org/delay/1').then(r => r.json()),
    () => fetch('https://httpbin.org/uuid').then(r => r.json()),
    () => fetch('https://httpbin.org/ip').then(r => r.json())
  ],
  
  // File processing simulation
  fileTasks: [
    () => new Promise(resolve => setTimeout(() => resolve('📄 processed file1.txt'), Math.random() * 1000)),
    () => new Promise(resolve => setTimeout(() => resolve('📄 processed file2.txt'), Math.random() * 1000)),
    () => new Promise(resolve => setTimeout(() => resolve('📄 processed file3.txt'), Math.random() * 1000)),
    () => new Promise(resolve => setTimeout(() => resolve('📄 processed file4.txt'), Math.random() * 1000))
  ],
  
  // Mixed success/failure tasks
  mixedTasks: [
    () => Promise.resolve('✅ Success task 1'),
    () => Promise.reject(new Error('❌ Network timeout')),
    () => Promise.resolve('✅ Success task 2'),
    () => Promise.reject(new Error('❌ Database connection failed')),
    () => Promise.resolve('✅ Success task 3')
  ],
  
  // Slow tasks for timeout testing
  slowTasks: [
    () => new Promise(resolve => setTimeout(() => resolve('🐌 Slow task 1'), 500)),
    () => new Promise(resolve => setTimeout(() => resolve('🐌 Slow task 2'), 2000)), // Will timeout
    () => new Promise(resolve => setTimeout(() => resolve('🐌 Slow task 3'), 300))
  ],
  
  // Retry testing tasks
  retryTasks: (() => {
    let attempt1 = 0, attempt2 = 0;
    return [
      () => {
        attempt1++;
        if (attempt1 < 3) throw new Error('🔄 Retry needed');
        return Promise.resolve('✅ Success after retries');
      },
      () => {
        attempt2++;
        if (attempt2 < 2) throw new Error('🔄 Another retry needed');
        return Promise.resolve('✅ Another success after retries');
      }
    ];
  })()
};

// 🎯 Demo Functions

async function demo1_BasicUsage() {
  separator('Phase 1: Basic Usage');
  
  log(colors.blue, '📋 Running basic HTTP requests with concurrency limit...\n');
  
  const results = await runTasks(sampleTasks.httpTasks, {
    concurrency: 2
  });
  
  results.forEach((result, i) => {
    if (result.success) {
      log(colors.green, `✅ Task ${i + 1}: `, `Completed in ${result.duration}ms`);
    } else {
      log(colors.red, `❌ Task ${i + 1}: `, result.error?.message || 'Failed');
    }
  });
  
  log(colors.yellow, '\n📊 Summary: ', `${results.filter(r => r.success).length}/${results.length} tasks succeeded`);
}

async function demo2_RetryMechanism() {
  separator('Phase 2: Retry Mechanism');
  
  log(colors.blue, '🔄 Running tasks with retry and exponential backoff...\n');
  
  const startTime = Date.now();
  const results = await runTasksWithLogging(sampleTasks.retryTasks, {
    concurrency: 1,
    retries: 3,
    retryDelay: 200,
    exponentialBackoff: true,
    maxRetryDelay: 2000
  });
  const endTime = Date.now();
  
  results.forEach((result, i) => {
    log(colors.green, `✅ Task ${i + 1}: `, `${result.attempts} attempts, ${result.duration}ms`);
    if (result.retryHistory && result.retryHistory.length > 0) {
      result.retryHistory.forEach((retry, j) => {
        log(colors.yellow, `   🔄 Retry ${j + 1}: `, `${retry.delay}ms delay, ${retry.duration}ms duration`);
      });
    }
  });
  
  log(colors.cyan, '\n⏱️ Total execution time: ', `${endTime - startTime}ms`);
}

async function demo3_TimeoutSupport() {
  separator('Phase 3: Timeout Support');
  
  log(colors.blue, '⏰ Running tasks with 1-second timeout...\n');
  
  const results = await runTasks(sampleTasks.slowTasks, {
    concurrency: 3,
    timeout: 1000,
    retries: 1
  });
  
  results.forEach((result, i) => {
    if (result.success) {
      log(colors.green, `✅ Task ${i + 1}: `, `Completed in ${result.duration}ms`);
    } else if (result.timedOut) {
      log(colors.red, `⏰ Task ${i + 1}: `, `Timed out after ${result.duration}ms`);
    } else {
      log(colors.red, `❌ Task ${i + 1}: `, result.error?.message || 'Failed');
    }
  });
}

async function demo4_TaskReporting() {
  separator('Phase 4: Task Result Reporting');
  
  log(colors.blue, '📊 Running mixed tasks with comprehensive reporting...\n');
  
  const summary = await runTasksWithSummary(sampleTasks.mixedTasks, {
    concurrency: 2,
    retries: 2,
    retryDelay: 100
  });
  
  console.log(formatSummary(summary));
  
  log(colors.cyan, '\n🔍 Error Analysis:');
  summary.errors.forEach(error => {
    log(colors.yellow, `   • ${error.message}: `, `${error.count} occurrences in tasks [${error.taskIndexes.join(', ')}]`);
  });
}

async function demo5_CLIDemo() {
  separator('Phase 6: CLI Support Demo');
  
  log(colors.blue, '💻 CLI capabilities (run these commands manually):\n');
  
  console.log(`${colors.green}# Generate example configuration:`);
  console.log(`${colors.cyan}npx async-task-runner example --type http --output my-tasks.json${colors.reset}\n`);
  
  console.log(`${colors.green}# Run tasks from configuration file:`);
  console.log(`${colors.cyan}npx async-task-runner run my-tasks.json --concurrency 3 --retries 2${colors.reset}\n`);
  
  console.log(`${colors.green}# Validate configuration:`);
  console.log(`${colors.cyan}npx async-task-runner validate my-tasks.json${colors.reset}\n`);
  
  console.log(`${colors.green}# Short alias:`);
  console.log(`${colors.cyan}atr run my-tasks.json -c 5 -r 3 -t 5000${colors.reset}\n`);
}

async function demo6_TaskBatching() {
  separator('Phase 8a: Task Batching');
  
  log(colors.blue, '📦 Processing files in batches of 2 with delays...\n');
  
  const startTime = Date.now();
  const results = await runTasksInBatches(sampleTasks.fileTasks, 2, {
    batchDelay: 300,
    concurrency: 1
  });
  const endTime = Date.now();
  
  results.forEach((result, i) => {
    if (result.success) {
      log(colors.green, `✅ Batch item ${i + 1}: `, result.value);
    }
  });
  
  log(colors.cyan, '\n⏱️ Batched execution time: ', `${endTime - startTime}ms`);
  log(colors.yellow, '💡 Notice: ', 'Batches were processed sequentially with delays');
}

async function demo7_PriorityQueue() {
  separator('Phase 8b: Priority Queue');
  
  log(colors.blue, '🎯 Processing tasks by priority (High → Medium → Low)...\n');
  
  const executionOrder = [];
  const priorityTasks = [
    {
      task: () => {
        executionOrder.push('🔴 High Priority');
        return new Promise(resolve => setTimeout(() => resolve('🔴 High priority task completed'), 100));
      },
      priority: 10,
      name: 'Critical Database Backup'
    },
    {
      task: () => {
        executionOrder.push('🟡 Medium Priority');
        return new Promise(resolve => setTimeout(() => resolve('🟡 Medium priority task completed'), 100));
      },
      priority: 5,
      name: 'User Data Sync'
    },
    {
      task: () => {
        executionOrder.push('🟢 Low Priority');
        return new Promise(resolve => setTimeout(() => resolve('🟢 Low priority task completed'), 100));
      },
      priority: 1,
      name: 'Log Cleanup'
    },
    {
      task: () => {
        executionOrder.push('🔴 High Priority 2');
        return new Promise(resolve => setTimeout(() => resolve('🔴 Another high priority task'), 100));
      },
      priority: 9,
      name: 'Security Scan'
    }
  ];
  
  const results = await runPriorityTasks(priorityTasks, {
    concurrency: 1 // Sequential to see priority order
  });
  
  log(colors.green, '📋 Execution Order:');
  executionOrder.forEach((task, i) => {
    log(colors.cyan, `   ${i + 1}. `, task);
  });
  
  log(colors.green, '\n✅ Results:');
  results.forEach((result, i) => {
    log(colors.green, `   • Task ${i + 1}: `, result.value);
  });
}

async function demo8_EventSystem() {
  separator('Phase 8c: Event-Driven Task Runner');
  
  log(colors.blue, '🎪 Event-driven task execution with real-time monitoring...\n');
  
  const events = [];
  const eventHandlers = {
    onStart: (taskIndex, metadata) => {
      events.push(`🚀 Started task ${taskIndex} ${metadata?.name ? `(${metadata.name})` : ''}`);
      log(colors.cyan, '🚀 Event: ', `Started task ${taskIndex}`);
    },
    onSuccess: (taskIndex, result, duration, metadata) => {
      events.push(`✅ Completed task ${taskIndex} in ${duration}ms`);
      log(colors.green, '✅ Event: ', `Task ${taskIndex} completed in ${duration}ms`);
    },
    onProgress: (completed, total, running) => {
      events.push(`📊 Progress: ${completed}/${total} (${running} running)`);
      log(colors.yellow, '📊 Event: ', `Progress ${completed}/${total} (${running} running)`);
    },
    onComplete: (summary) => {
      events.push(`🎉 All tasks completed: ${summary.success}/${summary.total} succeeded`);
      log(colors.magenta, '🎉 Event: ', `All tasks completed: ${summary.success}/${summary.total} succeeded`);
    }
  };
  
  const runner = new EventDrivenTaskRunner({
    concurrency: 2,
    eventHandlers
  });
  
  // Add tasks with metadata
  runner.add(() => new Promise(resolve => setTimeout(() => resolve('📧 Email sent'), 300)), 
    { name: 'Send Email', priority: 1 });
  runner.add(() => new Promise(resolve => setTimeout(() => resolve('💾 Data saved'), 200)), 
    { name: 'Save Data', priority: 2 });
  runner.add(() => new Promise(resolve => setTimeout(() => resolve('🔔 Notification sent'), 400)), 
    { name: 'Send Notification', priority: 1 });
  
  await runner.run();
  
  log(colors.cyan, '\n📚 Event Log Summary:');
  events.forEach((event, i) => {
    console.log(`${colors.cyan}   ${i + 1}. ${event}${colors.reset}`);
  });
}

async function demo9_PauseResume() {
  separator('Phase 8d: Pause/Resume Functionality');
  
  log(colors.blue, '⏸️ Testing pause and resume capabilities...\n');
  
  const runner = new AdvancedTaskRunner({
    concurrency: 1,
    batchSize: 2,
    batchDelay: 500
  });
  
  // Add several tasks
  const taskNames = ['Task A', 'Task B', 'Task C', 'Task D', 'Task E'];
  taskNames.forEach((name, i) => {
    runner.add(
      () => new Promise(resolve => {
        log(colors.green, `🏃 Executing: `, name);
        setTimeout(() => resolve(`✅ ${name} completed`), 300);
      }),
      { name, id: `task-${i}` }
    );
  });
  
  // Set up pause/resume demonstration
  const runPromise = runner.run();
  
  // Pause after 1 second
  setTimeout(() => {
    log(colors.yellow, '⏸️ Pausing execution...', '');
    runner.pause();
    
    // Resume after 2 seconds
    setTimeout(() => {
      log(colors.green, '▶️ Resuming execution...', '');
      runner.resume();
    }, 2000);
  }, 1000);
  
  const results = await runPromise;
  
  log(colors.cyan, '\n📊 Final Results:');
  results.forEach((result, i) => {
    log(colors.green, `   ✅ ${taskNames[i]}: `, `${result.duration}ms`);
  });
}

async function demo10_UtilityClasses() {
  separator('Phase 8e: Utility Classes');
  
  log(colors.blue, '🛠️ Demonstrating utility classes...\n');
  
  // TaskBatch demonstration
  log(colors.cyan, '📦 TaskBatch utility:');
  const batch = new TaskBatch('email-batch');
  batch.add(() => Promise.resolve('📧 Welcome email'), { recipient: 'user1@example.com' });
  batch.add(() => Promise.resolve('📧 Newsletter'), { recipient: 'user2@example.com' });
  batch.add(() => Promise.resolve('📧 Promotion'), { recipient: 'user3@example.com' });
  
  log(colors.green, `   • Batch ID: `, batch.id);
  log(colors.green, `   • Batch size: `, `${batch.size()} tasks`);
  
  const batchTasks = batch.getTasks();
  batchTasks.forEach((task, i) => {
    log(colors.yellow, `   • Task ${i + 1}: `, task.metadata.recipient);
  });
  
  // PriorityTaskQueue demonstration
  log(colors.cyan, '\n🎯 PriorityTaskQueue utility:');
  const queue = new PriorityTaskQueue();
  
  queue.add(() => Promise.resolve('🔧 Maintenance'), 1, { type: 'maintenance' });
  queue.add(() => Promise.resolve('🚨 Alert'), 10, { type: 'critical' });
  queue.add(() => Promise.resolve('📊 Report'), 5, { type: 'reporting' });
  queue.add(() => Promise.resolve('🔔 Notification'), 3, { type: 'notification' });
  
  log(colors.green, `   • Queue size: `, `${queue.size()} tasks`);
  log(colors.green, `   • Available priorities: `, queue.getPriorities().join(', '));
  
  log(colors.yellow, '   • Processing order:');
  let position = 1;
  while (!queue.isEmpty()) {
    const task = queue.getNext();
    if (task) {
      log(colors.cyan, `     ${position}. Priority ${task.priority}: `, task.type);
      position++;
    }
  }
}

async function demo11_RealWorldExample() {
  separator('Real-World Example: Web Scraping & Data Processing');
  
  log(colors.blue, '🌐 Simulating a complete data processing pipeline...\n');
  
  // Simulate a web scraping and data processing workflow
  const urls = [
    'https://httpbin.org/json',
    'https://httpbin.org/uuid',
    'https://httpbin.org/user-agent',
    'https://httpbin.org/headers'
  ];
  
  const scrapingTasks = urls.map((url, i) => ({
    task: async () => {
      log(colors.cyan, `🌐 Scraping: `, url);
      try {
        const response = await fetch(url);
        const data = await response.json();
        return {
          url,
          success: true,
          data,
          scraped_at: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
      }
    },
    priority: Math.floor(Math.random() * 10) + 1,
    name: `Scrape Site ${i + 1}`
  }));
  
  log(colors.yellow, '📊 Running with advanced configuration:');
  log(colors.yellow, '   • Concurrency: 2');
  log(colors.yellow, '   • Retries: 3 with exponential backoff');
  log(colors.yellow, '   • Timeout: 10 seconds');
  log(colors.yellow, '   • Priority queue enabled');
  log(colors.yellow, '   • Event monitoring\n');
  
  const summary = await runTasksWithSummary(
    scrapingTasks.map(t => t.task),
    {
      concurrency: 2,
      retries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      timeout: 10000,
      priorityQueue: true
    }
  );
  
  console.log(formatSummary(summary));
  
  // Process successful results
  const successfulData = summary.results
    .filter(r => r.success)
    .map(r => r.value);
  
  if (successfulData.length > 0) {
    log(colors.green, '\n📈 Processing scraped data:');
    successfulData.forEach((data, i) => {
      log(colors.cyan, `   • Dataset ${i + 1}: `, `${data.url} (${JSON.stringify(data.data).length} chars)`);
    });
    
    // Simulate data processing
    const processingTasks = successfulData.map((data, i) => 
      () => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            processed_id: `proc_${i + 1}`,
            original_url: data.url,
            processed_at: new Date().toISOString(),
            data_size: JSON.stringify(data.data).length
          });
        }, Math.random() * 500 + 200);
      })
    );
    
    log(colors.blue, '\n🔄 Processing scraped data...');
    const processedResults = await runTasks(processingTasks, { concurrency: 3 });
    
    processedResults.forEach((result, i) => {
      if (result.success) {
        log(colors.green, `   ✅ Processed: `, `${result.value.processed_id} (${result.value.data_size} chars)`);
      }
    });
    
    log(colors.magenta, '\n🎉 Pipeline completed successfully!');
    log(colors.yellow, `📊 Final stats: ${processedResults.filter(r => r.success).length}/${processedResults.length} items processed`);
  }
}

// 🚀 Main execution
async function runAllDemos() {
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║              🚀 ASYNC TASK RUNNER DEMO                  ║');
  console.log('║                                                          ║');
  console.log('║              Complete Feature Showcase                  ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  const demos = [
    { name: 'Basic Usage', fn: demo1_BasicUsage },
    { name: 'Retry Mechanism', fn: demo2_RetryMechanism },
    { name: 'Timeout Support', fn: demo3_TimeoutSupport },
    { name: 'Task Reporting', fn: demo4_TaskReporting },
    { name: 'CLI Demo', fn: demo5_CLIDemo },
    { name: 'Task Batching', fn: demo6_TaskBatching },
    { name: 'Priority Queue', fn: demo7_PriorityQueue },
    { name: 'Event System', fn: demo8_EventSystem },
    { name: 'Pause/Resume', fn: demo9_PauseResume },
    { name: 'Utility Classes', fn: demo10_UtilityClasses },
    { name: 'Real-World Example', fn: demo11_RealWorldExample }
  ];
  
  for (const demo of demos) {
    try {
      await demo.fn();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between demos
    } catch (error) {
      log(colors.red, `❌ Demo "${demo.name}" failed: `, error.message);
    }
  }
  
  // Final summary
  console.log(`\n${colors.magenta}${'='.repeat(60)}`);
  log(colors.magenta, '🎉 DEMO COMPLETED! ');
  console.log(`${colors.magenta}${'='.repeat(60)}`);
  
  log(colors.green, '\n✅ Features demonstrated:');
  console.log(`${colors.cyan}   📋 Basic task execution with concurrency control`);
  console.log(`${colors.cyan}   🔄 Intelligent retry mechanism with exponential backoff`);
  console.log(`${colors.cyan}   ⏰ Timeout support with AbortController`);
  console.log(`${colors.cyan}   📊 Comprehensive task result reporting`);
  console.log(`${colors.cyan}   💻 CLI interface for automation`);
  console.log(`${colors.cyan}   📦 Task batching with configurable delays`);
  console.log(`${colors.cyan}   🎯 Priority queue for task ordering`);
  console.log(`${colors.cyan}   🎪 Event-driven architecture with lifecycle hooks`);
  console.log(`${colors.cyan}   ⏸️ Pause/resume functionality for long-running queues`);
  console.log(`${colors.cyan}   🛠️ Utility classes for advanced task management`);
  console.log(`${colors.cyan}   🌐 Real-world web scraping and data processing pipeline${colors.reset}\n`);
  
  log(colors.yellow, '💡 Next steps:');
  console.log(`${colors.yellow}   • Install: npm install async-task-runner`);
  console.log(`${colors.yellow}   • Import: import { runTasks } from 'async-task-runner'`);
  console.log(`${colors.yellow}   • CLI: npx async-task-runner --help`);
  console.log(`${colors.yellow}   • Documentation: Check README.md and examples/`);
  console.log(`${colors.reset}`);
}

// Run the demo
runAllDemos().catch(error => {
  console.error(`${colors.red}💥 Demo crashed:`, error.message, colors.reset);
  process.exit(1);
});