import Fastify from 'fastify';
import { Blockchain } from './core/Blockchain.js';
import { TokenManager } from './core/TokenManager.js';
import { TransferManager } from './core/TransferManager.js';
import { WalletManager } from './wallet/Wallet.js';
import { MiningManager } from './mining/MiningManager.js';

import { blockchainRoutes } from './api/routes/blockchain.js';
import { walletRoutes } from './api/routes/wallet.js';
import { transferRoutes } from './api/routes/transfer.js';
import { miningRoutes } from './api/routes/mining.js';
import { tokenRoutes } from './api/routes/token.js';

const fastify = Fastify({
    logger: true
});

// Initialize blockchain and managers
const blockchain = new Blockchain();
const walletManager = new WalletManager(blockchain);
const tokenManager = new TokenManager(blockchain);
const transferManager = new TransferManager(blockchain, walletManager);
const miningManager = new MiningManager(blockchain, walletManager);

// Make managers available to routes
fastify.decorate('blockchain', blockchain);
fastify.decorate('walletManager', walletManager);
fastify.decorate('tokenManager', tokenManager);
fastify.decorate('transferManager', transferManager);
fastify.decorate('miningManager', miningManager);

// Register CORS plugin
await fastify.register(import('@fastify/cors'), {
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    };
});

// API status endpoint
fastify.get('/', async (request, reply) => {
    const chainInfo = blockchain.getChainInfo();
    const tokenInfo = tokenManager.getTokenInfo();
    const miningStatus = miningManager.getMiningStatus();
    
    return {
        message: 'Chain Cosmos API Server',
        version: '1.0.0',
        status: 'running',
        blockchain: chainInfo,
        token: tokenInfo,
        mining: miningStatus,
        endpoints: {
            blockchain: '/api/blockchain',
            wallets: '/api/wallets',
            transfers: '/api/transfers',
            mining: '/api/mining',
            tokens: '/api/tokens'
        }
    };
});

// Register API routes
fastify.register(blockchainRoutes, { prefix: '/api/blockchain' });
fastify.register(walletRoutes, { prefix: '/api/wallets' });
fastify.register(transferRoutes, { prefix: '/api/transfers' });
fastify.register(miningRoutes, { prefix: '/api/mining' });
fastify.register(tokenRoutes, { prefix: '/api/tokens' });

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);
    
    reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
        success: false,
        error: 'Route not found',
        message: `Route ${request.method} ${request.url} not found`,
        timestamp: new Date().toISOString()
    });
});

// Start server
const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';
        
        await fastify.listen({ port, host });
        
        console.log(`🚀 Chain Cosmos Server is running on http://${host}:${port}`);
        console.log(`📊 Blockchain Explorer API available at http://${host}:${port}/api`);
        console.log(`💰 Token: ${tokenManager.getTokenInfo().name} (${tokenManager.getTokenInfo().symbol})`);
        console.log(`⛏️  Mining reward: ${blockchain.miningReward} tokens per block`);
        console.log(`🔗 Genesis block created with ${blockchain.totalSupply} total supply`);
        
        // Create initial wallets for testing
        console.log('\n🔧 Creating test wallets...');
        const wallet1 = walletManager.createWallet();
        const wallet2 = walletManager.createWallet();
        
        console.log(`Wallet 1: ${wallet1.wallet.address}`);
        console.log(`Wallet 2: ${wallet2.wallet.address}`);
        
        // Register a test miner
        const minerResult = miningManager.registerMiner(wallet1.wallet.address, 'Test Miner 1');
        console.log(`✅ Registered miner: ${minerResult.miner.name}`);
        
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();