export async function blockchainRoutes(fastify, options) {
    const { blockchain, tokenManager } = fastify;

    // Get blockchain info
    fastify.get('/info', async (request, reply) => {
        try {
            const chainInfo = blockchain.getChainInfo();
            const tokenInfo = tokenManager.getTokenInfo();
            
            return {
                success: true,
                data: {
                    ...chainInfo,
                    token: tokenInfo,
                    isValid: blockchain.isChainValid()
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get all blocks
    fastify.get('/blocks', async (request, reply) => {
        try {
            const { limit = 10, offset = 0 } = request.query;
            const chain = blockchain.chain;
            const totalBlocks = chain.length;
            
            const blocks = chain
                .slice(-limit - offset, -offset || undefined)
                .reverse()
                .map((block, index) => ({
                    ...block.toJSON(),
                    height: totalBlocks - offset - index - 1
                }));

            return {
                success: true,
                data: {
                    blocks,
                    total: totalBlocks,
                    hasMore: offset + limit < totalBlocks
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get block by hash
    fastify.get('/blocks/:hash', async (request, reply) => {
        try {
            const { hash } = request.params;
            const block = blockchain.getBlockByHash(hash);
            
            if (!block) {
                return reply.code(404).send({
                    success: false,
                    error: 'Block not found'
                });
            }

            const blockIndex = blockchain.chain.findIndex(b => b.hash === hash);
            
            return {
                success: true,
                data: {
                    ...block.toJSON(),
                    height: blockIndex,
                    confirmations: blockchain.chain.length - blockIndex - 1
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get block by height/index
    fastify.get('/blocks/height/:height', async (request, reply) => {
        try {
            const height = parseInt(request.params.height);
            const block = blockchain.getBlockByIndex(height);
            
            if (!block) {
                return reply.code(404).send({
                    success: false,
                    error: 'Block not found'
                });
            }

            return {
                success: true,
                data: {
                    ...block.toJSON(),
                    height: height,
                    confirmations: blockchain.chain.length - height - 1
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get latest block
    fastify.get('/blocks/latest', async (request, reply) => {
        try {
            const latestBlock = blockchain.getLatestBlock();
            const height = blockchain.chain.length - 1;
            
            return {
                success: true,
                data: {
                    ...latestBlock.toJSON(),
                    height: height,
                    confirmations: 0
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get all transactions
    fastify.get('/transactions', async (request, reply) => {
        try {
            const { limit = 20, type } = request.query;
            let transactions = blockchain.getAllTransactions();
            
            if (type) {
                transactions = transactions.filter(tx => tx.type === type);
            }

            transactions.sort((a, b) => b.timestamp - a.timestamp);
            
            return {
                success: true,
                data: {
                    transactions: transactions.slice(0, limit).map(tx => ({
                        ...tx,
                        date: new Date(tx.timestamp).toISOString()
                    })),
                    total: transactions.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get pending transactions
    fastify.get('/transactions/pending', async (request, reply) => {
        try {
            const pendingTxs = blockchain.pendingTransactions;
            
            return {
                success: true,
                data: {
                    transactions: pendingTxs.map(tx => ({
                        ...tx.toJSON(),
                        status: 'pending',
                        date: new Date(tx.timestamp).toISOString()
                    })),
                    count: pendingTxs.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Validate blockchain
    fastify.get('/validate', async (request, reply) => {
        try {
            const isValid = blockchain.isChainValid();
            
            return {
                success: true,
                data: {
                    isValid,
                    message: isValid ? 'Blockchain is valid' : 'Blockchain is invalid'
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });
}