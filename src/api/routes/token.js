export async function tokenRoutes(fastify, options) {
    const { tokenManager, blockchain } = fastify;

    // Get token information
    fastify.get('/info', async (request, reply) => {
        try {
            const tokenInfo = tokenManager.getTokenInfo();
            
            return {
                success: true,
                data: tokenInfo
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Mint tokens
    fastify.post('/mint', {
        schema: {
            body: {
                type: 'object',
                required: ['toAddress', 'amount'],
                properties: {
                    toAddress: { type: 'string' },
                    amount: { type: 'number', minimum: 1 },
                    adminAddress: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { toAddress, amount, adminAddress } = request.body;
            const result = tokenManager.mintTokens(toAddress, amount, adminAddress);
            
            return reply.code(201).send({
                success: true,
                data: result
            });
        } catch (error) {
            reply.code(400).send({
                success: false,
                error: error.message
            });
        }
    });

    // Burn tokens
    fastify.post('/burn', {
        schema: {
            body: {
                type: 'object',
                required: ['fromAddress', 'amount'],
                properties: {
                    fromAddress: { type: 'string' },
                    amount: { type: 'number', minimum: 1 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { fromAddress, amount } = request.body;
            const result = tokenManager.burnTokens(fromAddress, amount);
            
            return reply.code(201).send({
                success: true,
                data: result
            });
        } catch (error) {
            reply.code(400).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get balance of specific address
    fastify.get('/balance/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const balance = tokenManager.getBalanceOf(address);
            
            return {
                success: true,
                data: {
                    address,
                    balance
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get all balances
    fastify.get('/balances', async (request, reply) => {
        try {
            const balances = tokenManager.getAllBalances();
            
            return {
                success: true,
                data: {
                    balances,
                    count: Object.keys(balances).length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get top token holders
    fastify.get('/holders', async (request, reply) => {
        try {
            const { limit = 10 } = request.query;
            const topHolders = tokenManager.getTopHolders(parseInt(limit));
            
            return {
                success: true,
                data: {
                    holders: topHolders,
                    count: topHolders.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get token statistics
    fastify.get('/stats', async (request, reply) => {
        try {
            const stats = tokenManager.getTokenStats();
            
            return {
                success: true,
                data: stats
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get token supply information
    fastify.get('/supply', async (request, reply) => {
        try {
            const tokenInfo = tokenManager.getTokenInfo();
            
            return {
                success: true,
                data: {
                    totalSupply: tokenInfo.totalSupply,
                    circulatingSupply: tokenInfo.circulatingSupply,
                    supplyPercentage: ((tokenInfo.circulatingSupply / tokenInfo.totalSupply) * 100).toFixed(2)
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