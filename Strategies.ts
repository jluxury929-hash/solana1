// config/strategies.ts

/**
 * Defines the structure for a single MEV strategy configuration.
 * This should hold parameters like profit thresholds, gas limits, etc.
 */
export interface Strategy {
    id: string;
    name: string;
    isActive: boolean;
    profitThreshold: number; // e.g., in ETH or SOL
    // Add other strategy-specific parameters
}

export const STRATEGIES: Strategy[] = [
    { id: 'S_ARBITRAGE', name: 'Standard Arbitrage', isActive: true, profitThreshold: 0.005 },
    { id: 'S_LIQUIDATION', name: 'Liquidation Attack', isActive: false, profitThreshold: 0.01 },
];
