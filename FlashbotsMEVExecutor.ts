// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { providers, Wallet } from 'ethers';
// Imports type for TransactionRequest
import { TransactionRequest } from '@ethersproject/abstract-provider'; 
import { logger } from './logger.js';
import { ChainConfig } from './config/chains.js'; // FIX: Explicit .js extension (TS2307)

export class FlashbotsMEVExecutor {
    private provider: providers.JsonRpcProvider;
    private walletSigner: Wallet;
    private flashbotsProvider: FlashbotsBundleProvider;

    private constructor(/* ... */) {
        // ...
    }

    static async create(/* ... */): Promise<FlashbotsMEVExecutor> {
        // ...
        return new FlashbotsMEVExecutor(provider, walletSigner, flashbotsProvider);
    }

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
            
            // FIX for TS2339: Correct usage of the wait method on the submission object
            const resolution = await submission.wait(); 

            if (resolution === FlashbotsBundleResolution.BundleIncluded) {
                // ...
            } else if (resolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
                // ...
            }
        } catch (error) {
            // ...
        }
    }
}
