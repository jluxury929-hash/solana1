// types.ts

// FIX: Added .js extension for local module resolution
import { ChainConfig } from './config/chains.js'; 

/**
 * Configuration for the Solana Bot.
 */
export interface BotConfig {
    walletAddress: string;
    minSolBalance: number;
    jitoBlockEngineUrl: string;
    targetSwapProgramId: string;
}

/**
 * Data passed from the main thread (Mempool Monitor) to the Worker Pool.
 */
export interface EngineTaskData {
    chainId: number;
    txHash: string;
    pendingTx?: { 
        hash: string, 
        data: string | null, 
        to: string | null, 
        from: string | null;
        signature?: string;
    };
    fees?: { 
        maxFeePerGas: string, 
        maxPriorityFeePerGas: string 
    };
    targetSwapProgramId?: string; 
}

/**
 * Result returned from the Worker Pool after a strategy has been executed/simulated.
 */
export interface EngineResult {
    netProfit: string;
    strategyId: string;
    signedTransaction?: string; 
    signedTransactions?: any[]; 
    tipLamports?: number; 
    error?: string; 
}
