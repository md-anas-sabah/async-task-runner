import { TaskResult, TaskExecutionSummary } from './types.js';
export declare function generateExecutionSummary<T>(results: TaskResult<T>[], startTime: Date, endTime: Date): TaskExecutionSummary<T>;
export declare function formatSummary<T>(summary: TaskExecutionSummary<T>): string;
//# sourceMappingURL=summary.d.ts.map