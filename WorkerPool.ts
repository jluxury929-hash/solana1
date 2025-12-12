// src/types.ts

// Assuming these files exist in your config directory
import { ChainConfig } from './config/chains.js'; 
// Assuming a Strategy type exists for defining how to execute trades
// import { Strategy } from './config/strategies.js'; 

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
        from: string | null 
    };
    // EVM fee details
    fees?: { 
        maxFeePerGas: string, 
        maxPriorityFeePerGas: string 
    };
    // Add other necessary fields (e.g., Solana account data, market data)
}

/**
 * Result returned from the Worker Pool after a strategy has been executed/simulated.
 */
export interface EngineResult {
    netProfit: string;
    strategyId: string;
    // EVM: Signed raw transaction for the bundle
    signedTransaction?: string; 
    // Solana: Array of signed VersionedTransactions for the Jito Bundle
    signedTransactions?: any[]; 
    tipLamports?: number; // Solana tip amount
    error?: string; // For failed attempts
}

// Export the types needed by StrategyEngine.ts and others
export { EngineTaskData, EngineResult };
