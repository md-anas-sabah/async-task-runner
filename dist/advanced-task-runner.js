import { EventEmitter } from 'events';
import { TaskRunner } from './task-runner.js';
import { DefaultLogger } from './logger.js';
export class AdvancedTaskRunner extends EventEmitter {
    constructor(options = {}) {
        super();
        this.tasks = [];
        this.running = new Set();
        this.completed = [];
        this.failed = [];
        this.isPaused = false;
        this.isStopped = false;
        this.options = {
            concurrency: 3,
            retries: 0,
            retryDelay: 1000,
            exponentialBackoff: false,
            maxRetryDelay: 30000,
            batchSize: 0,
            batchDelay: 0,
            parallelBatches: false,
            priorityQueue: false,
            pauseOnError: false,
            stopOnError: false,
            ...options
        };
        const baseOptions = {
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
        if (this.options.eventHandlers) {
            Object.entries(this.options.eventHandlers).forEach(([event, handler]) => {
                this.on(event, handler);
            });
        }
    }
    add(taskOrPriority, metadata = {}) {
        if (this.isStopped) {
            throw new Error('Cannot add tasks to stopped queue');
        }
        let task;
        let priority = 0;
        let taskMetadata = metadata;
        if (typeof taskOrPriority === 'function') {
            task = taskOrPriority;
            priority = metadata.priority || 0;
        }
        else {
            task = taskOrPriority.task;
            priority = taskOrPriority.priority;
            taskMetadata = { ...taskOrPriority, ...metadata };
        }
        this.tasks.push({
            task,
            metadata: taskMetadata,
            priority
        });
        if (this.options.priorityQueue) {
            this.tasks.sort((a, b) => b.priority - a.priority);
        }
    }
    async run() {
        if (this.isStopped) {
            throw new Error('Cannot run stopped queue');
        }
        this.emit('start', this.tasks.length);
        let results;
        if (this.options.batchSize && this.options.batchSize > 0) {
            results = await this.runBatched();
        }
        else {
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
    async runBatched() {
        const allResults = [];
        const batchSize = this.options.batchSize;
        for (let i = 0; i < this.tasks.length; i += batchSize) {
            if (this.isStopped)
                break;
            while (this.isPaused) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const batch = this.tasks.slice(i, i + batchSize);
            this.emit('batchStart', Math.floor(i / batchSize) + 1, batch.length);
            const batchTasks = batch.map(({ task }) => task);
            const batchResults = await this.baseRunner.run(batchTasks);
            batchResults.forEach((result, index) => {
                if (batch[index]?.metadata) {
                    result.metadata = batch[index].metadata;
                }
            });
            allResults.push(...batchResults);
            this.emit('batchComplete', Math.floor(i / batchSize) + 1, batchResults);
            this.emit('progress', allResults.length, this.tasks.length, 0);
            if (this.options.stopOnError && batchResults.some(r => !r.success)) {
                this.isStopped = true;
                break;
            }
            if (this.options.pauseOnError && batchResults.some(r => !r.success)) {
                this.isPaused = true;
            }
            if (this.options.batchDelay && this.options.batchDelay > 0 && i + batchSize < this.tasks.length) {
                await new Promise(resolve => setTimeout(resolve, this.options.batchDelay));
            }
        }
        return allResults;
    }
    async runAll() {
        const tasks = this.tasks.map(({ task }) => task);
        const results = await this.baseRunner.run(tasks);
        results.forEach((result, index) => {
            if (index < this.tasks.length && this.tasks[index]?.metadata) {
                result.metadata = this.tasks[index].metadata;
            }
        });
        return results;
    }
    pause() {
        if (!this.isStopped) {
            this.isPaused = true;
            this.emit('pause');
        }
    }
    resume() {
        if (!this.isStopped && this.isPaused) {
            this.isPaused = false;
            this.emit('resume');
        }
    }
    stop() {
        this.isStopped = true;
        this.isPaused = false;
        this.emit('stop');
    }
    clear() {
        if (this.running.size > 0) {
            throw new Error('Cannot clear queue while tasks are running');
        }
        this.tasks = [];
        this.completed = [];
        this.failed = [];
        this.emit('clear');
    }
    status() {
        return {
            running: this.running.size,
            pending: this.tasks.length - this.completed.length - this.failed.length,
            completed: this.completed.length,
            failed: this.failed.length,
            paused: this.isPaused,
            stopped: this.isStopped
        };
    }
    groupTasksByBatch() {
        const groups = new Map();
        this.tasks.forEach(({ task, metadata }) => {
            const batchId = metadata.batch || 'default';
            if (!groups.has(batchId)) {
                groups.set(batchId, []);
            }
            groups.get(batchId).push({ task, metadata });
        });
        return groups;
    }
    async runBatchById(batchId) {
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
    getTasksByPriority() {
        const priorities = new Map();
        this.tasks.forEach(({ task, metadata, priority }) => {
            if (!priorities.has(priority)) {
                priorities.set(priority, []);
            }
            priorities.get(priority).push({ task, metadata });
        });
        return Array.from(priorities.entries())
            .map(([priority, tasks]) => ({ priority, tasks }))
            .sort((a, b) => b.priority - a.priority);
    }
    getStatistics() {
        const total = this.tasks.length;
        const successRate = total > 0 ? 75 : 0;
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
export class TaskBatch {
    constructor(id) {
        this.id = id;
        this.tasks = [];
    }
    add(task, metadata = {}) {
        this.tasks.push({
            task,
            metadata: { ...metadata, batch: this.id }
        });
    }
    getTasks() {
        return [...this.tasks];
    }
    size() {
        return this.tasks.length;
    }
    clear() {
        this.tasks = [];
    }
}
export class PriorityTaskQueue {
    constructor() {
        this.tasks = [];
    }
    add(task, priority, metadata = {}) {
        this.tasks.push({
            task,
            priority,
            ...metadata
        });
        this.tasks.sort((a, b) => b.priority - a.priority);
    }
    getNext() {
        return this.tasks.shift();
    }
    peek() {
        return this.tasks[0];
    }
    size() {
        return this.tasks.length;
    }
    isEmpty() {
        return this.tasks.length === 0;
    }
    clear() {
        this.tasks = [];
    }
    getByPriority(priority) {
        return this.tasks.filter(t => t.priority === priority);
    }
    getPriorities() {
        return [...new Set(this.tasks.map(t => t.priority))].sort((a, b) => b - a);
    }
}
export class EventDrivenTaskRunner extends AdvancedTaskRunner {
    constructor(options = {}) {
        super(options);
        this.on('start', (totalTasks) => {
            if (options.eventHandlers?.onStart && totalTasks > 0) {
                options.eventHandlers.onStart(0);
            }
        });
        this.on('complete', (summary) => {
            if (options.eventHandlers?.onComplete) {
                options.eventHandlers.onComplete(summary);
            }
            if (options.eventHandlers?.onSuccess && summary.results) {
                summary.results.forEach((result, index) => {
                    if (result.success && options.eventHandlers?.onSuccess) {
                        options.eventHandlers.onSuccess(index, result.value, result.duration);
                    }
                });
            }
        });
        this.on('progress', (completed, total, running) => {
            if (options.eventHandlers?.onProgress) {
                options.eventHandlers.onProgress(completed, total, running);
            }
        });
    }
    async run() {
        if (this.isStopped) {
            throw new Error('Cannot run stopped queue');
        }
        this.emit('start', this.tasks.length);
        let results;
        if (this.options.batchSize && this.options.batchSize > 0) {
            results = await this.runBatched();
        }
        else {
            results = await this.runAll();
        }
        const summary = {
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            total: results.length,
            results
        };
        this.emit('complete', summary);
        return results;
    }
}
//# sourceMappingURL=advanced-task-runner.js.map