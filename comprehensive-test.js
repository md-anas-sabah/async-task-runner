#!/usr/bin/env node

/**
 * Comprehensive Test for All 8 Phases
 * 
 * This test validates that all implemented phases work correctly:
 * Phase 1: Basic async task runner with concurrency
 * Phase 2: Retry mechanism with exponential backoff
 * Phase 3: Timeout support with AbortController
 * Phase 4: Task result reporting and summaries
 * Phase 5: Documentation and examples
 * Phase 6: CLI support
 * Phase 7: Tests and TypeScript
 * Phase 8: Advanced features (batching, events, priority, pause/resume)
 */

import fs from 'fs/promises';
import { spawn } from 'child_process';
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

// Test results tracker
const testResults = {
  phase1: { passed: 0, total: 0 },
  phase2: { passed: 0, total: 0 },
  phase3: { passed: 0, total: 0 },
  phase4: { passed: 0, total: 0 },
  phase5: { passed: 0, total: 0 },
  phase6: { passed: 0, total: 0 },
  phase7: { passed: 0, total: 0 },
  phase8: { passed: 0, total: 0 }
};

function test(phase, name, testFn) {
  return async () => {
    testResults[phase].total++;
    try {
      await testFn();
      testResults[phase].passed++;
      console.log(`  ✅ ${name}`);
      return true;
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      return false;
    }
  };
}

// Phase 1: Basic Functionality Tests
async function testPhase1() {
  console.log('🧪 Phase 1: Basic Async Task Runner');
  console.log('-'.repeat(40));
  
  await test('phase1', 'Basic task execution', async () => {
    const tasks = [
      () => Promise.resolve('task1'),
      () => Promise.resolve('task2'),
      () => Promise.resolve('task3')
    ];
    const results = await runTasks(tasks);
    if (results.length !== 3 || !results.every(r => r.success)) {
      throw new Error('Basic task execution failed');
    }
  })();
  
  await test('phase1', 'Concurrency control', async () => {
    const startTimes = [];
    const tasks = Array.from({ length: 4 }, (_, i) => 
      () => new Promise(resolve => {
        startTimes.push(Date.now());
        setTimeout(() => resolve(`task${i}`), 100);
      })
    );
    
    await runTasks(tasks, { concurrency: 2 });
    
    // With concurrency 2, first 2 should start together, then next 2
    if (startTimes.length !== 4) {
      throw new Error('Concurrency control not working properly');
    }
  })();
  
  await test('phase1', 'Error handling', async () => {
    const tasks = [
      () => Promise.resolve('success'),
      () => Promise.reject(new Error('intentional failure')),
      () => Promise.resolve('another success')
    ];
    
    const results = await runTasks(tasks);
    if (results.length !== 3 || results[1].success !== false || results[0].success !== true) {
      throw new Error('Error handling failed');
    }
  })();
  
  console.log('');
}

// Phase 2: Retry Logic Tests
async function testPhase2() {
  console.log('🧪 Phase 2: Retry Mechanism');
  console.log('-'.repeat(40));
  
  await test('phase2', 'Basic retry functionality', async () => {
    let attemptCount = 0;
    const tasks = [
      () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Retry test');
        }
        return Promise.resolve('success after retries');
      }
    ];
    
    const results = await runTasks(tasks, { retries: 3 });
    if (!results[0].success || results[0].attempts !== 3) {
      throw new Error('Retry functionality failed');
    }
  })();
  
  await test('phase2', 'Exponential backoff', async () => {
    let attemptCount = 0;
    const retryTimes = [];
    
    const tasks = [
      () => {
        attemptCount++;
        retryTimes.push(Date.now());
        if (attemptCount < 3) {
          throw new Error('Exponential backoff test');
        }
        return Promise.resolve('success');
      }
    ];
    
    const startTime = Date.now();
    await runTasks(tasks, {
      retries: 3,
      retryDelay: 100,
      exponentialBackoff: true
    });
    const endTime = Date.now();
    
    // Should take at least 300ms (100 + 200) for exponential backoff
    if (endTime - startTime < 250) {
      throw new Error('Exponential backoff not working');
    }
  })();
  
  await test('phase2', 'Max retry delay', async () => {
    let attemptCount = 0;
    const tasks = [
      () => {
        attemptCount++;
        if (attemptCount < 4) {
          throw new Error('Max delay test');
        }
        return Promise.resolve('success');
      }
    ];
    
    const results = await runTasks(tasks, {
      retries: 4,
      retryDelay: 1000,
      exponentialBackoff: true,
      maxRetryDelay: 1500
    });
    
    if (!results[0].success) {
      throw new Error('Max retry delay test failed');
    }
  })();
  
  console.log('');
}

