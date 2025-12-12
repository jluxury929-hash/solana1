// src/config/chains.ts

export interface ChainConfig {
    chainId: number;
    name: string;
    httpUrl: string;
    wssUrl: string;
    flashbotsUrl: string; 
}

export const CHAINS: ChainConfig[] = [
    {
        chainId: 1, // Ethereum Mainnet
        name: 'Ethereum',
        httpUrl: process.env.ETHEREUM_RPC_1 || 'http://placeholder.local',
        wssUrl: process.env.ETHEREUM_WSS || 'ws://placeholder.local',
        flashbotsUrl: process.env.FLASHBOTS_RELAY || 'https://relay.flashbots.net', 
    },
    {
        chainId: 900, 
        name: 'Solana',
        httpUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        wssUrl: process.env.SOLANA_WSS_URL || 'wss://api.mainnet-beta.solana.com',
        flashbotsUrl: process.env.JITO_BLOCK_ENGINE_URL || 'mainnet.block-engine.jito.wtf', 
    },
];
