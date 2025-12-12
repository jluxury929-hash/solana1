// src/ProductionMEVBot.ts (Key changes)

import { ethers, Wallet, providers, BigNumber } from 'ethers';
import { FlashbotsMEVExecutor } from './FlashbotsMEVExecutor.js';
import { executeStrategyTask } from './WorkerPool.js'; 
import { CHAINS, ChainConfig } from './config/chains.js';
import { logger } from './logger.js'; 
import { Keypair, VersionedTransaction } from '@solana/web3.js'; 
import { SolanaJitoExecutor } from './SolanaJitoExecutor.js';

// Executor map must hold both types
type ExecutorMap = { 
    [chainId: number]: FlashbotsMEVExecutor | SolanaJitoExecutor 
};

// Assuming logger.ts now includes a 'fatal' method (see logger.ts fix below)
// ...

export class ProductionMEVBot { 
    private executorMap: ExecutorMap = {}; 
    private walletSigner: Wallet;
    private authSigner: Wallet;
    private monitoringProviders: providers.WebSocketProvider[] = [];

    constructor() {
        const privateKey = process.env.PRIVATE_KEY;
        const fbReputationKey = process.env.FB_REPUTATION_KEY;

        if (!privateKey || !fbReputationKey) {
             logger.fatal("Missing PRIVATE_KEY or FB_REPUTATION_KEY."); 
             process.exit(1);
        }

        this.walletSigner = new Wallet(privateKey);
        this.authSigner = new Wallet(fbReputationKey); 
    }

    private getSolanaKeypair(): Keypair {
        const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!solanaPrivateKey) {
            logger.fatal("Missing SOLANA_PRIVATE_KEY for Solana chain.");
            process.exit(1);
        }
        // Assumes SOLANA_PRIVATE_KEY is the 64-byte secret key in hex format
        // Fix for TS2769 and proper Keypair instantiation from a secret key
        return Keypair.fromSecretKey(Buffer.from(solanaPrivateKey, 'hex'));
    }

    private async initializeExecutors(): Promise<void> {
        logger.info("[INIT] Initializing executors for all configured chains...");
        
        let solanaKeypair: Keypair | undefined;
        try {
            solanaKeypair = this.getSolanaKeypair();
        } catch (e) {
            logger.warn("Could not load Solana keypair. Solana chain execution will be skipped.");
        }
        
        for (const chain of CHAINS) {
            try {
                let executor: FlashbotsMEVExecutor | SolanaJitoExecutor | undefined;

                if (chain.name === 'Solana' && solanaKeypair) {
                    executor = await SolanaJitoExecutor.create(
                        solanaKeypair,
                        chain.flashbotsUrl,
                        chain.httpUrl
                    );
                } else if (chain.chainId !== 900) { 
                    // EVM Chains: ETH, Polygon, Arbitrum, Optimism, etc.
                    executor = await FlashbotsMEVExecutor.create(
                        this.walletSigner.privateKey,
                        this.authSigner.privateKey,
                        chain.httpUrl,
                        chain.flashbotsUrl
                    );
                } else {
                    logger.warn(`Skipping chain ${chain.name} due to unsupported type or missing keypair.`);
                    continue;
                }

                this.executorMap[chain.chainId] = executor;
                logger.info(`[${chain.name}] Executor initialized successfully.`);
            } catch (error) {
                logger.error(`[${chain.name}] Failed to initialize Executor. Skipping chain.`, error);
            }
        }
    }

    private initializeMonitoring(): void {
        logger.info("[INIT] Initializing parallel mempool monitoring...");
        for (const chain of CHAINS) {
            if (!chain.wssUrl) continue;
            this.setupWsProvider(chain);
        }
    }

    private setupWsProvider(chain: ChainConfig): void { 
        // Logic to setup WSS connection for a specific chain
        // Fixes TS7006 by using ChainConfig
        // ...
    }

    private async handlePendingTransaction(txHash: string, chain: ChainConfig): Promise<void> { 
        // Fixes TS7006 by using ChainConfig
        const executor = this.executorMap[chain.chainId];
        if (!executor) return; 

        if (chain.name === 'Solana') {
            // Solana monitoring logic
            const taskData = { 
                chainId: chain.chainId, 
                txHash, 
                // ... other Solana-specific data ...
            };

            const simulationResult = await executeStrategyTask(taskData);
            
            if (simulationResult && simulationResult.signedTransactions) {
                // Cast executor to SolanaJitoExecutor for its specific method
                await (executor as SolanaJitoExecutor).sendBundle(
                    simulationResult.signedTransactions as VersionedTransaction[]
                );
            }
        } else { // EVM chains (Ethereum, Polygon, L2s)
            // EVM monitoring logic
            const httpProvider = new ethers.providers.JsonRpcProvider(chain.httpUrl);
            const pendingTx = await httpProvider.getTransaction(txHash);

            const taskData = { 
                chainId: chain.chainId, 
                txHash, 
                pendingTx: { hash: pendingTx!.hash, data: pendingTx!.data, to: pendingTx!.to, from: pendingTx!.from }, 
                fees: { maxFeePerGas: "0", maxPriorityFeePerGas: "0" }
            };

            const simulationResult = await executeStrategyTask(taskData);

            if (simulationResult && simulationResult.signedTransaction) {
                const bundle = [ { signedTransaction: simulationResult.signedTransaction }, { hash: pendingTx!.hash } ];
                // Cast executor to FlashbotsMEVExecutor for its specific method
                await (executor as FlashbotsMEVExecutor).sendBundle(bundle as any, await httpProvider.getBlockNumber() + 1);
            }
        }
    }

    public async startMonitoring(): Promise<void> {
        await this.initializeExecutors(); 
        
        if (Object.keys(this.executorMap).length === 0) {
            logger.fatal("No Executors initialized. Cannot start monitoring.");
            return;
        }

        this.initializeMonitoring();

        // Check balances for all active chains
        // ... (Balance checking logic remains)
        
        logger.info("[STATUS] Cross-chain monitoring fully active.");
    }
}
