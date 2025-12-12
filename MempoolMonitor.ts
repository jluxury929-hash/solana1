// MempoolMonitor.ts

import { logger } from './logger.js';

/**
 * Generic base class for monitoring mempools (EVM) or transaction streams (Solana).
 */
export class MempoolMonitor {
    constructor() {
        logger.debug("MempoolMonitor initialized.");
    }

    public start() {
        logger.info("Starting generic mempool monitor...");
        // This class is typically extended by Chain-specific monitors (e.g., SolanaGeyserClient)
    }

    // Add necessary monitoring methods here
}
