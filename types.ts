// src/types.ts
import { VersionedTransaction } from '@solana/web3.js';
import { ArbitragePath } from './config/strategies.js';

// --- General Bot Configuration ---

export interface BotConfig {
    walletAddress: string;
    minEthBalance: number;
    // ... add other general config like maxGasPrice, maxTip
}


// --- Worker Task Data Types ---

// Base interface for task data sent to the worker pool
export interface BaseWorkerTask {
    chainId: number;
    accountData: string;
    solanaKeypairSeed: Uint8Array;
    strategyId: number;
    strategyPath: string[];
    slot: number;
}

// Interface for the structured result returned by the worker
export interface WorkerResult {
    netProfit: string; // The calculated profit
    strategyId: number; 
    // This is the signed bundle/transaction array, built by Rust/EVM logic
    signedTransactions: VersionedTransaction[]; 
}


// --- Worker Pool Management Types ---

// A Promise resolver function
export type TaskResolver = (result: WorkerResult | null) => void;

// A wrapper for a task and its promise resolver
export interface WorkerTaskWrapper {
    task: BaseWorkerTask;
    resolve: TaskResolver;
}

// Interface for worker thread statistics
export interface WorkerStats {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    pendingTasks: number;
    activeTasks: number;
}
