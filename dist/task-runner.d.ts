import { AsyncTask, TaskResult, TaskRunnerOptions, Logger, TaskExecutionSummary } from './types.js';
export declare class TaskRunner {
    private readonly options;
    private readonly logger;
    constructor(options: TaskRunnerOptions, logger?: Logger);
    private calculateRetryDelay;
    private delay;
    run<T>(tasks: AsyncTask<T>[]): Promise<TaskResult<T>[]>;
    runWithSummary<T>(tasks: AsyncTask<T>[]): Promise<TaskExecutionSummary<T>>;
}
//# sourceMappingURL=task-runner.d.ts.map