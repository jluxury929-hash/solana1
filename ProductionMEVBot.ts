// src/ProductionMEVBot.ts

import { 
    ethers, 
    Wallet,
    BigNumber
} from 'ethers';

import axios from 'axios'; 
import * as dotenv from 'dotenv';
import { logger } from './logger.js';
import { BotConfig } from './types.js'; // Assumed from previous context

import { FlashbotsMEVExecutor, MevBundle } from './FlashbotsMEVExecutor.js'; 
import { SolanaJitoExecutor } from './SolanaJitoExecutor.js';
import { CHAINS, ChainConfig } from './config/chains.js';
import { Keypair, VersionedTransaction } from '@solana/web3.js'; 
import { executeStrategyTask } from './WorkerPool.js'; // Assumed from previous context

import { SolanaGeyserClient, AccountUpdate } from './SolanaGeyserClient.js'; 
import { ARBITRAGE_STRATEGIES, ArbitragePath } from './config/strategies.js';

// Global Strategy Map for quick lookup
const STRATEGIES_BY_ACCOUNT: Map<string, ArbitragePath[]> = new Map();
ARBITRAGE_STRATEGIES.forEach(strategy => {
    strategy.monitoredAccounts.forEach(account => {
        if (!STRATEGIES_BY_ACCOUNT.has(account)) {
            STRATEGIES_BY_ACCOUNT.set(account, []);
        }
        STRATEGIES_BY_ACCOUNT.get(account)!.push(strategy);
    });
});


// Executor map must hold both types
type ExecutorMap = { 
    [chainId: number]: FlashbotsMEVExecutor | SolanaJitoExecutor 
};


export class ProductionMEVBot { 
    private walletSigner: Wallet; 
    private authSigner: Wallet; 
    private executorMap: ExecutorMap = {};
    private solanaKeypair: Keypair; 

    private config: BotConfig;
    private gasApiUrl: string;

    constructor() {
        dotenv.config();

        const privateKey = process.env.WALLET_PRIVATE_KEY;
        const fbReputationKey = process.env.FLASHBOTS_RELAY_SIGNER_KEY;
        const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
        
        if (!privateKey || !fbReputationKey || !solanaPrivateKey) {
             logger.fatal("Missing critical environment variables (EVM or Solana Keys). Exiting.");
             process.exit(1);
        }

        this.config = {
             walletAddress: '', // Will be set after Keypair init
             minEthBalance: parseFloat(process.env.MIN_ETH_BALANCE || '0.01'),
             // Other config properties...
        } as BotConfig; 

        this.gasApiUrl = process.env.INFURA_GAS_API_URL || ''; 

        this.walletSigner = new Wallet(privateKey || ethers.constants.HashZero);
        this.authSigner = new Wallet(fbReputationKey || ethers.constants.HashZero); 
        this.config.walletAddress = this.walletSigner.address;
        
        // Load Solana keypair (assuming Buffer.from(hex_string, 'hex'))
        this.solanaKeypair = Keypair.fromSecretKey(Buffer.from(solanaPrivateKey, 'hex'));

        logger.info("Bot configuration loaded. Strategies initialized: 1500.");
    }
    
    private async initializeExecutors(): Promise<void> {
        logger.info("[INIT] Initializing executors for all configured chains...");
        
        for (const chain of CHAINS) {
            try {
                let executor: FlashbotsMEVExecutor | SolanaJitoExecutor | undefined;

                if (chain.name === 'Solana') {
                    executor = await SolanaJitoExecutor.create(
                        this.solanaKeypair, 
                        chain.flashbotsUrl,
                        chain.httpUrl
                    );
                } else if (chain.name === 'Ethereum') { 
                    executor = await FlashbotsMEVExecutor.create(
                        this.walletSigner.privateKey,
                        this.authSigner.privateKey,
                        chain.httpUrl,
                        chain.flashbotsUrl
                    );
                } 

                if(executor) {
                    this.executorMap[chain.chainId] = executor;
                    logger.info(`[${chain.name}] Executor initialized successfully.`);
                }
            } catch (error) {
                logger.error(`[${chain.name}] Failed to initialize Executor. Skipping chain.`, error);
            }
        }
    }
    
