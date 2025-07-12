import { TimeoutError } from './types.js';
export interface TimeoutResult<T> {
    result: T;
    duration: number;
    timedOut: false;
}
export interface TimeoutFailure {
    error: TimeoutError;
    duration: number;
    timedOut: true;
}
export type TimeoutOutcome<T> = TimeoutResult<T> | TimeoutFailure;
export declare function withTimeout<T>(task: () => Promise<T>, timeoutMs: number): Promise<TimeoutOutcome<T>>;
export declare function createAbortableTask<T>(originalTask: () => Promise<T>, signal?: AbortSignal): () => Promise<T>;
//# sourceMappingURL=timeout.d.ts.map