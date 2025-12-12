// src/WorkerPool.ts

import { Worker } from 'node:worker_threads';
import * as os from 'os';
import * as path from 'path';
import { logger } from './logger.js';
import { BaseWorkerTask, WorkerResult, WorkerTaskWrapper, WorkerStats } from './types.js';

// Use a number slightly less than the CPU count for overhead, or a fixed number for predictability
const NUM_WORKERS = Math.max(2, os.cpus().length - 1); 

class WorkerPool {
    private workers: Worker[] = [];
    private freeWorkers: Worker[] = [];
    private taskQueue: WorkerTaskWrapper[] = [];
    
    // Map tasks currently being processed to their Promise resolvers
    private activeTasks: Map<number, TaskResolver> = new Map();
    private nextTaskId: number = 0;

    constructor() {
        logger.info(`[POOL] Initializing Worker Pool with ${NUM_WORKERS} threads...`);
        for (let i = 0; i < NUM_WORKERS; i++) {
            this.createWorker(i);
        }
    }

    private createWorker(id: number): void {
        // Path to the worker script (ExecutionWorker.ts, compiled to .js)
        const workerPath = path.resolve(__dirname, 'ExecutionWorker.js'); 
        const worker = new Worker(workerPath, {
            workerData: { id: id },
        });

        worker.on('message', (result: { result: WorkerResult | null }) => {
            // Find the resolver for the completed task
            const taskId = this.findTaskIdByWorker(worker);
            if (taskId !== undefined) {
                const resolver = this.activeTasks.get(taskId);
                if (resolver) {
                    resolver(result.result);
                    this.activeTasks.delete(taskId);
                }
                
                // Task finished, put worker back in pool and check for new tasks
                this.freeWorkers.push(worker);
                this.processQueue();
            }
        });

        worker.on('error', (err) => {
            logger.error(`[WORKER:${id}] Thread Error:`, err);
            // In a real bot, we'd find the associated task and reject its promise, 
            // then remove and replace the failed worker.
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                logger.error(`[WORKER:${id}] Worker stopped with exit code ${code}. Replacing...`);
            }
            // Remove the worker from all lists
            this.workers = this.workers.filter(w => w !== worker);
            this.freeWorkers = this.freeWorkers.filter(w => w !== worker);
            this.createWorker(id); // Respawn the worker
        });

        this.workers.push(worker);
        this.freeWorkers.push(worker);
    }
    
    private findTaskIdByWorker(worker: Worker): number | undefined {
        // Simple way to track which task is running on which worker (for this example)
        for (const [taskId, resolver] of this.activeTasks.entries()) {
            // NOTE: In a cleaner implementation, worker.postMessage() would include the taskId 
            // and the worker would send it back in the response.
            // Since we can't directly inspect the worker's current task, we assume the worker 
            // is executing the task whose promise resolver is active.
            // For this mock, we'll use a simple sequential ID assignment.
            return Array.from(this.activeTasks.keys())[0]; // Simplification
        }
    }

    private processQueue(): void {
        while (this.taskQueue.length > 0 && this.freeWorkers.length > 0) {
            const worker = this.freeWorkers.pop();
            const taskWrapper = this.taskQueue.shift();

            if (worker && taskWrapper) {
                const taskId = this.nextTaskId++;
                this.activeTasks.set(taskId, taskWrapper.resolve);
                
                // Send the task data to the worker thread
                worker.postMessage({ type: 'task', data: taskWrapper.task });
            }
        }
    }

    public getStats(): WorkerStats {
        return {
            totalWorkers: this.workers.length,
            busyWorkers: this.workers.length - this.freeWorkers.length,
            idleWorkers: this.freeWorkers.length,
            pendingTasks: this.taskQueue.length,
            activeTasks: this.activeTasks.size,
        };
    }

    /**
     * Executes a strategy task on the worker pool.
     */
    public executeTask(task: BaseWorkerTask): Promise<WorkerResult | null> {
        return new Promise((resolve) => {
            const taskWrapper: WorkerTaskWrapper = { task, resolve };
            this.taskQueue.push(taskWrapper);
            this.processQueue(); // Attempt to start the task immediately
        });
    }

    public terminate(): Promise<void[]> {
        logger.warn("[POOL] Terminating all worker threads...");
        return Promise.all(this.workers.map(worker => worker.terminate()));
    }
}

const pool = new WorkerPool();
setInterval(() => {
    const stats = pool.getStats();
    logger.debug(`[POOL STATS] Busy: ${stats.busyWorkers}, Idle: ${stats.idleWorkers}, Pending: ${stats.pendingTasks}`);
}, 10000);

/**
 * Public function to submit a task to the pool.
 * @param task The MEV strategy task data.
 * @returns A promise resolving to the WorkerResult or null.
 */
export function executeStrategyTask(task: BaseWorkerTask): Promise<WorkerResult | null> {
    return pool.executeTask(task);
}
