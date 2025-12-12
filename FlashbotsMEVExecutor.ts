// src/FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet } from 'ethers';
import { TransactionRequest } from '@ethersproject/abstract-provider'; 
import { logger } from './logger'; // CHANGE: Removed .js extension
import { ChainConfig } from './config/chains'; // CHANGE: Removed .js extension

// ... (constructor and create method omitted for brevity)

    async sendBundle(
        signedTxs: string[], 
        blockNumber: number
    ): Promise<void> {
        // ...
        try {
            const submission = await this.flashbotsProvider.sendRawBundle(
                signedTxs, 
                blockNumber
            );
            
            // FIX: Correct usage of the wait method (TS2339)
            const resolution = await submission.wait(); 

            // ... (rest of the logic)
        } catch (error) {
            // ...
        }
    }
}
