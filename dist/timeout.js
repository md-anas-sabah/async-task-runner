import { TimeoutError } from './types.js';
export async function withTimeout(task, timeoutMs) {
    const startTime = performance.now();
    let abortController;
    let timeoutId;
    try {
        if (typeof AbortController !== 'undefined') {
            abortController = new AbortController();
            const timeoutPromise = new Promise((_, reject) => {
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
        }
        else {
            const timeoutPromise = new Promise((_, reject) => {
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
    }
    catch (error) {
        const duration = performance.now() - startTime;
        if (error instanceof TimeoutError) {
            return {
                error,
                duration,
                timedOut: true
            };
        }
        throw error;
    }
    finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}
export function createAbortableTask(originalTask, signal) {
    return async () => {
        if (signal?.aborted) {
            throw new Error('Task was aborted before execution');
        }
        const taskPromise = originalTask();
        if (!signal) {
            return taskPromise;
        }
        return new Promise((resolve, reject) => {
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
//# sourceMappingURL=timeout.js.map