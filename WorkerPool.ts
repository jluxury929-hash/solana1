// src/WorkerPool.ts

import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import * as os from 'os';

// Fix TS2304: Define the necessary types for the task queue
type TaskResolver = (value: unknown) => void;
type TaskRejector = (reason?: any) => void;

const NUM_WORKERS = os.cpus().length;
const workers: Worker[] = [];

const taskQueue: { 
    data: any, 
    resolve: TaskResolver, 
    reject: TaskRejector 
}[] = [];
let nextWorker = 0;

let _executeStrategyTask: (taskData: any) => Promise<any>;

if (isMainThread) {
    for (let i = 0; i < NUM_WORKERS; i++) {
        // Correct path for running compiled code from the project root
        const worker = new Worker('./dist/ExecutionWorker.js', { 
            execArgv: /\/ts-node$/.test(process.argv[0]) ? ['--require', 'ts-node/register'] : undefined, 
            workerData: { workerId: i }
        });

        worker.on('message', (message) => {
            const task = taskQueue.shift();
            if (task) {
                task.resolve(message.result);
            }
        });

        worker.on('error', (error) => {
            const task = taskQueue.shift();
            if (task) {
                task.reject(error);
            }
            console.error(`Worker ${worker.threadId} error:`, error);
        });

        worker.on('exit', (code) => {
            console.error(`Worker ${worker.threadId} exited with code ${code}.`);
        });

        workers.push(worker);
    }
    
    // The promise returns 'any' result from the worker, matching the function signature
    _executeStrategyTask = (taskData: any): Promise<any> => { 
        return new Promise((resolve, reject) => {
            taskQueue.push({ data: taskData, resolve, reject });
            
            const worker = workers[nextWorker];
            worker.postMessage({ type: 'task', data: taskData });
            nextWorker = (nextWorker + 1) % NUM_WORKERS;
        });
    }

} else {
    // ExecutionWorker.ts handles the worker logic
}

export const executeStrategyTask = _executeStrategyTask!;
