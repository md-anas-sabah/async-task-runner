import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult, Logger, TaskExecutionSummary, AdvancedTaskOptions, PriorityTask } from './types.js';
import { DefaultLogger, createSilentLogger } from './logger.js';
import { AdvancedTaskRunner } from './advanced-task-runner.js';

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

export async function runTasksWithSummary<T>(
  tasks: AsyncTask<T>[],
  config: TaskConfig = {}
): Promise<TaskExecutionSummary<T>> {
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
  
  return runner.runWithSummary(tasks);
}

export async function runTasksWithSummaryAndLogging<T>(
  tasks: AsyncTask<T>[],
  config: TaskConfig = {},
  logger?: Logger
): Promise<TaskExecutionSummary<T>> {
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
  
  return runner.runWithSummary(tasks);
}

// Phase 8: Advanced Features
export { 
  AdvancedTaskRunner, 
  EventDrivenTaskRunner, 
  TaskBatch, 
  PriorityTaskQueue 
} from './advanced-task-runner.js';

// Phase 6-8: Enhanced API
export async function runAdvancedTasks<T>(
  tasks: AsyncTask<T>[],
  options: AdvancedTaskOptions = {}
): Promise<TaskResult<T>[]> {
  const runner = new AdvancedTaskRunner(options);
  
  tasks.forEach((task, index) => {
    runner.add(task, { id: `task-${index}`, name: `Task ${index + 1}` });
  });
  
  return runner.run();
}

export async function runPriorityTasks<T>(
  priorityTasks: PriorityTask<T>[],
  options: AdvancedTaskOptions = {}
): Promise<TaskResult<T>[]> {
  const runner = new AdvancedTaskRunner({ ...options, priorityQueue: true });
  
  priorityTasks.forEach(priorityTask => {
    runner.add(priorityTask);
  });
  
  return runner.run();
}

export async function runTasksInBatches<T>(
  tasks: AsyncTask<T>[],
  batchSize: number,
  options: AdvancedTaskOptions = {}
): Promise<TaskResult<T>[]> {
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

// Legacy exports
export { TaskRunner, DefaultLogger, createSilentLogger };
export { formatSummary } from './summary.js';

// Enhanced type exports for all phases
export type { 
  // Phase 1-5 types
  AsyncTask, 
  TaskConfig, 
  TaskResult, 
  TaskRunnerOptions, 
  Logger, 
  RetryConfig, 
  TimeoutConfig, 
  TimeoutError, 
  TaskExecutionSummary, 
  ErrorSummary,
  
  // Phase 8 advanced types
  TaskMetadata,
  PriorityTask,
  BatchConfig,
  EventHandlers,
  AdvancedTaskOptions,
  QueueStatus,
  TaskQueue,
  TaskOptions
} from './types.js';