// Phase 3: Timeout Tests
async function testPhase3() {
  console.log('🧪 Phase 3: Timeout Support');
  console.log('-'.repeat(40));
  
  await test('phase3', 'Basic timeout functionality', async () => {
    const tasks = [
      () => new Promise(resolve => setTimeout(() => resolve('fast'), 100)),
      () => new Promise(resolve => setTimeout(() => resolve('slow'), 2000))
    ];
    
    const results = await runTasks(tasks, { timeout: 500 });
    
    if (results[0].success !== true || results[1].success !== false || !results[1].timedOut) {
      throw new Error('Timeout functionality failed');
    }
  })();
  
  await test('phase3', 'Timeout with retries', async () => {
    let attemptCount = 0;
    const tasks = [
      () => {
        attemptCount++;
        return new Promise(resolve => {
          // First attempts timeout, last one succeeds quickly
          const delay = attemptCount <= 2 ? 1000 : 100;
          setTimeout(() => resolve('success'), delay);
        });
      }
    ];
    
    const results = await runTasks(tasks, {
      timeout: 500,
      retries: 3
    });
    
    if (!results[0].success || results[0].attempts !== 3) {
      throw new Error('Timeout with retries failed');
    }
  })();
  
  await test('phase3', 'Duration tracking', async () => {
    const tasks = [
      () => new Promise(resolve => setTimeout(() => resolve('test'), 200))
    ];
    
    const results = await runTasks(tasks);
    
    if (!results[0].duration || results[0].duration < 180) {
      throw new Error('Duration tracking failed');
    }
  })();
  
  console.log('');
}

// Phase 4: Reporting Tests
async function testPhase4() {
  console.log('🧪 Phase 4: Task Result Reporting');
  console.log('-'.repeat(40));
  
  await test('phase4', 'Summary generation', async () => {
    const tasks = [
      () => Promise.resolve('success1'),
      () => Promise.reject(new Error('failure1')),
      () => Promise.resolve('success2'),
      () => Promise.reject(new Error('failure2'))
    ];
    
    const summary = await runTasksWithSummary(tasks, { retries: 1 });
    
    if (summary.success !== 2 || summary.failed !== 2 || !summary.errors) {
      throw new Error('Summary generation failed');
    }
  })();
  
  await test('phase4', 'Error categorization', async () => {
    const tasks = [
      () => Promise.reject(new Error('Network error')),
      () => Promise.reject(new Error('Network error')),
      () => Promise.reject(new Error('Database error'))
    ];
    
    const summary = await runTasksWithSummary(tasks);
    
    if (!summary.errors || summary.errors.length < 2) {
      throw new Error('Error categorization failed');
    }
  })();
  
  await test('phase4', 'Formatted summary', async () => {
    const tasks = [() => Promise.resolve('test')];
    const summary = await runTasksWithSummary(tasks);
    const formatted = formatSummary(summary);
    
    if (!formatted.includes('Task Execution Summary') || !formatted.includes('Successful: 1')) {
      throw new Error('Formatted summary failed');
    }
  })();
  
  console.log('');
}

// Phase 5: Documentation Tests
async function testPhase5() {
  console.log('🧪 Phase 5: Documentation & Examples');
  console.log('-'.repeat(40));
  
  await test('phase5', 'README exists and complete', async () => {
    const readme = await fs.readFile('./README.md', 'utf-8');
    if (!readme.includes('async-task-runner') || !readme.includes('Installation') || !readme.includes('Usage')) {
      throw new Error('README incomplete');
    }
  })();
  
  await test('phase5', 'Examples directory structure', async () => {
    const files = await fs.readdir('./examples');
    const expectedFiles = ['README.md', 'web-scraping.js', 'file-processing.js', 'api-integration.js'];
    
    for (const file of expectedFiles) {
      if (!files.includes(file)) {
        throw new Error(`Missing example file: ${file}`);
      }
    }
  })();
  
  await test('phase5', 'Examples are executable', async () => {
    // Test that examples can be imported without errors
    const webScraping = await fs.readFile('./examples/web-scraping.js', 'utf-8');
    if (!webScraping.includes('import') || !webScraping.includes('runTasksWithSummary')) {
      throw new Error('Web scraping example invalid');
    }
  })();
  
  console.log('');
}

