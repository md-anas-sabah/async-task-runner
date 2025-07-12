import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult, Logger, TaskExecutionSummary, AdvancedTaskOptions, PriorityTask } from './types.js';
import { DefaultLogger, createSilentLogger } from './logger.js';
export declare function runTasks<T>(tasks: AsyncTask<T>[], config?: TaskConfig): Promise<TaskResult<T>[]>;
export declare function runTasksWithLogging<T>(tasks: AsyncTask<T>[], config?: TaskConfig, logger?: Logger): Promise<TaskResult<T>[]>;
export declare function runTasksWithSummary<T>(tasks: AsyncTask<T>[], config?: TaskConfig): Promise<TaskExecutionSummary<T>>;
export declare function runTasksWithSummaryAndLogging<T>(tasks: AsyncTask<T>[], config?: TaskConfig, logger?: Logger): Promise<TaskExecutionSummary<T>>;
export { AdvancedTaskRunner, EventDrivenTaskRunner, TaskBatch, PriorityTaskQueue } from './advanced-task-runner.js';
export declare function runAdvancedTasks<T>(tasks: AsyncTask<T>[], options?: AdvancedTaskOptions): Promise<TaskResult<T>[]>;
export declare function runPriorityTasks<T>(priorityTasks: PriorityTask<T>[], options?: AdvancedTaskOptions): Promise<TaskResult<T>[]>;
export declare function runTasksInBatches<T>(tasks: AsyncTask<T>[], batchSize: number, options?: AdvancedTaskOptions): Promise<TaskResult<T>[]>;
export { TaskRunner, DefaultLogger, createSilentLogger };
export { formatSummary } from './summary.js';
export type { AsyncTask, TaskConfig, TaskResult, TaskRunnerOptions, Logger, RetryConfig, TimeoutConfig, TimeoutError, TaskExecutionSummary, ErrorSummary, TaskMetadata, PriorityTask, BatchConfig, EventHandlers, AdvancedTaskOptions, QueueStatus, TaskQueue, TaskOptions } from './types.js';
//# sourceMappingURL=index.d.ts.map