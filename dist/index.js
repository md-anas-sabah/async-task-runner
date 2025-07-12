import { TaskRunner } from './task-runner.js';
import { DefaultLogger, createSilentLogger } from './logger.js';
import { AdvancedTaskRunner } from './advanced-task-runner.js';
export async function runTasks(tasks, config = {}) {
    const { concurrency = 3, retries = 0, retryDelay = 1000, exponentialBackoff = false, maxRetryDelay = 30000, timeout } = config;
    const logger = createSilentLogger();
    const runner = new TaskRunner({
        concurrency,
        retries,
        retryDelay,
        exponentialBackoff,
        maxRetryDelay,
        ...(timeout !== undefined && { timeout })
    }, logger);
    return runner.run(tasks);
}
export async function runTasksWithLogging(tasks, config = {}, logger) {
    const { concurrency = 3, retries = 0, retryDelay = 1000, exponentialBackoff = false, maxRetryDelay = 30000, timeout } = config;
    const taskLogger = logger ?? new DefaultLogger(true);
    const runner = new TaskRunner({
        concurrency,
        retries,
        retryDelay,
        exponentialBackoff,
        maxRetryDelay,
        ...(timeout !== undefined && { timeout })
    }, taskLogger);
    return runner.run(tasks);
}
export async function runTasksWithSummary(tasks, config = {}) {
    const { concurrency = 3, retries = 0, retryDelay = 1000, exponentialBackoff = false, maxRetryDelay = 30000, timeout } = config;
    const logger = createSilentLogger();
    const runner = new TaskRunner({
        concurrency,
        retries,
        retryDelay,
        exponentialBackoff,
        maxRetryDelay,
        ...(timeout !== undefined && { timeout })
    }, logger);
    return runner.runWithSummary(tasks);
}
export async function runTasksWithSummaryAndLogging(tasks, config = {}, logger) {
    const { concurrency = 3, retries = 0, retryDelay = 1000, exponentialBackoff = false, maxRetryDelay = 30000, timeout } = config;
    const taskLogger = logger ?? new DefaultLogger(true);
    const runner = new TaskRunner({
        concurrency,
        retries,
        retryDelay,
        exponentialBackoff,
        maxRetryDelay,
        ...(timeout !== undefined && { timeout })
    }, taskLogger);
    return runner.runWithSummary(tasks);
}
export { AdvancedTaskRunner, EventDrivenTaskRunner, TaskBatch, PriorityTaskQueue } from './advanced-task-runner.js';
export async function runAdvancedTasks(tasks, options = {}) {
    const runner = new AdvancedTaskRunner(options);
    tasks.forEach((task, index) => {
        runner.add(task, { id: `task-${index}`, name: `Task ${index + 1}` });
    });
    return runner.run();
}
export async function runPriorityTasks(priorityTasks, options = {}) {
    const runner = new AdvancedTaskRunner({ ...options, priorityQueue: true });
    priorityTasks.forEach(priorityTask => {
        runner.add(priorityTask);
    });
    return runner.run();
}
export async function runTasksInBatches(tasks, batchSize, options = {}) {
    const runner = new AdvancedTaskRunner({
        ...options,
        batchSize,
        batchDelay: options.batchDelay || 1000
    });
    tasks.forEach((task, index) => {
        runner.add(task, { id: `task-${index}`, batch: `batch-${Math.floor(index / batchSize)}` });
    });
    return runner.run();
}
export { TaskRunner, DefaultLogger, createSilentLogger };
export { formatSummary } from './summary.js';
//# sourceMappingURL=index.js.map