import { AsyncTask, TaskResult, TaskRunnerOptions, Logger, TimeoutError, TaskExecutionSummary } from './types.js';
import { DefaultLogger } from './logger.js';
import { withTimeout } from './timeout.js';
import { generateExecutionSummary } from './summary.js';

export class TaskRunner {
  private readonly options: TaskRunnerOptions;
  private readonly logger: Logger;

  constructor(options: TaskRunnerOptions, logger?: Logger) {
    this.options = {
      concurrency: Math.max(1, options.concurrency || 1),
      retries: options.retries ?? 0,
      retryDelay: options.retryDelay ?? 1000,
      exponentialBackoff: options.exponentialBackoff ?? false,
      maxRetryDelay: options.maxRetryDelay ?? 30000,
      ...(options.timeout !== undefined && { timeout: options.timeout }),
    };
    this.logger = logger ?? new DefaultLogger(false);
  }

  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    if (!this.options.exponentialBackoff) {
      return baseDelay;
    }

    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, this.options.maxRetryDelay!);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run<T>(tasks: AsyncTask<T>[]): Promise<TaskResult<T>[]> {
    if (tasks.length === 0) {
      return [];
    }

    const startTime = new Date();

    const results: TaskResult<T>[] = new Array(tasks.length);
    const executing: Set<Promise<void>> = new Set();
    let currentIndex = 0;

    const executeTaskWithRetry = async (taskIndex: number): Promise<void> => {
      const task = tasks[taskIndex]!;
      const maxAttempts = (this.options.retries || 0) + 1;
      const retryHistory: Array<{ 
        attempt: number; 
        error: Error; 
        timestamp: Date; 
        delay: number;
        duration?: number;
        timedOut?: boolean;
      }> = [];
      
      let lastError: Error = new Error('Unknown error');
      let totalDuration = 0;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const attemptStartTime = performance.now();
        
        try {
          if (attempt > 1) {
            const retryDelay = this.calculateRetryDelay(attempt - 1, this.options.retryDelay!);
            this.logger.info(`Task ${taskIndex}: Retrying attempt ${attempt}/${maxAttempts} after ${retryDelay}ms delay`);
            await this.delay(retryDelay);
          }

          let result: T;
          let attemptDuration: number;

          if (this.options.timeout) {
            const outcome = await withTimeout(task, this.options.timeout);
            
            if (outcome.timedOut) {
              attemptDuration = outcome.duration;
              throw outcome.error;
            } else {
              result = outcome.result;
              attemptDuration = outcome.duration;
            }
          } else {
            result = await task();
            attemptDuration = performance.now() - attemptStartTime;
          }

          totalDuration += attemptDuration;
          
          if (attempt > 1) {
            this.logger.info(`Task ${taskIndex}: Succeeded on attempt ${attempt}/${maxAttempts} (${attemptDuration.toFixed(2)}ms)`);
          }

          const successResult: TaskResult<T> = {
            success: true,
            result,
            taskIndex,
            attempts: attempt,
            duration: totalDuration,
          };
          
          if (retryHistory.length > 0) {
            successResult.retryHistory = retryHistory;
          }
          
          results[taskIndex] = successResult;
          return;
          
        } catch (error) {
          const attemptDuration = performance.now() - attemptStartTime;
          totalDuration += attemptDuration;
          
          lastError = error instanceof Error ? error : new Error(String(error));
          const isTimeout = error instanceof TimeoutError;
          
          if (attempt < maxAttempts) {
            const retryDelay = this.calculateRetryDelay(attempt, this.options.retryDelay!);
            retryHistory.push({
              attempt,
              error: lastError,
              timestamp: new Date(),
              delay: retryDelay,
              duration: attemptDuration,
              timedOut: isTimeout,
            });
            
            if (isTimeout) {
              this.logger.warn(`Task ${taskIndex}: Attempt ${attempt}/${maxAttempts} timed out after ${attemptDuration.toFixed(2)}ms`);
            } else {
              this.logger.warn(`Task ${taskIndex}: Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
            }
          } else {
            if (isTimeout) {
              this.logger.error(`Task ${taskIndex}: All ${maxAttempts} attempts failed. Final timeout after ${attemptDuration.toFixed(2)}ms`);
            } else {
              this.logger.error(`Task ${taskIndex}: All ${maxAttempts} attempts failed. Final error: ${lastError.message}`);
            }
          }
        }
      }

      const isTimeout = lastError instanceof TimeoutError;
      
      const failureResult: TaskResult<T> = {
        success: false,
        error: lastError,
        taskIndex,
        attempts: maxAttempts,
        duration: totalDuration,
        timedOut: isTimeout,
      };
      
      if (retryHistory.length > 0) {
        failureResult.retryHistory = retryHistory;
      }
      
      results[taskIndex] = failureResult;
    };

    while (currentIndex < tasks.length || executing.size > 0) {
      while (executing.size < this.options.concurrency && currentIndex < tasks.length) {
        const taskPromise = executeTaskWithRetry(currentIndex);
        executing.add(taskPromise);
        
        taskPromise.finally(() => {
          executing.delete(taskPromise);
        });
        
        currentIndex++;
      }

      if (executing.size > 0) {
        await Promise.race(executing);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalRetries = results.reduce((sum, r) => sum + (r.attempts - 1), 0);
    
    this.logger.info(`Task execution completed: ${successCount} successful, ${failureCount} failed, ${totalRetries} total retries`);

    return results;
  }

  async runWithSummary<T>(tasks: AsyncTask<T>[]): Promise<TaskExecutionSummary<T>> {
    if (tasks.length === 0) {
      const now = new Date();
      return generateExecutionSummary([], now, now);
    }

    const startTime = new Date();
    const results = await this.run(tasks);
    const endTime = new Date();

    return generateExecutionSummary(results, startTime, endTime);
  }
}