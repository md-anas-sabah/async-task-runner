/**
 * Advanced Task Runner - Phase 8 Features
 * 
 * Implements advanced features including:
 * - Task batching
 * - Event emitters
 * - Priority queue support
 * - Pause/resume functionality
 */

import { EventEmitter } from 'events';
import { 
  AsyncTask, 
  TaskResult, 
  TaskMetadata, 
  PriorityTask, 
  AdvancedTaskOptions,
  EventHandlers,
  QueueStatus,
  TaskQueue,
  BatchConfig
} from './types.js';
import { TaskRunner } from './task-runner.js';
import { DefaultLogger } from './logger.js';

export class AdvancedTaskRunner extends EventEmitter implements TaskQueue {
  private tasks: Array<{
    task: AsyncTask;
    metadata: TaskMetadata;
    priority: number;
  }> = [];
  
  private running = new Set<number>();
  private completed: TaskResult[] = [];
  private failed: TaskResult[] = [];
  
  private isPaused = false;
  private isStopped = false;
  
  private options: AdvancedTaskOptions;
  private baseRunner: TaskRunner;
  
  constructor(options: AdvancedTaskOptions = {}) {
    super();
    this.options = {
      concurrency: 3,
      retries: 0,
      retryDelay: 1000,
      exponentialBackoff: false,
      maxRetryDelay: 30000,
      batchSize: 0, // 0 = no batching
      batchDelay: 0,
      parallelBatches: false,
      priorityQueue: false,
      pauseOnError: false,
      stopOnError: false,
      ...options
    };
    
    const baseOptions: any = {
      concurrency: this.options.concurrency || 3,
      retries: this.options.retries || 0,
      retryDelay: this.options.retryDelay || 1000,
      exponentialBackoff: this.options.exponentialBackoff || false,
      maxRetryDelay: this.options.maxRetryDelay || 30000
    };
    
    if (this.options.timeout !== undefined) {
      baseOptions.timeout = this.options.timeout;
    }
    
    this.baseRunner = new TaskRunner(baseOptions, new DefaultLogger(false));
    
    // Set up event handlers
    if (this.options.eventHandlers) {
      Object.entries(this.options.eventHandlers).forEach(([event, handler]) => {
        this.on(event, handler);
      });
    }
  }
  
  add(taskOrPriority: AsyncTask | PriorityTask, metadata: TaskMetadata = {}): void {
    if (this.isStopped) {
      throw new Error('Cannot add tasks to stopped queue');
    }
    
    let task: AsyncTask;
    let priority = 0;
    let taskMetadata = metadata;
    
    if (typeof taskOrPriority === 'function') {
      task = taskOrPriority;
      priority = metadata.priority || 0;
    } else {
      task = taskOrPriority.task;
      priority = taskOrPriority.priority;
      taskMetadata = { ...taskOrPriority, ...metadata };
    }
    
    this.tasks.push({
      task,
      metadata: taskMetadata,
      priority
    });
    
    // Sort by priority if priority queue is enabled
    if (this.options.priorityQueue) {
      this.tasks.sort((a, b) => b.priority - a.priority);
    }
  }
  
  async run(): Promise<TaskResult[]> {
    if (this.isStopped) {
      throw new Error('Cannot run stopped queue');
    }
    
    this.emit('start', this.tasks.length);
    
    let results: TaskResult[];
    
    if (this.options.batchSize && this.options.batchSize > 0) {
      results = await this.runBatched();
    } else {
      results = await this.runAll();
    }
    
    this.emit('complete', {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: results.length,
      results
    });
    
    return results;
  }
  
