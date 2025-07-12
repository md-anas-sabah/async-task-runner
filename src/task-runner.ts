import { AsyncTask, TaskResult, TaskRunnerOptions } from './types.js';

export class TaskRunner {
  private readonly options: TaskRunnerOptions;

  constructor(options: TaskRunnerOptions) {
    this.options = {
      concurrency: Math.max(1, options.concurrency || 1),
    };
  }

  async run<T>(tasks: AsyncTask<T>[]): Promise<TaskResult<T>[]> {
    if (tasks.length === 0) {
      return [];
    }

    const results: TaskResult<T>[] = new Array(tasks.length);
    const executing: Set<Promise<void>> = new Set();
    let currentIndex = 0;

    const executeTask = async (taskIndex: number): Promise<void> => {
      try {
        const result = await tasks[taskIndex]!();
        results[taskIndex] = {
          success: true,
          result,
          taskIndex,
        };
      } catch (error) {
        results[taskIndex] = {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          taskIndex,
        };
      }
    };

    while (currentIndex < tasks.length || executing.size > 0) {
      while (executing.size < this.options.concurrency && currentIndex < tasks.length) {
        const taskPromise = executeTask(currentIndex);
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

    return results;
  }
}