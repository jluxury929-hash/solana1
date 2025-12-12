// SolanaJitoExecutor.ts

import {
    Connection,
    Keypair,
    PublicKey,
    VersionedTransaction,
} from '@solana/web3.js';
import {
    Bundle, // Corrected Jito Bundle class import
    SearcherClient, // Corrected Jito SearcherClient class import
    BASE_TIP_ADDRESS, // Corrected Jito constant import
} from '@jito-labs/jito-ts';
import { logger } from './logger.js';
import { ChainConfig } from './config/chains.js'; 

// Use a known Jito tip account
const JITO_TIP_ACCOUNT = new PublicKey(BASE_TIP_ADDRESS); 

export class SolanaJitoExecutor {
    private searcherClient: SearcherClient;
    private connection: Connection;
    private feePayer: Keypair;

    constructor(
        connection: Connection, 
        feePayer: Keypair, 
        searcherClient: SearcherClient
    ) {
        this.connection = connection;
        this.feePayer = feePayer;
        this.searcherClient = searcherClient;
    }

    /**
     * Factory method to create an instance with connection initialization.
     */
    static async create(
        walletKeypair: Keypair, 
        jitoRelayUrl: string,
        solanaRpcUrl: string
    ): Promise<SolanaJitoExecutor> {
        const connection = new Connection(solanaRpcUrl, 'confirmed');
        const searcherClient = new SearcherClient(jitoRelayUrl, walletKeypair);

        return new SolanaJitoExecutor(connection, walletKeypair, searcherClient);
    }

    /**
     * Sends a Jito Bundle to the Block Engine.
     * @param transactions - Array of signed VersionedTransaction objects.
     */
    async sendBundle(
        transactions: VersionedTransaction[], 
    ): Promise<void> {
        logger.info(`[JITO] Submitting bundle with ${transactions.length} transactions...`);

        // Use the Bundle constructor from Jito-ts
        const bundle = new Bundle(transactions, JITO_TIP_ACCOUNT); 
        
        try {
            const bundleId = await this.searcherClient.sendBundle(bundle);

            logger.info(`[JITO] Bundle submitted. ID: ${bundleId}. Monitoring...`);

            this.searcherClient.onBundleResult((result: any) => { 
                if (result.bundleId === bundleId) {
                    if (result.accepted) {
                        logger.info(`[JITO SUCCESS] Bundle included in slot: ${result.accepted.slot}`);
                    } else if (result.rejected) {
                        logger.warn(`[JITO REJECTED] Bundle rejected. Reason: ${result.rejected.reason}`);
                    }
                }
            });

        } catch (error) {
            logger.error(`[JITO] Bundle submission error.`, error);
        }
    }
}