  private async runBatched(): Promise<TaskResult[]> {
    const allResults: TaskResult[] = [];
    const batchSize = this.options.batchSize!;
    
    for (let i = 0; i < this.tasks.length; i += batchSize) {
      if (this.isStopped) break;
      
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const batch = this.tasks.slice(i, i + batchSize);
      this.emit('batchStart', Math.floor(i / batchSize) + 1, batch.length);
      
      const batchTasks = batch.map(({ task }) => task);
      const batchResults = await this.baseRunner.run(batchTasks);
      
      // Add metadata to results
      batchResults.forEach((result, index) => {
        if (batch[index]?.metadata) {
          result.metadata = batch[index].metadata;
        }
      });
      
      allResults.push(...batchResults);
      
      this.emit('batchComplete', Math.floor(i / batchSize) + 1, batchResults);
      this.emit('progress', allResults.length, this.tasks.length, 0);
      
      // Check for stop/pause conditions
      if (this.options.stopOnError && batchResults.some(r => !r.success)) {
        this.isStopped = true;
        break;
      }
      
      if (this.options.pauseOnError && batchResults.some(r => !r.success)) {
        this.isPaused = true;
      }
      
      // Batch delay
      if (this.options.batchDelay && this.options.batchDelay > 0 && i + batchSize < this.tasks.length) {
        await new Promise(resolve => setTimeout(resolve, this.options.batchDelay!));
      }
    }
    
    return allResults;
  }
  
  private async runAll(): Promise<TaskResult[]> {
    const tasks = this.tasks.map(({ task }) => task);
    const results = await this.baseRunner.run(tasks);
    
    // Add metadata to results
    results.forEach((result, index) => {
      if (index < this.tasks.length && this.tasks[index]?.metadata) {
        result.metadata = this.tasks[index].metadata;
      }
    });
    
    return results;
  }
  
  pause(): void {
    if (!this.isStopped) {
      this.isPaused = true;
      this.emit('pause');
    }
  }
  
  resume(): void {
    if (!this.isStopped && this.isPaused) {
      this.isPaused = false;
      this.emit('resume');
    }
  }
  
  stop(): void {
    this.isStopped = true;
    this.isPaused = false;
    this.emit('stop');
  }
  
  clear(): void {
    if (this.running.size > 0) {
      throw new Error('Cannot clear queue while tasks are running');
    }
    this.tasks = [];
    this.completed = [];
    this.failed = [];
    this.emit('clear');
  }
  
  status(): QueueStatus {
    return {
      running: this.running.size,
      pending: this.tasks.length - this.completed.length - this.failed.length,
      completed: this.completed.length,
      failed: this.failed.length,
      paused: this.isPaused,
      stopped: this.isStopped
    };
  }
  
  // Batch management utilities
  groupTasksByBatch(): Map<string, Array<{ task: AsyncTask; metadata: TaskMetadata }>> {
    const groups = new Map<string, Array<{ task: AsyncTask; metadata: TaskMetadata }>>();
    
    this.tasks.forEach(({ task, metadata }) => {
      const batchId = metadata.batch || 'default';
      if (!groups.has(batchId)) {
        groups.set(batchId, []);
      }
      groups.get(batchId)!.push({ task, metadata });
    });
    
    return groups;
  }
  
  async runBatchById(batchId: string): Promise<TaskResult[]> {
    const batch = this.tasks.filter(({ metadata }) => metadata?.batch === batchId);
    if (batch.length === 0) {
      throw new Error(`No tasks found for batch: ${batchId}`);
    }
    
    const tasks = batch.map(({ task }) => task);
    const results = await this.baseRunner.run(tasks);
    
    results.forEach((result, index) => {
      if (batch[index]?.metadata) {
        result.metadata = batch[index].metadata;
      }
    });
    
    return results;
  }
  
  // Priority queue utilities
  getTasksByPriority(): Array<{ priority: number; tasks: Array<{ task: AsyncTask; metadata: TaskMetadata }> }> {
    const priorities = new Map<number, Array<{ task: AsyncTask; metadata: TaskMetadata }>>();
    
    this.tasks.forEach(({ task, metadata, priority }) => {
      if (!priorities.has(priority)) {
        priorities.set(priority, []);
      }
      priorities.get(priority)!.push({ task, metadata });
    });
    
    return Array.from(priorities.entries())
      .map(([priority, tasks]) => ({ priority, tasks }))
      .sort((a, b) => b.priority - a.priority);
  }
  
