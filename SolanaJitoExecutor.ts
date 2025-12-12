// SolanaJitoExecutor.ts (Fixing Jito Conflicts)

import {
    Connection,
    Keypair,
    PublicKey,
    VersionedTransaction,
} from '@solana/web3.js';
import {
    // FIX: Using 'bundle as Bundle' to bypass TS2724
    bundle as Bundle, 
    // Reverting to standard named imports for the remaining exports
    SearcherClient, 
    BASE_TIP_ADDRESS, 
} from '@jito-labs/jito-ts';
import { logger } from './logger.js';
import { ChainConfig } from './config/chains.js'; 

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

    static async create(
        walletKeypair: Keypair, 
        jitoRelayUrl: string,
        solanaRpcUrl: string
    ): Promise<SolanaJitoExecutor> {
        const connection = new Connection(solanaRpcUrl, 'confirmed');
        
        // Using the explicit constructor pattern for SearcherClient
        const searcherClient = new SearcherClient({ 
            privateKey: walletKeypair.secretKey, 
            baseEngineUrl: jitoRelayUrl 
        });

        return new SolanaJitoExecutor(connection, walletKeypair, searcherClient);
    }

    async sendBundle(
        transactions: VersionedTransaction[], 
    ): Promise<void> {
        logger.info(`[JITO] Submitting bundle with ${transactions.length} transactions...`);

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
