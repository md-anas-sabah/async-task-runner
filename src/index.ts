import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult, Logger } from './types.js';
import { DefaultLogger, createSilentLogger } from './logger.js';

export async function runTasks<T>(
  tasks: AsyncTask<T>[],
  config: TaskConfig = {}
): Promise<TaskResult<T>[]> {
  const { 
    concurrency = 3,
    retries = 0,
    retryDelay = 1000,
    exponentialBackoff = false,
    maxRetryDelay = 30000,
    timeout
  } = config;
  
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

export async function runTasksWithLogging<T>(
  tasks: AsyncTask<T>[],
  config: TaskConfig = {},
  logger?: Logger
): Promise<TaskResult<T>[]> {
  const { 
    concurrency = 3,
    retries = 0,
    retryDelay = 1000,
    exponentialBackoff = false,
    maxRetryDelay = 30000,
    timeout
  } = config;
  
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
export type { AsyncTask, TaskConfig, TaskResult, TaskRunnerOptions, Logger, RetryConfig, TimeoutConfig, TimeoutError } from './types.js';