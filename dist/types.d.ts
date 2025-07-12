export type AsyncTask<T = any> = () => Promise<T>;
export interface TaskConfig {
    concurrency?: number;
}
export interface TaskResult<T = any> {
    success: boolean;
    result?: T;
    error?: Error;
    taskIndex: number;
}
export interface TaskRunnerOptions {
    concurrency: number;
}
//# sourceMappingURL=types.d.ts.map