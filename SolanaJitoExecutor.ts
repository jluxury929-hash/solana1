// src/SolanaJitoExecutor.ts

import {
    Connection,
    Keypair,
    PublicKey,
    VersionedTransaction,
} from '@solana/web3.js';
import {
    // FIX: TS2305 - Correct import pattern for Bundle, SearcherClient, BASE_TIP_ADDRESS
    bundle as Bundle, 
    SearcherClient, 
    BASE_TIP_ADDRESS, 
} from '@jito-labs/jito-ts';
import { logger } from './logger'; // FIX: Removed .js extension
import { ChainConfig } from './config/chains'; // FIX: Removed .js extension
import { BlockEngineService } from '@jito-labs/jito-ts/dist/sdk/block-engine/block-engine.service'; // Added for type reference (Optional)

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
        
        // FIX: TS2351 - Correct object pattern constructor call for SearcherClient
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

            // Example of how to monitor the bundle result
            this.searcherClient.onBundleResult((result: any) => { 
                if (result.bundleId === bundleId) {
                    if (result.accepted) {
                        logger.info(`[JITO SUCCESS] Bundle included in slot: ${result.accepted.slot}`);
                    } else if (result.rejected) {
                        logger.warn(`[JITO REJECTED] Bundle rejected. Reason: ${result.rejected.reason}`);
                    }
                    // Disconnect or stop monitoring if necessary after result
                    // Note: In a real bot, you might keep the connection open.
                }
            });

        } catch (error) {
            logger.error(`[JITO] Bundle submission error.`, error);
        }
    }
    
    // Example utility function (optional)
    public getSearcherClient(): SearcherClient {
        return this.searcherClient;
    }
}
