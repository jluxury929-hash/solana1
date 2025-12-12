// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
import * as ethers from 'ethers'; // FIX: Using import * as to resolve TS2307 for external package
import { logger } from './logger.js';
import { ChainConfig } from './config/chains.js';

export class FlashbotsMEVExecutor {
    private provider: ethers.providers.JsonRpcProvider;
    private walletSigner: ethers.Wallet;
    private flashbotsProvider: FlashbotsBundleProvider;

    private constructor(
        provider: ethers.providers.JsonRpcProvider,
        walletSigner: ethers.Wallet,
        flashbotsProvider: FlashbotsBundleProvider
    ) {
        this.provider = provider;
        this.walletSigner = walletSigner;
        this.flashbotsProvider = flashbotsProvider;
    }

    static async create(
        walletPrivateKey: string,
        authPrivateKey: string,
        rpcUrl: string,
        flashbotsUrl: string
    ): Promise<FlashbotsMEVExecutor> {
        // FIX: Must use 'ethers.' prefix due to 'import * as ethers'
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl); 
        const walletSigner = new ethers.Wallet(walletPrivateKey, provider);
        const authSigner = new ethers.Wallet(authPrivateKey);

        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            authSigner,
            flashbotsUrl
        );

        logger.info(`[EVM] Flashbots provider created for ${rpcUrl}`);
        return new FlashbotsMEVExecutor(provider, walletSigner, flashbotsProvider);
    }

    async sendBundle(
        signedTxs: string[], 
        blockNumber: number
    ): Promise<void> {
        logger.info(`[Flashbots] Submitting bundle to block ${blockNumber}...`);

        try {
            const submission = await this.flashbotsProvider.sendRawBundle(
                signedTxs, 
                blockNumber
            );
            
            const resolution = await submission.wait();

            if (resolution === 0) {
                logger.info(`[Flashbots SUCCESS] Bundle included in block ${blockNumber}.`);
            } else if (resolution === 1) {
                logger.warn(`[Flashbots FAIL] Bundle was not included.`);
            }
        } catch (error) {
            logger.error(`[Flashbots] Bundle submission error.`, error);
        }
    }
}
