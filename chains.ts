// src/config/chains.ts

interface ChainConfig {
    chainId: number;
    name: string;
    httpUrl: string;
    wssUrl: string;
    // Used for all relays: Flashbots, MEV-Boost, Jito Block Engine
    flashbotsUrl: string; 
}

export const CHAINS: ChainConfig[] = [
    {
        chainId: 1, // Ethereum Mainnet (L1)
        name: 'Ethereum',
        httpUrl: process.env.ETH_HTTP_RPC_URL || 'http://placeholder.local',
        wssUrl: process.env.ETH_WSS_URL || 'ws://placeholder.local',
        flashbotsUrl: process.env.FLASHBOTS_URL || 'https://relay.flashbots.net',
    },
    {
        chainId: 137, // Polygon Mainnet
        name: 'Polygon',
        httpUrl: process.env.POLYGON_HTTP_RPC_URL || 'http://placeholder.local',
        wssUrl: process.env.POLYGON_WSS_URL || 'ws://placeholder.local',
        flashbotsUrl: process.env.POLYGON_RELAY_URL || 'https://example-polygon-relay.net', 
    },
    {
        chainId: 42161, // Arbitrum One Mainnet (L2)
        name: 'Arbitrum',
        httpUrl: process.env.ARBITRUM_RPC_URL || 'http://placeholder.local',
        wssUrl: process.env.ARBITRUM_WSS_URL || 'ws://placeholder.local',
        flashbotsUrl: process.env.ARBITRUM_RELAY_URL || 'https://arbitrum-relay-placeholder.net', 
    },
    {
        chainId: 10, // Optimism Mainnet (L2)
        name: 'Optimism',
        httpUrl: process.env.OPTIMISM_RPC_URL || 'http://placeholder.local',
        wssUrl: process.env.OPTIMISM_WSS_URL || 'ws://placeholder.local',
        flashbotsUrl: process.env.OPTIMISM_RELAY_URL || 'https://optimism-relay-placeholder.net', 
    },
    {
        chainId: 900, // Solana Placeholder ID
        name: 'Solana',
        httpUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        wssUrl: process.env.SOLANA_WSS_URL || 'wss://api.mainnet-beta.solana.com',
        flashbotsUrl: process.env.JITO_BLOCK_ENGINE_URL || 'mainnet.block-engine.jito.wtf', 
    },
];

export { ChainConfig }; // Export the interface for use in other modules
