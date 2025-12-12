// src/ExecutionWorker.ts

import { parentPort, workerData } from 'node:worker_threads';
import { ethers, BigNumber } from 'ethers';
import { VersionedTransaction } from '@solana/web3.js'; 
import { callRustSimulationModule } from './RustSimulation.js'; 

parentPort!.on('message', async (message: { type: string, data: any }) => {
    if (message.type === 'task') {
        const { chainId, txHash, pendingTx, fees, accountData, solanaKeypairSeed, strategyId, strategyPath } = message.data;
        
        let simulationResult: any = null;
        
        try {
            if (chainId === 900) { // Solana Strategy
                // Call the high-speed Rust simulation with specific strategy data
                simulationResult = await callRustSimulationModule(
                    accountData, 
                    solanaKeypairSeed,
                    strategyId, 
                    strategyPath
                );

            } else if (chainId === 1) { // EVM Strategy (Legacy/Slower)
                
                // --- EVM Strategy (MOCK) ---
                if (!fees || !pendingTx) return;

                const maxPriorityFeePerGas = BigNumber.from(fees.maxPriorityFeePerGas);
                let profitInWei = ethers.utils.parseEther("0.1"); 
                
                const gasLimit = BigNumber.from(500000);
                const gasCost = maxPriorityFeePerGas.mul(gasLimit); 
                const netProfitWei = profitInWei.sub(gasCost);
                
                if (netProfitWei.gt(ethers.utils.parseEther("0.05"))) {
                    
                    const mockSignedTransaction = `0xSIGNED_TX_FOR_${pendingTx.hash.substring(2, 8)}`; 
                    
                    simulationResult = { 
                        netProfit: netProfitWei.toString(),
                        strategyId: 0, // Placeholder for EVM
                        signedTransaction: mockSignedTransaction, 
                    };
                }
            }
            
        } catch (error) {
            console.error(`[WORKER SIMULATION CRASH] Strategy failed for ${chainId}`, error);
        }

        parentPort!.postMessage({ result: simulationResult });
    }
});
