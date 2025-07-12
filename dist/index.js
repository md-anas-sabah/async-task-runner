import { TaskRunner } from './task-runner.js';
import { DefaultLogger, createSilentLogger } from './logger.js';
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
export { TaskRunner, DefaultLogger, createSilentLogger };
//# sourceMappingURL=index.js.map