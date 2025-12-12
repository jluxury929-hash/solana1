// FlashbotsMEVExecutor.ts

import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
// ethers is imported using standard node resolution; path mapping in tsconfig handles types
import { providers, Wallet, TransactionRequest, BigNumber } from 'ethers'; 
import { logger } from './logger.js';
import { ChainConfig } from './config/chains.js'; // FIX: Added .js extension

export class FlashbotsMEVExecutor {
    private provider: providers.JsonRpcProvider;
    private walletSigner: Wallet;
    private flashbotsProvider: FlashbotsBundleProvider;

    private constructor(
        provider: providers.JsonRpcProvider,
        walletSigner: Wallet,
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
        const provider = new providers.JsonRpcProvider(rpcUrl);
        const walletSigner = new Wallet(walletPrivateKey, provider);
        const authSigner = new Wallet(authPrivateKey);

        const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            authSigner,
            flashbotsUrl
        );

        logger.info(`[EVM] Flashbots provider created for ${rpcUrl}`);
        return new FlashbotsMEVExecutor(provider, walletSigner, flashbotsProvider);
    }

    /**
     * Sends a transaction bundle (array of signed transactions) to the Flashbots relay.
     */
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
            
            logger.info(`[Flashbots] Bundle submitted. Waiting for inclusion...`);

            const resolution = await submission.wait();

            if (resolution === 0) {
                logger.info(`[Flashbots SUCCESS] Bundle included in block ${blockNumber}.`);
            } else if (resolution === 1) {
                logger.warn(`[Flashbots FAIL] Bundle was not included.`);
            } else {
                logger.error(`[Flashbots FAIL] Bundle was canceled or encountered an error.`);
            }

        } catch (error) {
            logger.error(`[Flashbots] Bundle submission error.`, error);
        }
    }
}
