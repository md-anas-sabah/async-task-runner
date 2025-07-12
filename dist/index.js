import { TaskRunner } from './task-runner.js';
export async function runTasks(tasks, config = {}) {
    const { concurrency = 3 } = config;
    const runner = new TaskRunner({ concurrency });
    return runner.run(tasks);
}
export { TaskRunner };
//# sourceMappingURL=index.js.map