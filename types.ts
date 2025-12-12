// src/types.ts (Updated)

// Ensure all external types used are imported or defined (TS2307)
import { ChainConfig } from './config/chains.js'; 
// Assuming a strategy definition exists:
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
        from: string | null;
        // The property 'signature' does not exist on this type (StrategyEngine.ts(34,74))
        // If your strategy needs a signature, add it here:
        signature?: string; 
    };
    fees?: { 
        maxFeePerGas: string, 
        maxPriorityFeePerGas: string 
    };
    // Added to resolve TS2339 in StrategyEngine.ts
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
    // Removed 'netProfitUSD' to resolve TS2561, as it wasn't in the original interface definition.
}

/**
 * Configuration for the Solana Bot. (TS2305: Missing BotConfig)
 */
export interface BotConfig {
    // Add properties used in SolanaMEVBot.ts to resolve TS2339 errors
    minSolBalance: number;
    jitoBlockEngineUrl: string;
    targetSwapProgramId: string;
    // ... add any other configuration properties used
}

// REMOVED: export { EngineTaskData, EngineResult }; 
// The 'export interface' lines above are sufficient and resolve TS2484.
