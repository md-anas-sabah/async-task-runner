import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult, Logger } from './types.js';
import { DefaultLogger, createSilentLogger } from './logger.js';
export declare function runTasks<T>(tasks: AsyncTask<T>[], config?: TaskConfig): Promise<TaskResult<T>[]>;
export declare function runTasksWithLogging<T>(tasks: AsyncTask<T>[], config?: TaskConfig, logger?: Logger): Promise<TaskResult<T>[]>;
export { TaskRunner, DefaultLogger, createSilentLogger };
export type { AsyncTask, TaskConfig, TaskResult, TaskRunnerOptions, Logger, RetryConfig, TimeoutConfig, TimeoutError } from './types.js';
//# sourceMappingURL=index.d.ts.map