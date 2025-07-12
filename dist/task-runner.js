export class TaskRunner {
    constructor(options) {
        this.options = {
            concurrency: Math.max(1, options.concurrency || 1),
        };
    }
    async run(tasks) {
        if (tasks.length === 0) {
            return [];
        }
        const results = new Array(tasks.length);
        const executing = new Set();
        let currentIndex = 0;
        const executeTask = async (taskIndex) => {
            try {
                const result = await tasks[taskIndex]();
                results[taskIndex] = {
                    success: true,
                    result,
                    taskIndex,
                };
            }
            catch (error) {
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
//# sourceMappingURL=task-runner.js.map