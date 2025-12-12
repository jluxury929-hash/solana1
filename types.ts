// src/types.ts

// Assuming this file exists and is correctly defined
import { ChainConfig } from './config/chains.js'; 

/**
 * Configuration for the Solana Bot. (Fixes TS2305 and TS2339 in SolanaMEVBot.ts)
 */
export interface BotConfig {
    walletAddress: string; // <-- Added to resolve TS2339: Property 'walletAddress' does not exist
    minSolBalance: number;
    jitoBlockEngineUrl: string;
    targetSwapProgramId: string;
    // Add other necessary config properties used throughout the bot
}

/**
 * Data passed from the main thread (Mempool Monitor) to the Worker Pool.
 */
export interface EngineTaskData {
    chainId: number;
    txHash: string;
    // EVM transaction details
    pendingTx?: { 
        hash: string, 
        data: string | null, 
        to: string | null, 
        from: string | null;
        signature?: string; // If signature is expected in StrategyEngine
    };
    fees?: { 
        maxFeePerGas: string, 
        maxPriorityFeePerGas: string 
    };
    // Added for Solana strategy execution
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
// Note: We only use 'export interface' and avoid 'export { ... }' to fix TS2484.
