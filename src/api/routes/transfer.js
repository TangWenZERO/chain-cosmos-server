export async function transferRoutes(fastify, options) {
    const { transferManager, blockchain } = fastify;

    // Create transfer
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['fromAddress', 'toAddress', 'amount'],
                properties: {
                    fromAddress: { type: 'string' },
                    toAddress: { type: 'string' },
                    amount: { type: 'number', minimum: 0.001 },
                    privateKey: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { fromAddress, toAddress, amount, privateKey } = request.body;
            
            // Validate transfer request
            const validation = transferManager.validateTransferRequest(fromAddress, toAddress, amount);
            if (!validation.valid) {
                return reply.code(400).send({
                    success: false,
                    errors: validation.errors
                });
            }
            
            const result = transferManager.createTransfer(fromAddress, toAddress, amount, privateKey);
            
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

    // Get transaction history for address
    fastify.get('/:address/history', async (request, reply) => {
        try {
            const { address } = request.params;
            const { limit = 20 } = request.query;
            
            const history = transferManager.getTransactionHistory(address, parseInt(limit));
            
            return {
                success: true,
                data: {
                    address,
                    transactions: history,
                    count: history.length
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get pending transactions for address
    fastify.get('/:address/pending', async (request, reply) => {
        try {
            const { address } = request.params;
            const pendingTxs = transferManager.getPendingTransactions(address);
            
            return {
                success: true,
                data: {
                    address,
                    pendingTransactions: pendingTxs,
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

    // Get transaction by ID
    fastify.get('/transaction/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const transaction = transferManager.getTransactionById(id);
            
            return {
                success: true,
                data: transaction
            };
        } catch (error) {
            reply.code(404).send({
                success: false,
                error: error.message
            });
        }
    });

    // Get transfer statistics
    fastify.get('/stats', async (request, reply) => {
        try {
            const { address } = request.query;
            const stats = transferManager.getTransferStats(address || null);
            
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

    // Estimate transaction fee
    fastify.post('/estimate-fee', {
        schema: {
            body: {
                type: 'object',
                required: ['amount'],
                properties: {
                    amount: { type: 'number', minimum: 0.001 }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { amount } = request.body;
            const estimatedFee = transferManager.estimateTransactionFee(amount);
            
            return {
                success: true,
                data: {
                    amount,
                    estimatedFee,
                    totalCost: amount + estimatedFee
                }
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    // Validate transfer request
    fastify.post('/validate', {
        schema: {
            body: {
                type: 'object',
                required: ['fromAddress', 'toAddress', 'amount'],
                properties: {
                    fromAddress: { type: 'string' },
                    toAddress: { type: 'string' },
                    amount: { type: 'number' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { fromAddress, toAddress, amount } = request.body;
            const validation = transferManager.validateTransferRequest(fromAddress, toAddress, amount);
            
            return {
                success: true,
                data: validation
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });
}