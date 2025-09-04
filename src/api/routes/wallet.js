export async function walletRoutes(fastify, options) {
    const { walletManager, blockchain } = fastify;

    // Create new wallet
    fastify.post('/create', async (request, reply) => {
        try {
            const result = walletManager.createWallet();
            
            return reply.code(201).send({
                success: true,
                data: result
            });
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get wallet info
    fastify.get('/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const result = walletManager.getWallet(address);
            
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

    // Get all wallets
    fastify.get('/', async (request, reply) => {
        try {
            const wallets = walletManager.getAllWallets();
            
            return {
                success: true,
                data: {
                    wallets,
                    count: wallets.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Import wallet
    fastify.post('/import', {
        schema: {
            body: {
                type: 'object',
                required: ['privateKey'],
                properties: {
                    privateKey: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { privateKey } = request.body;
            const result = walletManager.importWallet(privateKey);
            
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

    // Export wallet
    fastify.get('/:address/export', async (request, reply) => {
        try {
            const { address } = request.params;
            const result = walletManager.exportWallet(address);
            
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

    // Get wallet balance
    fastify.get('/:address/balance', async (request, reply) => {
        try {
            const { address } = request.params;
            
            if (!walletManager.isValidAddress(address)) {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid address format'
                });
            }
            
            const balance = blockchain.getBalance(address);
            
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

    // Delete wallet
    fastify.delete('/:address', async (request, reply) => {
        try {
            const { address } = request.params;
            const result = walletManager.deleteWallet(address);
            
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

    // Validate address
    fastify.post('/validate', {
        schema: {
            body: {
                type: 'object',
                required: ['address'],
                properties: {
                    address: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { address } = request.body;
            const isValid = walletManager.isValidAddress(address);
            
            return {
                success: true,
                data: {
                    address,
                    isValid,
                    message: isValid ? 'Valid address' : 'Invalid address format'
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