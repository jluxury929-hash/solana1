// index.ts

import { ProductionMEVBot } from './src/ProductionMEVBot.js';
import { logger } from './src/logger.js';

async function main() {
    logger.info("==================================================");
    logger.info("   🚀 High-Performance Multi-Chain MEV Bot (v1.0)");
    logger.info("==================================================");

    try {
        const bot = new ProductionMEVBot();
        await bot.startMonitoring();
    } catch (error) {
        logger.fatal("FATAL APPLICATION CRASH:", error);
        process.exit(1);
    }
}

main();

// Handle graceful shutdown signals
process.on('SIGINT', () => {
    logger.warn('Received SIGINT. Shutting down gracefully...');
    // In a real application, you would terminate the WorkerPool here:
    // pool.terminate().finally(() => process.exit(0)); 
    process.exit(0);
});
