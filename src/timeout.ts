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

export async function withTimeout<T>(
  task: () => Promise<T>,
  timeoutMs: number
): Promise<TimeoutOutcome<T>> {
  const startTime = performance.now();
  
  let abortController: AbortController | undefined;
  let timeoutId: NodeJS.Timeout | undefined;
  
  try {
    if (typeof AbortController !== 'undefined') {
      abortController = new AbortController();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const duration = performance.now() - startTime;
          abortController?.abort();
          reject(new TimeoutError(`Task timed out after ${duration.toFixed(2)}ms`, duration));
        }, timeoutMs);
      });
      
      const taskPromise = task();
      const result = await Promise.race([taskPromise, timeoutPromise]);
      
      const duration = performance.now() - startTime;
      return {
        result,
        duration,
        timedOut: false
      };
      
    } else {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const duration = performance.now() - startTime;
          reject(new TimeoutError(`Task timed out after ${duration.toFixed(2)}ms`, duration));
        }, timeoutMs);
      });
      
      const taskPromise = task();
      const result = await Promise.race([taskPromise, timeoutPromise]);
      
      const duration = performance.now() - startTime;
      return {
        result,
        duration,
        timedOut: false
      };
    }
    
  } catch (error) {
    const duration = performance.now() - startTime;
    
    if (error instanceof TimeoutError) {
      return {
        error,
        duration,
        timedOut: true
      };
    }
    
    throw error;
    
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function createAbortableTask<T>(
  originalTask: () => Promise<T>,
  signal?: AbortSignal
): () => Promise<T> {
  return async () => {
    if (signal?.aborted) {
      throw new Error('Task was aborted before execution');
    }
    
    const taskPromise = originalTask();
    
    if (!signal) {
      return taskPromise;
    }
    
    return new Promise<T>((resolve, reject) => {
      const abortHandler = () => {
        reject(new Error('Task was aborted'));
      };
      
      signal.addEventListener('abort', abortHandler, { once: true });
      
      taskPromise
        .then(resolve)
        .catch(reject)
        .finally(() => {
          signal.removeEventListener('abort', abortHandler);
        });
    });
  };
}