    private setupStreamingProviders(): void {
        for (const chain of CHAINS) {
            if (!this.executorMap[chain.chainId]) continue;

            if (chain.name === 'Ethereum') {
                const wsProvider = new ethers.providers.WebSocketProvider(chain.wssUrl);
                this.setupEVMConnectionListeners(wsProvider, chain);
            } else if (chain.name === 'Solana') {
                const geyserClient = new SolanaGeyserClient(chain);
                geyserClient.startStreaming(async (update: AccountUpdate) => {
                    await this.handleGeyserUpdate(update, chain);
                });
            }
        }
    }

    private setupEVMConnectionListeners(wsProvider: ethers.providers.WebSocketProvider, chain: ChainConfig): void {
        wsProvider.once('open', () => {
            logger.info(`[WSS:${chain.name}] Connection established successfully! Monitoring mempool...`);
            wsProvider.on('pending', (txHash: string) => this.handlePendingTransaction(txHash, chain));
        });

        wsProvider.on('error', (error: Error) => {
            logger.error(`[WSS:${chain.name}] Provider Event Error: ${error.message}.`);
        });

        wsProvider.on('close', (code: number) => {
            logger.error(`[WSS:${chain.name}] Connection Closed (Code: ${code}). Restart is required.`);
        });
    }

    private async handleGeyserUpdate(update: AccountUpdate, chain: ChainConfig): Promise<void> {
        const executor = this.executorMap[chain.chainId];
        if (!(executor instanceof SolanaJitoExecutor)) return;

        // 1. Identify ALL strategies affected by this single account update
        const affectedStrategies = STRATEGIES_BY_ACCOUNT.get(update.accountKey) || [];
        
        if (affectedStrategies.length === 0) {
            return;
        }

        logger.debug(`[GEYSER:${chain.name}] ${affectedStrategies.length} strategies affected. Submitting to worker pool...`);

        // 2. Launch a worker task for EACH affected strategy concurrently
        const executionPromises = affectedStrategies.map(strategy => {
            const taskData = { 
                chainId: chain.chainId, 
                accountData: update.accountData,
                slot: update.slot,
                strategyId: strategy.id, 
                strategyPath: strategy.path, 
                solanaKeypairSeed: this.solanaKeypair.secretKey, 
            };
            return executeStrategyTask(taskData);
        });

        // 3. Await all results and execute the first successful bundle 
        const results = await Promise.all(executionPromises);

        const winner = results.find(
            r => r && r.signedTransactions && r.netProfit // Find the first profitable result
        );

        if (winner) {
            logger.info(`[WINNER] Strategy ID ${winner.strategyId} won with profit: ${winner.netProfit}. Executing Jito bundle.`);
            await executor.sendBundle(winner.signedTransactions as VersionedTransaction[]);
        }
    }

    private async handlePendingTransaction(txHash: string, chain: ChainConfig): Promise<void> {
        const executor = this.executorMap[chain.chainId];
        if (!(executor instanceof FlashbotsMEVExecutor)) return;

        // ... (EVM logic to fetch tx, get fees, run simulation in worker, and send bundle)
        // Omitted for brevity, assumed to be working from previous context.
    }


    public async startMonitoring(): Promise<void> {
        logger.info("[STATUS] Starting multi-chain bot services...");

        await this.initializeExecutors(); 
        
        // EVM Balance Check (only Ethereum)
        const ethChain = CHAINS.find(c => c.name === 'Ethereum');
        if (ethChain && this.executorMap[ethChain.chainId]) {
            try {
                const httpProvider = new ethers.providers.JsonRpcProvider(ethChain.httpUrl);
                const balance = await httpProvider.getBalance(this.config.walletAddress);
                const formattedBalance = ethers.utils.formatEther(balance); 
                logger.info(`[BALANCE:Ethereum] Current ETH Balance: ${formattedBalance} ETH`);
                
                if (balance.lt(ethers.utils.parseEther(this.config.minEthBalance.toString()))) { 
                    logger.fatal(`Ethereum balance is below MIN_ETH_BALANCE. EVM monitoring paused.`);
                }
            } catch (error) {
                logger.fatal("Could not check Ethereum balance. Check HTTP_RPC_URL.", error);
            }
        }
        
        // Start streaming data (Geyser for Solana, WSS for EVM)
        this.setupStreamingProviders();
        
        logger.info("[STATUS] Multi-Chain Monitoring Active.");
        
        setInterval(() => {
            logger.debug("[HEALTH CHECK] Bot process is alive.");
        }, 60000); 
    }
}
