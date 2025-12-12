// config/chains.ts

export interface ChainConfig {
    chainId: number;
    name: string;
    httpUrl: string;
    wssUrl: string;
    flashbotsUrl: string; 
}

export const CHAINS: ChainConfig[] = [
    {
        chainId: 1, 
        name: 'Ethereum',
        httpUrl: process.env.ETH_HTTP_RPC_URL || 'http://placeholder.local',
        wssUrl: process.env.ETH_WSS_URL || 'ws://placeholder.local',
        flashbotsUrl: process.env.FLASHBOTS_URL || 'https://relay.flashbots.net',
    },
    {
        chainId: 900, 
        name: 'Solana',
        httpUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        wssUrl: process.env.SOLANA_WSS_URL || 'wss://api.mainnet-beta.solana.com',
        flashbotsUrl: process.env.JITO_BLOCK_ENGINE_URL || 'mainnet.block-engine.jito.wtf', 
    },
    // Add other chains as needed
];
