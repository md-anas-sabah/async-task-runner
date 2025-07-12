import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult, Logger, TaskExecutionSummary } from './types.js';
import { DefaultLogger, createSilentLogger } from './logger.js';
export declare function runTasks<T>(tasks: AsyncTask<T>[], config?: TaskConfig): Promise<TaskResult<T>[]>;
export declare function runTasksWithLogging<T>(tasks: AsyncTask<T>[], config?: TaskConfig, logger?: Logger): Promise<TaskResult<T>[]>;
export declare function runTasksWithSummary<T>(tasks: AsyncTask<T>[], config?: TaskConfig): Promise<TaskExecutionSummary<T>>;
export declare function runTasksWithSummaryAndLogging<T>(tasks: AsyncTask<T>[], config?: TaskConfig, logger?: Logger): Promise<TaskExecutionSummary<T>>;
export { TaskRunner, DefaultLogger, createSilentLogger };
export { formatSummary } from './summary.js';
export type { AsyncTask, TaskConfig, TaskResult, TaskRunnerOptions, Logger, RetryConfig, TimeoutConfig, TimeoutError, TaskExecutionSummary, ErrorSummary } from './types.js';
//# sourceMappingURL=index.d.ts.map