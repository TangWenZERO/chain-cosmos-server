export async function miningRoutes(fastify, options) {
    const { miningManager } = fastify;

    // Register miner
    fastify.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['minerAddress'],
                properties: {
                    minerAddress: { type: 'string' },
                    minerName: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { minerAddress, minerName } = request.body;
            const result = miningManager.registerMiner(minerAddress, minerName);
            
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

    // Start mining
    fastify.post('/start', {
        schema: {
            body: {
                type: 'object',
                required: ['minerAddress'],
                properties: {
                    minerAddress: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { minerAddress } = request.body;
            const { response, waitUntil } = miningManager.startMining(minerAddress);

            if (waitUntil && request.executionCtx) {
                request.executionCtx.waitUntil(waitUntil.catch(error => {
                    request.log.error?.(error);
                }));
            }

            return {
                success: true,
                data: response
            };
        } catch (error) {
            reply.code(400).send({
                success: false,
                error: error.message
            });
        }
    });

    // Stop mining
    fastify.post('/stop', {
        schema: {
            body: {
                type: 'object',
                required: ['minerAddress'],
                properties: {
                    minerAddress: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { minerAddress } = request.body;
            const result = miningManager.stopMining(minerAddress);
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            reply.code(400).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get mining status
    fastify.get('/status', async (request, reply) => {
        try {
            const status = miningManager.getMiningStatus();
            
            return {
                success: true,
                data: status
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get miner info
    fastify.get('/miners/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const minerInfo = miningManager.getMinerInfo(address);
            
            return {
                success: true,
                data: minerInfo
            };
        } catch (error) {
            reply.code(404).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get all miners
    fastify.get('/miners', async (request, reply) => {
        try {
            const miners = miningManager.getAllMiners();
            
            return {
                success: true,
                data: {
                    miners,
                    count: miners.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get top miners
    fastify.get('/leaderboard', async (request, reply) => {
        try {
            const { limit = 10 } = request.query;
            const topMiners = miningManager.getTopMiners(parseInt(limit));
            
            return {
                success: true,
                data: {
                    topMiners,
                    count: topMiners.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get mining statistics
    fastify.get('/stats', async (request, reply) => {
        try {
            const stats = miningManager.getMiningStats();
            
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

    // Adjust difficulty
    fastify.post('/adjust-difficulty', async (request, reply) => {
        try {
            const result = miningManager.adjustDifficulty();
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Unregister miner
    fastify.delete('/miners/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const result = miningManager.unregisterMiner(address);
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            reply.code(404).send({
                success: false,
                error: error.message
            });
        }
    });
}
