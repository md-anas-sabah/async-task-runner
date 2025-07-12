import { EventEmitter } from 'events';
import { AsyncTask, TaskResult, TaskMetadata, PriorityTask, AdvancedTaskOptions, QueueStatus, TaskQueue } from './types.js';
export declare class AdvancedTaskRunner extends EventEmitter implements TaskQueue {
    protected tasks: Array<{
        task: AsyncTask;
        metadata: TaskMetadata;
        priority: number;
    }>;
    private running;
    private completed;
    private failed;
    protected isPaused: boolean;
    protected isStopped: boolean;
    protected options: AdvancedTaskOptions;
    private baseRunner;
    constructor(options?: AdvancedTaskOptions);
    add(taskOrPriority: AsyncTask | PriorityTask, metadata?: TaskMetadata): void;
    run(): Promise<TaskResult[]>;
    protected runBatched(): Promise<TaskResult[]>;
    protected runAll(): Promise<TaskResult[]>;
    pause(): void;
    resume(): void;
    stop(): void;
    clear(): void;
    status(): QueueStatus;
    groupTasksByBatch(): Map<string, Array<{
        task: AsyncTask;
        metadata: TaskMetadata;
    }>>;
    runBatchById(batchId: string): Promise<TaskResult[]>;
    getTasksByPriority(): Array<{
        priority: number;
        tasks: Array<{
            task: AsyncTask;
            metadata: TaskMetadata;
        }>;
    }>;
    getStatistics(): {
        total: number;
        completed: number;
        failed: number;
        running: number;
        pending: number;
        successRate: number;
        averageDuration: number;
    };
}
export declare class TaskBatch {
    readonly id: string;
    private tasks;
    constructor(id: string);
    add(task: AsyncTask, metadata?: TaskMetadata): void;
    getTasks(): Array<{
        task: AsyncTask;
        metadata: TaskMetadata;
    }>;
    size(): number;
    clear(): void;
}
export declare class PriorityTaskQueue {
    private tasks;
    add(task: AsyncTask, priority: number, metadata?: TaskMetadata): void;
    getNext(): PriorityTask | undefined;
    peek(): PriorityTask | undefined;
    size(): number;
    isEmpty(): boolean;
    clear(): void;
    getByPriority(priority: number): PriorityTask[];
    getPriorities(): number[];
}
export declare class EventDrivenTaskRunner extends AdvancedTaskRunner {
    constructor(options?: AdvancedTaskOptions);
    run(): Promise<TaskResult[]>;
}
//# sourceMappingURL=advanced-task-runner.d.ts.map