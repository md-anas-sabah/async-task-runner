import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult } from './types.js';
export declare function runTasks<T>(tasks: AsyncTask<T>[], config?: TaskConfig): Promise<TaskResult<T>[]>;
export { TaskRunner };
export type { AsyncTask, TaskConfig, TaskResult, TaskRunnerOptions } from './types.js';
//# sourceMappingURL=index.d.ts.map