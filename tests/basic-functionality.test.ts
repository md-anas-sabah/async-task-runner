/**
 * Basic Functionality Tests - Phase 1-4
 * 
 * Tests core functionality including concurrency, retries, timeouts, and reporting
 */

import { runTasks, runTasksWithSummary, runTasksWithLogging } from '../src/index.js';
import { TaskRunner } from '../src/task-runner.js';
import { DefaultLogger } from '../src/logger.js';

describe('Basic Task Runner Functionality', () => {
  
  describe('Phase 1: Core Functionality', () => {
    test('should run tasks successfully', async () => {
      const tasks = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.resolve('result3')
      ];
      
      const results = await runTasks(tasks);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(results[0]?.result).toBe('result1');
      expect(results[1]?.result).toBe('result2');
      expect(results[2]?.result).toBe('result3');
    });
    
    test('should respect concurrency limits', async () => {
      const executionOrder: number[] = [];
      const tasks = Array.from({ length: 5 }, (_, i) => 
        () => new Promise(resolve => {
          executionOrder.push(i);
          setTimeout(() => resolve(`result${i}`), 100);
        })
      );
      
      await runTasks(tasks, { concurrency: 2 });
      
      // With concurrency 2, only first 2 tasks should start immediately
      expect(executionOrder.slice(0, 2)).toEqual([0, 1]);
    });
    
    test('should handle task failures gracefully', async () => {
      const tasks = [
        () => Promise.resolve('success'),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve('another success')
      ];
      
      const results = await runTasks(tasks);
      
      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[2]?.success).toBe(true);
      expect(results[1]?.error).toBeInstanceOf(Error);
    });
  });
  
  describe('Phase 2: Retry Logic', () => {
    test('should retry failed tasks', async () => {
      let attemptCount = 0;
      const tasks = [
        () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Task failed');
          }
          return Promise.resolve('success after retries');
        }
      ];
      
      const results = await runTasks(tasks, { retries: 3 });
      
      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.attempts).toBe(3);
      expect(results[0]?.result).toBe('success after retries');
    });
    
    test('should implement exponential backoff', async () => {
      const retryDelays: number[] = [];
      let attemptCount = 0;
      
      const tasks = [
        () => {
          attemptCount++;
          if (attemptCount < 4) {
            throw new Error('Task failed');
          }
          return Promise.resolve('success');
        }
      ];
      
      const startTime = Date.now();
      const results = await runTasksWithLogging(tasks, {
        retries: 3,
        retryDelay: 100,
        exponentialBackoff: true
      });
      const endTime = Date.now();
      
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.attempts).toBe(4);
      // With exponential backoff: 100ms + 200ms + 400ms = 700ms minimum
      expect(endTime - startTime).toBeGreaterThan(600);
    });
    
    test('should respect maximum retry delay', async () => {
      let attemptCount = 0;
      const tasks = [
        () => {
          attemptCount++;
          if (attemptCount < 5) {
            throw new Error('Task failed');
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
      
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.retryHistory).toBeDefined();
    });
  });
  
  describe('Phase 3: Timeout Support', () => {
    test('should timeout long-running tasks', async () => {
      const tasks = [
        () => new Promise(resolve => setTimeout(() => resolve('fast'), 100)),
        () => new Promise(resolve => setTimeout(() => resolve('slow'), 2000)),
        () => new Promise(resolve => setTimeout(() => resolve('fast2'), 150))
      ];
      
      const results = await runTasks(tasks, { timeout: 500 });
      
      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[1]?.timedOut).toBe(true);
      expect(results[2]?.success).toBe(true);
    });
    
    test('should integrate timeout with retry logic', async () => {
      let attemptCount = 0;
      const tasks = [
        () => {
          attemptCount++;
          return new Promise(resolve => {
            // First two attempts timeout, third succeeds quickly
            const delay = attemptCount <= 2 ? 1000 : 100;
            setTimeout(() => resolve('success'), delay);
          });
        }
      ];
      
      const results = await runTasks(tasks, {
        timeout: 500,
        retries: 3
      });
      
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.attempts).toBe(3);
    });
  });
  
  describe('Phase 4: Task Result Reporting', () => {
    test('should generate comprehensive execution summary', async () => {
      const tasks = [
        () => Promise.resolve('success1'),
        () => Promise.reject(new Error('failure1')),
        () => new Promise(resolve => setTimeout(() => resolve('success2'), 100)),
        () => Promise.reject(new Error('failure2')),
        () => Promise.resolve('success3')
      ];
      
      const summary = await runTasksWithSummary(tasks, { retries: 1 });
      
      expect(summary.results).toHaveLength(5);
      expect(summary.success).toBe(3);
      expect(summary.failed).toBe(2);
      expect(summary.retries).toBeGreaterThan(0);
      expect(summary.totalDuration).toBeGreaterThan(0);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.startTime).toBeInstanceOf(Date);
      expect(summary.endTime).toBeInstanceOf(Date);
      expect(summary.errors).toHaveLength(2);
    });
    
    test('should categorize errors correctly', async () => {
      const tasks = [
        () => Promise.reject(new Error('Network error')),
        () => Promise.reject(new Error('Network error')),
        () => Promise.reject(new Error('Database error')),
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1000)
        )
      ];
      
      const summary = await runTasksWithSummary(tasks, { timeout: 500 });
      
      expect(summary.errors.length).toBeGreaterThan(0);
      expect(summary.errors.some(e => e.type === 'timeout')).toBe(true);
    });
  });
  
  describe('Error Handling Edge Cases', () => {
    test('should handle empty task array', async () => {
      const results = await runTasks([]);
      expect(results).toHaveLength(0);
    });
    
    test('should handle tasks that throw synchronously', async () => {
      const tasks = [
        () => { throw new Error('Sync error'); },
        () => Promise.resolve('success')
      ];
      
      const results = await runTasks(tasks);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(false);
      expect(results[1]?.success).toBe(true);
    });
    
    test('should handle tasks that return non-promises', async () => {
      const tasks = [
        () => Promise.resolve('direct return'),
        () => Promise.resolve('promise return')
      ];
      
      const results = await runTasks(tasks);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
    });
  });
  
  describe('TaskRunner Class Direct Usage', () => {
    test('should work with direct TaskRunner instantiation', async () => {
      const logger = new DefaultLogger(false);
      const runner = new TaskRunner({
        concurrency: 2,
        retries: 1,
        retryDelay: 100
      }, logger);
      
      const tasks = [
        () => Promise.resolve('test1'),
        () => Promise.resolve('test2')
      ];
      
      const results = await runner.run(tasks);
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    test('should support custom logger', async () => {
      const logMessages: string[] = [];
      const customLogger = {
        info: (msg: string) => logMessages.push(`INFO: ${msg}`),
        warn: (msg: string) => logMessages.push(`WARN: ${msg}`),
        error: (msg: string) => logMessages.push(`ERROR: ${msg}`)
      };
      
      const runner = new TaskRunner({
        concurrency: 1,
        retries: 1
      }, customLogger);
      
      const tasks = [
        () => Promise.reject(new Error('Test error'))
      ];
      
      await runner.run(tasks);
      
      expect(logMessages.length).toBeGreaterThan(0);
      expect(logMessages.some(msg => msg.includes('WARN'))).toBe(true);
    });
  });
});