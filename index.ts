// index.ts

import { ProductionMEVBot } from './ProductionMEVBot.js'; 
import { logger } from './logger.js'; 

async function main() {
    logger.info("Starting High-Strategy MEV Bot...");
    
    // Check for required environment variables early
    if (!process.env.PRIVATE_KEY) {
        logger.fatal("PRIVATE_KEY environment variable is missing. Cannot proceed.");
        return;
    }

    try {
        const bot = new ProductionMEVBot();
        await bot.startMonitoring();
    } catch (error) {
        logger.fatal("An unrecoverable error occurred during bot initialization.", error);
    }
}

main().catch(error => {
    logger.fatal("Unhandled exception in main process.", error);
});
