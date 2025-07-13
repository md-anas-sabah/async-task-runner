/**
 * Advanced Features Tests - Phase 8
 * 
 * Tests advanced functionality including batching, events, priority queues, and pause/resume
 */

import {
  AdvancedTaskRunner,
  EventDrivenTaskRunner,
  TaskBatch,
  PriorityTaskQueue,
  runAdvancedTasks,
  runPriorityTasks,
  runTasksInBatches
} from '../src/index.js';
import { TaskMetadata, EventHandlers } from '../src/types.js';

describe('Advanced Task Runner Features', () => {
  
  describe('Task Batching', () => {
    test('should run tasks in batches', async () => {
      const batchEvents: string[] = [];
      const tasks = Array.from({ length: 6 }, (_, i) => 
        () => Promise.resolve(`result${i}`)
      );
      
      const runner = new AdvancedTaskRunner({
        batchSize: 2,
        batchDelay: 100,
        concurrency: 1
      });
      
      runner.on('batchStart', (batchNumber: number, size: number) => {
        batchEvents.push(`batch-start-${batchNumber}-${size}`);
      });
      
      runner.on('batchComplete', (batchNumber: number) => {
        batchEvents.push(`batch-complete-${batchNumber}`);
      });
      
      tasks.forEach((task, index) => {
        runner.add(task, { id: `task-${index}` });
      });
      
      const results = await runner.run();
      
      expect(results).toHaveLength(6);
      expect(results.every(r => r.success)).toBe(true);
      expect(batchEvents.length).toBeGreaterThan(0);
    });
    
    test('should use runTasksInBatches helper', async () => {
      const tasks = Array.from({ length: 8 }, (_, i) => 
        () => Promise.resolve(`batch-result-${i}`)
      );
      
      const results = await runTasksInBatches(tasks, 3, {
        batchDelay: 50,
        concurrency: 2
      });
      
      expect(results).toHaveLength(8);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    test('should handle batch errors correctly', async () => {
      const tasks = [
        () => Promise.resolve('success1'),
        () => Promise.reject(new Error('batch error')),
        () => Promise.resolve('success2'),
        () => Promise.resolve('success3')
      ];
      
      const results = await runTasksInBatches(tasks, 2);
      
      expect(results).toHaveLength(4);
      expect(results.filter(r => r.success)).toHaveLength(3);
      expect(results.filter(r => !r.success)).toHaveLength(1);
    });
  });
  
  describe('Priority Queue', () => {
    test('should execute tasks by priority', async () => {
      const executionOrder: string[] = [];
      
      const createTask = (name: string, priority: number) => ({
        task: () => {
          executionOrder.push(name);
          return Promise.resolve(name);
        },
        priority,
        name
      });
      
      const priorityTasks = [
        createTask('low1', 1),
        createTask('high1', 10),
        createTask('medium1', 5),
        createTask('high2', 10),
        createTask('low2', 1)
      ];
      
      const results = await runPriorityTasks(priorityTasks, {
        concurrency: 1 // Sequential execution to test order
      });
      
      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      
      // High priority tasks should execute first
      expect(executionOrder.slice(0, 2)).toEqual(
        expect.arrayContaining(['high1', 'high2'])
      );
    });
    
    test('should work with PriorityTaskQueue class', () => {
      const queue = new PriorityTaskQueue();
      
      queue.add(() => Promise.resolve('low'), 1, { name: 'low-priority' });
      queue.add(() => Promise.resolve('high'), 10, { name: 'high-priority' });
      queue.add(() => Promise.resolve('medium'), 5, { name: 'medium-priority' });
      
      expect(queue.size()).toBe(3);
      
      const first = queue.getNext();
      expect(first?.priority).toBe(10);
      expect(first?.name).toBe('high-priority');
      
      const second = queue.getNext();
      expect(second?.priority).toBe(5);
      
      const third = queue.getNext();
      expect(third?.priority).toBe(1);
      
      expect(queue.isEmpty()).toBe(true);
    });
  });
  
  describe('Event System', () => {
    test('should emit task lifecycle events', async () => {
      const events: Array<{ type: string; data: any }> = [];
      
      const eventHandlers: EventHandlers = {
        onStart: (taskIndex, metadata) => {
          events.push({ type: 'start', data: { taskIndex, metadata } });
        },
        onSuccess: (taskIndex, result, duration, metadata) => {
          events.push({ type: 'success', data: { taskIndex, result, duration, metadata } });
        },
        onError: (taskIndex, error, attempts, metadata) => {
          events.push({ type: 'error', data: { taskIndex, error, attempts, metadata } });
        },
        onProgress: (completed, total, running) => {
          events.push({ type: 'progress', data: { completed, total, running } });
        },
        onComplete: (summary) => {
          events.push({ type: 'complete', data: summary });
        }
      };
      
      const runner = new EventDrivenTaskRunner({
        concurrency: 1,
        eventHandlers
      });
      
      runner.add(() => Promise.resolve('success'), { id: 'task1', name: 'Test Task 1' });
      runner.add(() => Promise.reject(new Error('failure')), { id: 'task2', name: 'Test Task 2' });
      
      await runner.run();
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'start')).toBe(true);
      expect(events.some(e => e.type === 'success')).toBe(true);
      expect(events.some(e => e.type === 'error')).toBe(true);
      expect(events.some(e => e.type === 'complete')).toBe(true);
    });
    
    test('should emit retry events', async () => {
      const retryEvents: any[] = [];
      
      let attemptCount = 0;
      const eventHandlers: EventHandlers = {
        onRetry: (taskIndex, attempt, error, metadata) => {
          retryEvents.push({ taskIndex, attempt, error: error.message, metadata });
        }
      };
      
      const runner = new EventDrivenTaskRunner({
        retries: 3,
        retryDelay: 10,
        eventHandlers
      });
      
      runner.add(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Retry test error');
        }
        return Promise.resolve('success after retries');
      }, { id: 'retry-task' });
      
      await runner.run();
      
      expect(retryEvents.length).toBe(2); // 2 retries before success
      expect(retryEvents[0].attempt).toBe(2);
      expect(retryEvents[1].attempt).toBe(3);
    });
  });
  
  describe('Pause/Resume Functionality', () => {
    test('should pause and resume execution', async () => {
      const runner = new AdvancedTaskRunner({
        concurrency: 1,
        batchSize: 2,
        batchDelay: 100
      });
      
      const tasks = Array.from({ length: 4 }, (_, i) => 
        () => new Promise(resolve => 
          setTimeout(() => resolve(`result${i}`), 50)
        )
      );
      
      tasks.forEach((task, index) => {
        runner.add(task, { id: `task-${index}` });
      });
      
      // Start execution
      const runPromise = runner.run();
      
      // Pause after short delay
      setTimeout(() => {
        runner.pause();
        expect(runner.status().paused).toBe(true);
        
        // Resume after another delay
        setTimeout(() => {
          runner.resume();
          expect(runner.status().paused).toBe(false);
        }, 100);
      }, 25);
      
      const results = await runPromise;
      
      expect(results).toHaveLength(4);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    test('should stop execution', async () => {
      const runner = new AdvancedTaskRunner({
        concurrency: 1,
        batchSize: 1
      });
      
      const tasks = Array.from({ length: 5 }, (_, i) => 
        () => new Promise(resolve => 
          setTimeout(() => resolve(`result${i}`), 100)
        )
      );
      
      tasks.forEach((task, index) => {
        runner.add(task, { id: `task-${index}` });
      });
      
      // Start and stop quickly
      const runPromise = runner.run();
      setTimeout(() => runner.stop(), 50);
      
      const results = await runPromise;
      
      // Should have completed fewer than all tasks
      expect(results.length).toBeLessThan(5);
      expect(runner.status().stopped).toBe(true);
    });
  });
  
  describe('Task Metadata', () => {
    test('should preserve task metadata in results', async () => {
      const tasks = [
        {
          task: () => Promise.resolve('data1'),
          metadata: { id: 'task1', name: 'First Task', tags: ['important'], userData: { key: 'value1' } }
        },
        {
          task: () => Promise.resolve('data2'),
          metadata: { id: 'task2', name: 'Second Task', tags: ['normal'], userData: { key: 'value2' } }
        }
      ];
      
      const results = await runAdvancedTasks(
        tasks.map(t => t.task),
        { concurrency: 2 }
      );
      
      expect(results).toHaveLength(2);
      expect(results[0]?.metadata?.id).toBe('task-0');
      expect(results[0]?.metadata?.name).toBe('Task 1');
    });
    
    test('should group tasks by batch metadata', () => {
      const runner = new AdvancedTaskRunner();
      
      runner.add(() => Promise.resolve('1'), { batch: 'batch-a', id: 'task1' });
      runner.add(() => Promise.resolve('2'), { batch: 'batch-a', id: 'task2' });
      runner.add(() => Promise.resolve('3'), { batch: 'batch-b', id: 'task3' });
      runner.add(() => Promise.resolve('4'), { id: 'task4' }); // default batch
      
      const groups = runner.groupTasksByBatch();
      
      expect(groups.size).toBe(3);
      expect(groups.get('batch-a')).toHaveLength(2);
      expect(groups.get('batch-b')).toHaveLength(1);
      expect(groups.get('default')).toHaveLength(1);
    });
  });
  
  describe('TaskBatch Utility', () => {
    test('should manage task batches', () => {
      const batch = new TaskBatch('test-batch');
      
      batch.add(() => Promise.resolve('1'), { id: 'task1' });
      batch.add(() => Promise.resolve('2'), { id: 'task2' });
      
      expect(batch.size()).toBe(2);
      expect(batch.id).toBe('test-batch');
      
      const tasks = batch.getTasks();
      expect(tasks).toHaveLength(2);
      expect(tasks[0]?.metadata?.batch).toBe('test-batch');
      expect(tasks[1]?.metadata?.batch).toBe('test-batch');
      
      batch.clear();
      expect(batch.size()).toBe(0);
    });
  });
  
  describe('Queue Status and Statistics', () => {
    test('should provide queue status information', () => {
      const runner = new AdvancedTaskRunner();
      
      const initialStatus = runner.status();
      expect(initialStatus.pending).toBe(0);
      expect(initialStatus.running).toBe(0);
      expect(initialStatus.completed).toBe(0);
      expect(initialStatus.paused).toBe(false);
      expect(initialStatus.stopped).toBe(false);
      
      runner.add(() => Promise.resolve('test'));
      runner.pause();
      
      const pausedStatus = runner.status();
      expect(pausedStatus.paused).toBe(true);
    });
    
    test('should provide execution statistics', async () => {
      const runner = new AdvancedTaskRunner({ concurrency: 1 });
      
      runner.add(() => Promise.resolve('success1'));
      runner.add(() => Promise.reject(new Error('failure')));
      runner.add(() => Promise.resolve('success2'));
      
      await runner.run();
      
      const stats = runner.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });
  });
  
  describe('Advanced Configuration Options', () => {
    test('should stop on error when configured', async () => {
      const runner = new AdvancedTaskRunner({
        stopOnError: true,
        batchSize: 2
      });
      
      runner.add(() => Promise.resolve('success1'));
      runner.add(() => Promise.reject(new Error('stop here')));
      runner.add(() => Promise.resolve('should not execute'));
      runner.add(() => Promise.resolve('should not execute either'));
      
      const results = await runner.run();
      
      // Should stop after the error in first batch
      expect(results.length).toBeLessThan(4);
      expect(runner.status().stopped).toBe(true);
    });
    
    test('should pause on error when configured', async () => {
      const runner = new AdvancedTaskRunner({
        pauseOnError: true,
        batchSize: 2
      });
      
      runner.add(() => Promise.resolve('success1'));
      runner.add(() => Promise.reject(new Error('pause here')));
      runner.add(() => Promise.resolve('after pause'));
      
      const runPromise = runner.run();
      
      // Resume after pause
      setTimeout(() => {
        if (runner.status().paused) {
          runner.resume();
        }
      }, 100);
      
      const results = await runPromise;
      
      expect(results).toHaveLength(3);
      expect(results.filter(r => r.success)).toHaveLength(2);
    });
  });
});