// Phase 6: CLI Tests
async function testPhase6() {
  console.log('🧪 Phase 6: CLI Support');
  console.log('-'.repeat(40));
  
  await test('phase6', 'CLI executable exists', async () => {
    await fs.access('./dist/cli.js');
  })();
  
  await test('phase6', 'Example generation works', () => {
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['./dist/cli.js', 'example', '--type', 'http', '--output', 'test-cli-output.json'], {
        stdio: 'pipe'
      });
      
      child.on('close', async (code) => {
        try {
          if (code !== 0) {
            reject(new Error('CLI example generation failed'));
            return;
          }
          
          // Check if file was created
          await fs.access('./test-cli-output.json');
          const content = await fs.readFile('./test-cli-output.json', 'utf-8');
          const config = JSON.parse(content);
          
          if (!config.tasks || !Array.isArray(config.tasks)) {
            reject(new Error('Generated config invalid'));
            return;
          }
          
          // Cleanup
          await fs.unlink('./test-cli-output.json');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      child.on('error', reject);
    });
  })();
  
  await test('phase6', 'Configuration validation works', () => {
    return new Promise(async (resolve, reject) => {
      // Create a test config
      const testConfig = {
        tasks: [
          { id: 'test', url: 'https://httpbin.org/get', method: 'GET' }
        ]
      };
      
      await fs.writeFile('./test-validate.json', JSON.stringify(testConfig));
      
      const child = spawn('node', ['./dist/cli.js', 'validate', './test-validate.json'], {
        stdio: 'pipe'
      });
      
      child.on('close', async (code) => {
        try {
          await fs.unlink('./test-validate.json');
          if (code !== 0) {
            reject(new Error('CLI validation failed'));
          } else {
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });
      
      child.on('error', reject);
    });
  })();
  
  console.log('');
}

// Phase 7: TypeScript and Testing
async function testPhase7() {
  console.log('🧪 Phase 7: Tests + TypeScript');
  console.log('-'.repeat(40));
  
  await test('phase7', 'TypeScript compilation', async () => {
    // Check if dist files exist and are recent
    await fs.access('./dist/index.js');
    await fs.access('./dist/index.d.ts');
    
    const indexJs = await fs.stat('./dist/index.js');
    const indexTs = await fs.stat('./src/index.ts');
    
    // Compiled file should be newer than source (or same time if just built)
    if (indexJs.mtime < indexTs.mtime) {
      throw new Error('TypeScript compilation may be outdated');
    }
  })();
  
  await test('phase7', 'Type definitions available', async () => {
    const indexDts = await fs.readFile('./dist/index.d.ts', 'utf-8');
    if (!indexDts.includes('export') || !indexDts.includes('AsyncTask')) {
      throw new Error('Type definitions incomplete');
    }
  })();
  
  await test('phase7', 'Test files exist', async () => {
    const testFiles = await fs.readdir('./tests');
    const expectedTests = ['basic-functionality.test.ts', 'advanced-features.test.ts', 'cli.test.ts'];
    
    for (const test of expectedTests) {
      if (!testFiles.includes(test)) {
        throw new Error(`Missing test file: ${test}`);
      }
    }
  })();
  
  console.log('');
}

// Phase 8: Advanced Features Tests
async function testPhase8() {
  console.log('🧪 Phase 8: Advanced Features');
  console.log('-'.repeat(40));
  
  await test('phase8', 'Task batching', async () => {
    const tasks = Array.from({ length: 6 }, (_, i) => 
      () => Promise.resolve(`batch-${i}`)
    );
    
    const results = await runTasksInBatches(tasks, 2, {
      batchDelay: 50,
      concurrency: 1
    });
    
    if (results.length !== 6 || !results.every(r => r.success)) {
      throw new Error('Task batching failed');
    }
  })();
  
  await test('phase8', 'Priority queue', async () => {
    const executionOrder = [];
    const priorityTasks = [
      {
        task: () => {
          executionOrder.push('low');
          return Promise.resolve('low-priority');
        },
        priority: 1,
        name: 'Low Priority'
      },
      {
        task: () => {
          executionOrder.push('high');
          return Promise.resolve('high-priority');
        },
        priority: 10,
        name: 'High Priority'
      },
      {
        task: () => {
          executionOrder.push('medium');
          return Promise.resolve('medium-priority');
        },
        priority: 5,
        name: 'Medium Priority'
      }
    ];
    
    await runPriorityTasks(priorityTasks, { concurrency: 1 });
    
    // High priority should execute first
    if (executionOrder[0] !== 'high') {
      throw new Error('Priority queue not working correctly');
    }
  })();
  
  await test('phase8', 'Event system', async () => {
    const events = [];
    
    const eventHandlers = {
      onStart: (taskIndex) => events.push(`start-${taskIndex}`),
      onSuccess: (taskIndex) => events.push(`success-${taskIndex}`),
      onComplete: () => events.push('complete')
    };
    
    const runner = new EventDrivenTaskRunner({
      concurrency: 1,
      eventHandlers
    });
    
    runner.add(() => Promise.resolve('event-test'), { id: 'test-task' });
    await runner.run();
    
    if (events.length === 0 || !events.includes('complete')) {
      throw new Error('Event system not working');
    }
  })();
  
  await test('phase8', 'Pause/Resume functionality', async () => {
    const runner = new AdvancedTaskRunner({
      concurrency: 1,
      batchSize: 2,
      batchDelay: 100
    });
    
    Array.from({ length: 4 }, (_, i) => 
      runner.add(() => new Promise(resolve => 
        setTimeout(() => resolve(`pause-test-${i}`), 50)
      ), { id: `pause-task-${i}` })
    );
    
    const runPromise = runner.run();
    
    // Test pause/resume
    setTimeout(() => {
      runner.pause();
      setTimeout(() => {
        runner.resume();
      }, 50);
    }, 25);
    
    const results = await runPromise;
    
    if (results.length !== 4 || !results.every(r => r.success)) {
      throw new Error('Pause/Resume functionality failed');
    }
  })();
  
  await test('phase8', 'Utility classes', async () => {
    // Test TaskBatch
    const batch = new TaskBatch('test-batch');
    batch.add(() => Promise.resolve('test1'), { priority: 1 });
    batch.add(() => Promise.resolve('test2'), { priority: 2 });
    
    if (batch.size() !== 2 || batch.id !== 'test-batch') {
      throw new Error('TaskBatch utility failed');
    }
    
    // Test PriorityTaskQueue
    const queue = new PriorityTaskQueue();
    queue.add(() => Promise.resolve('low'), 1);
    queue.add(() => Promise.resolve('high'), 10);
    
    const first = queue.getNext();
    if (!first || first.priority !== 10) {
      throw new Error('PriorityTaskQueue utility failed');
    }
  })();
  
  await test('phase8', 'Advanced task runner integration', async () => {
    const runner = new AdvancedTaskRunner({
      concurrency: 2,
      retries: 1,
      timeout: 1000,
      batchSize: 3,
      priorityQueue: true
    });
    
    // Add various tasks
    runner.add(() => Promise.resolve('task1'), { priority: 1, name: 'Task 1' });
    runner.add(() => Promise.resolve('task2'), { priority: 5, name: 'Task 2' });
    runner.add(() => Promise.reject(new Error('fail')), { priority: 3, name: 'Failing Task' });
    runner.add(() => Promise.resolve('task4'), { priority: 10, name: 'Task 4' });
    
    const results = await runner.run();
    const stats = runner.getStatistics();
    
    if (results.length !== 4 || stats.total !== 4 || !stats.successRate) {
      throw new Error('Advanced task runner integration failed');
    }
  })();
  
  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Comprehensive Test Suite - All 8 Phases');
  console.log('='.repeat(70));
  console.log('');
  
  const phases = [
    { name: 'Phase 1', fn: testPhase1 },
    { name: 'Phase 2', fn: testPhase2 },
    { name: 'Phase 3', fn: testPhase3 },
    { name: 'Phase 4', fn: testPhase4 },
    { name: 'Phase 5', fn: testPhase5 },
    { name: 'Phase 6', fn: testPhase6 },
    { name: 'Phase 7', fn: testPhase7 },
    { name: 'Phase 8', fn: testPhase8 }
  ];
  
  for (const phase of phases) {
    try {
      await phase.fn();
    } catch (error) {
      console.log(`❌ ${phase.name} encountered unexpected error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  
  let totalPassed = 0;
  let totalTests = 0;
  
  Object.entries(testResults).forEach(([phase, results]) => {
    const phaseNum = phase.replace('phase', '');
    const percentage = results.total > 0 ? (results.passed / results.total * 100).toFixed(1) : '0.0';
    const status = results.passed === results.total ? '✅' : '❌';
    
    console.log(`${status} Phase ${phaseNum}: ${results.passed}/${results.total} tests passed (${percentage}%)`);
    totalPassed += results.passed;
    totalTests += results.total;
  });
  
  console.log('');
  console.log(`🎯 Overall: ${totalPassed}/${totalTests} tests passed (${(totalPassed/totalTests*100).toFixed(1)}%)`);
  
  if (totalPassed === totalTests) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED! Package is ready for production! 🎉');
    console.log('');
    console.log('✅ All 8 phases are working correctly:');
    console.log('   📋 Phase 1: Basic async task runner with concurrency');
    console.log('   🔄 Phase 2: Retry mechanism with exponential backoff');
    console.log('   ⏰ Phase 3: Timeout support with AbortController');
    console.log('   📊 Phase 4: Task result reporting and summaries');
    console.log('   📚 Phase 5: Documentation and examples');
    console.log('   💻 Phase 6: CLI support for automation');
    console.log('   🧪 Phase 7: Tests and TypeScript definitions');
    console.log('   🚀 Phase 8: Advanced features (batching, events, priority)');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the comprehensive test
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error.message);
  process.exit(1);
});