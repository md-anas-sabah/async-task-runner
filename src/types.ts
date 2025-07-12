export type AsyncTask<T = any> = () => Promise<T>;

export interface TimeoutConfig {
  timeout?: number;
}

export interface RetryConfig {
  retries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  maxRetryDelay?: number;
}

export interface TaskConfig extends RetryConfig, TimeoutConfig {
  concurrency?: number;
}

export interface TaskResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  taskIndex: number;
  attempts: number;
  duration?: number;
  timedOut?: boolean;
  retryHistory?: Array<{
    attempt: number;
    error: Error;
    timestamp: Date;
    delay: number;
    duration?: number;
    timedOut?: boolean;
  }>;
}

export interface TaskRunnerOptions extends RetryConfig, TimeoutConfig {
  concurrency: number;
}

export class TimeoutError extends Error {
  constructor(message: string, public duration: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface ErrorSummary {
  type: 'error' | 'timeout';
  message: string;
  count: number;
  taskIndexes: number[];
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface TaskExecutionSummary<T = any> {
  success: number;
  failed: number;
  timedOut: number;
  retries: number;
  totalDuration: number;
  averageDuration: number;
  results: TaskResult<T>[];
  errors: ErrorSummary[];
  startTime: Date;
  endTime: Date;
  executionTime: number;
}