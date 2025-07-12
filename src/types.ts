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

// Phase 8: Advanced Features Types

export interface TaskMetadata {
  id?: string;
  name?: string;
  priority?: number;
  batch?: string;
  dependencies?: string[];
  tags?: string[];
  userData?: any;
}

export interface PriorityTask<T = any> extends TaskMetadata {
  task: AsyncTask<T>;
  priority: number;
}

export interface BatchConfig {
  batchSize?: number;
  batchDelay?: number;
  parallelBatches?: boolean;
}

export interface EventHandlers {
  onStart?: (taskIndex: number, metadata?: TaskMetadata) => void;
  onRetry?: (taskIndex: number, attempt: number, error: Error, metadata?: TaskMetadata) => void;
  onSuccess?: (taskIndex: number, result: any, duration: number, metadata?: TaskMetadata) => void;
  onError?: (taskIndex: number, error: Error, attempts: number, metadata?: TaskMetadata) => void;
  onTimeout?: (taskIndex: number, duration: number, metadata?: TaskMetadata) => void;
  onComplete?: (summary: TaskExecutionSummary) => void;
  onProgress?: (completed: number, total: number, running: number) => void;
}

export interface AdvancedTaskOptions extends TaskConfig, BatchConfig {
  eventHandlers?: EventHandlers;
  priorityQueue?: boolean;
  pauseOnError?: boolean;
  stopOnError?: boolean;
}

export interface QueueStatus {
  running: number;
  pending: number;
  completed: number;
  failed: number;
  paused: boolean;
  stopped: boolean;
}

export interface TaskQueue {
  add(task: AsyncTask | PriorityTask, metadata?: TaskMetadata): void;
  pause(): void;
  resume(): void;
  stop(): void;
  clear(): void;
  status(): QueueStatus;
}

export interface TaskResult<T = any> {
  success: boolean;
  result?: T;
  error?: Error;
  taskIndex: number;
  attempts: number;
  duration?: number;
  timedOut?: boolean;
  metadata?: TaskMetadata;
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

export interface TaskOptions extends AdvancedTaskOptions {
  // Legacy compatibility
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