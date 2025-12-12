// src/SolanaGeyserClient.ts

import { logger } from './logger.js';
import { ChainConfig } from './config/chains.js';
import { ARBITRAGE_STRATEGIES } from './config/strategies.js';

export interface AccountUpdate {
    accountKey: string;
    slot: number;
    accountData: string; 
}

export type GeyserCallback = (update: AccountUpdate) => Promise<void>;

const MONITORED_ACCOUNTS: Set<string> = new Set(
    ARBITRAGE_STRATEGIES.flatMap(s => s.monitoredAccounts)
);


export class SolanaGeyserClient {
    private isConnected: boolean = false;
    private connectionAttempts: number = 0;

    constructor(private chain: ChainConfig) {}

    public startStreaming(callback: GeyserCallback): void {
        const { flashbotsUrl, name } = this.chain;

        logger.info(`[GEYSER:${name}] Connecting to high-speed gRPC stream at ${flashbotsUrl}...`);
        this.isConnected = true;
        this.connectionAttempts = 0;

        // MOCK: Simulate aggressive, high-frequency Geyser updates for peak TPS
        const updateInterval = setInterval(async () => {
            if (!this.isConnected) {
                clearInterval(updateInterval);
                return;
            }

            // Simulate bursts of relevant updates hitting the node
            for (let i = 0; i < 500; i++) {
                const randomIndex = Math.floor(Math.random() * MONITORED_ACCOUNTS.size);
                const accountKey = Array.from(MONITORED_ACCOUNTS)[randomIndex];

                const mockUpdate: AccountUpdate = {
                    accountKey: accountKey,
                    slot: Math.floor(Date.now() / 400),
                    accountData: `Data_${Date.now()}_${Math.random()}`,
                };
                
                if (MONITORED_ACCOUNTS.has(mockUpdate.accountKey)) {
                     try {
                        await callback(mockUpdate); 
                    } catch (error) {
                        logger.error(`[GEYSER:${name}] Error processing stream update.`, error);
                    }
                }
            }
        }, 1); // 1ms interval, simulating continuous, high-volume data ingestion

        logger.info(`[GEYSER:${name}] Stream connection mock established. Starting data flow to ${MONITORED_ACCOUNTS.size} accounts.`);
    }

    public stopStreaming(): void {
        this.isConnected = false;
        logger.info(`[GEYSER] Stream stopped.`);
    }
}
