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

// 初始化区块链和管理器
const blockchain = new Blockchain();
const walletManager = new WalletManager(blockchain);
const tokenManager = new TokenManager(blockchain);
const transferManager = new TransferManager(blockchain, walletManager);
const miningManager = new MiningManager(blockchain, walletManager);

// 使管理器对路由可用
fastify.decorate('blockchain', blockchain);
fastify.decorate('walletManager', walletManager);
fastify.decorate('tokenManager', tokenManager);
fastify.decorate('transferManager', transferManager);
fastify.decorate('miningManager', miningManager);

// 注册CORS插件
await fastify.register(import('@fastify/cors'), {
    origin: true, // 允许所有来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

// 健康检查端点
fastify.get('/health', async (request, reply) => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    };
});

// API状态端点
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

// 注册API路由
fastify.register(blockchainRoutes, { prefix: '/api/blockchain' });
fastify.register(walletRoutes, { prefix: '/api/wallets' });
fastify.register(transferRoutes, { prefix: '/api/transfers' });
fastify.register(miningRoutes, { prefix: '/api/mining' });
fastify.register(tokenRoutes, { prefix: '/api/tokens' });

// 错误处理程序
fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);
    
    reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404处理程序
fastify.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
        success: false,
        error: 'Route not found',
        message: `Route ${request.method} ${request.url} not found`,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';
        
        await fastify.listen({ port, host });
        
        console.log(`🚀 Chain Cosmos 服务器正在运行 http://${host}:${port}`);
        console.log(`📊 区块链浏览器 API 地址 http://${host}:${port}/api`);
        console.log(`💰 代币: ${tokenManager.getTokenInfo().name} (${tokenManager.getTokenInfo().symbol})`);
        console.log(`⛏️  挖矿奖励: ${blockchain.miningReward} 代币/区块`);
        console.log(`🔗 创世区块创建，总供应量 ${blockchain.totalSupply}`);
        
        // 创建初始测试钱包
        console.log('\n🔧 创建测试钱包...');
        const wallet1 = walletManager.createWallet();
        const wallet2 = walletManager.createWallet();
        
        console.log(`钱包 1: ${wallet1.wallet.address}`);
        console.log(`钱包 2: ${wallet2.wallet.address}`);
        
        // 注册测试矿工
        const minerResult = miningManager.registerMiner(wallet1.wallet.address, '测试矿工 1');
        console.log(`✅ 已注册矿工: ${minerResult.miner.name}`);
        
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();