  // Event helper methods (removed unused emitTaskEvent)
  
  // Statistics and monitoring
  getStatistics() {
    const total = this.completed.length + this.failed.length;
    const successRate = total > 0 ? (this.completed.length / total) * 100 : 0;
    
    return {
      total: this.tasks.length,
      completed: this.completed.length,
      failed: this.failed.length,
      running: this.running.size,
      pending: this.tasks.length - this.completed.length - this.failed.length,
      successRate,
      averageDuration: this.completed.length > 0 
        ? this.completed.reduce((sum, r) => sum + (r.duration || 0), 0) / this.completed.length 
        : 0
    };
  }
}

// Utility functions for advanced features
export class TaskBatch {
  private tasks: Array<{ task: AsyncTask; metadata: TaskMetadata }> = [];
  
  constructor(public readonly id: string) {}
  
  add(task: AsyncTask, metadata: TaskMetadata = {}): void {
    this.tasks.push({
      task,
      metadata: { ...metadata, batch: this.id }
    });
  }
  
  getTasks(): Array<{ task: AsyncTask; metadata: TaskMetadata }> {
    return [...this.tasks];
  }
  
  size(): number {
    return this.tasks.length;
  }
  
  clear(): void {
    this.tasks = [];
  }
}

export class PriorityTaskQueue {
  private tasks: PriorityTask[] = [];
  
  add(task: AsyncTask, priority: number, metadata: TaskMetadata = {}): void {
    this.tasks.push({
      task,
      priority,
      ...metadata
    });
    
    // Keep sorted by priority (highest first)
    this.tasks.sort((a, b) => b.priority - a.priority);
  }
  
  getNext(): PriorityTask | undefined {
    return this.tasks.shift();
  }
  
  peek(): PriorityTask | undefined {
    return this.tasks[0];
  }
  
  size(): number {
    return this.tasks.length;
  }
  
  isEmpty(): boolean {
    return this.tasks.length === 0;
  }
  
  clear(): void {
    this.tasks = [];
  }
  
  getByPriority(priority: number): PriorityTask[] {
    return this.tasks.filter(t => t.priority === priority);
  }
  
  getPriorities(): number[] {
    return [...new Set(this.tasks.map(t => t.priority))].sort((a, b) => b - a);
  }
}

// Enhanced runner with event support
export class EventDrivenTaskRunner extends AdvancedTaskRunner {
  constructor(options: AdvancedTaskOptions = {}) {
    super(options);
    
    // Set up built-in event handlers for monitoring
    this.on('taskStart', (taskIndex: number, metadata?: TaskMetadata) => {
      if (options.eventHandlers?.onStart) {
        options.eventHandlers.onStart(taskIndex, metadata);
      }
    });
    
    this.on('taskRetry', (taskIndex: number, attempt: number, error: Error, metadata?: TaskMetadata) => {
      if (options.eventHandlers?.onRetry) {
        options.eventHandlers.onRetry(taskIndex, attempt, error, metadata);
      }
    });
    
    this.on('taskSuccess', (taskIndex: number, result: any, duration: number, metadata?: TaskMetadata) => {
      if (options.eventHandlers?.onSuccess) {
        options.eventHandlers.onSuccess(taskIndex, result, duration, metadata);
      }
    });
    
    this.on('taskError', (taskIndex: number, error: Error, attempts: number, metadata?: TaskMetadata) => {
      if (options.eventHandlers?.onError) {
        options.eventHandlers.onError(taskIndex, error, attempts, metadata);
      }
    });
    
    this.on('taskTimeout', (taskIndex: number, duration: number, metadata?: TaskMetadata) => {
      if (options.eventHandlers?.onTimeout) {
        options.eventHandlers.onTimeout(taskIndex, duration, metadata);
      }
    });
    
    this.on('progress', (completed: number, total: number, running: number) => {
      if (options.eventHandlers?.onProgress) {
        options.eventHandlers.onProgress(completed, total, running);
      }
    });
  }
}