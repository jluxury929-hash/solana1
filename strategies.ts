// config/strategies.ts

export interface Strategy {
    id: string;
    name: string;
    isActive: boolean;
    profitThreshold: number; 
    targetTokenAddress?: string;
}

export const STRATEGIES: Strategy[] = [
    { id: 'S_ARBITRAGE', name: 'Standard Arbitrage', isActive: true, profitThreshold: 0.005 },
    { id: 'S_LIQUIDATION', name: 'Liquidation Attack', isActive: false, profitThreshold: 0.01 },
];
