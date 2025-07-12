import { TaskRunner } from './task-runner.js';
import { AsyncTask, TaskConfig, TaskResult } from './types.js';

export async function runTasks<T>(
  tasks: AsyncTask<T>[],
  config: TaskConfig = {}
): Promise<TaskResult<T>[]> {
  const { concurrency = 3 } = config;
  
  const runner = new TaskRunner({ concurrency });
  return runner.run(tasks);
}

export { TaskRunner };
export type { AsyncTask, TaskConfig, TaskResult, TaskRunnerOptions } from './types.js';