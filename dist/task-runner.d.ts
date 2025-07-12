import { AsyncTask, TaskResult, TaskRunnerOptions } from './types.js';
export declare class TaskRunner {
    private readonly options;
    constructor(options: TaskRunnerOptions);
    run<T>(tasks: AsyncTask<T>[]): Promise<TaskResult<T>[]>;
}
//# sourceMappingURL=task-runner.d.ts.map