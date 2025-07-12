import { AsyncTask, TaskResult, TaskRunnerOptions, Logger } from './types.js';
export declare class TaskRunner {
    private readonly options;
    private readonly logger;
    constructor(options: TaskRunnerOptions, logger?: Logger);
    private calculateRetryDelay;
    private delay;
    run<T>(tasks: AsyncTask<T>[]): Promise<TaskResult<T>[]>;
}
//# sourceMappingURL=task-runner.d.ts.map