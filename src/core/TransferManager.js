import { Transaction } from './Transaction.js';

export class TransferManager {
    constructor(blockchain, walletManager) {
        this.blockchain = blockchain;
        this.walletManager = walletManager;
    }

    createTransfer(fromAddress, toAddress, amount, privateKey = null) {
        // Validation
        if (!fromAddress || !toAddress) {
            throw new Error('From and to addresses are required');
        }

        if (!this.walletManager.isValidAddress(fromAddress) || !this.walletManager.isValidAddress(toAddress)) {
            throw new Error('Invalid address format');
        }

        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        if (fromAddress === toAddress) {
            throw new Error('Cannot transfer to the same address');
        }

        // Check balance
        const balance = this.blockchain.getBalance(fromAddress);
        if (balance < amount) {
            throw new Error(`Insufficient balance. Available: ${balance}, Required: ${amount}`);
        }

        // Create transaction
        const transaction = new Transaction(fromAddress, toAddress, amount, 'transfer');

        // Sign transaction if private key provided
        if (privateKey) {
            const wallet = this.walletManager.wallets.get(fromAddress);
            if (wallet && wallet.privateKey === privateKey) {
                const signature = wallet.sign(transaction.calculateHash());
                transaction.signature = signature;
            } else {
                throw new Error('Invalid private key or wallet not found');
            }
        }

        // Add to blockchain
        this.blockchain.createTransaction(transaction);

        return {
            success: true,
            transaction: transaction.toJSON(),
            message: `Transfer of ${amount} COSMO from ${fromAddress} to ${toAddress} has been queued`
        };
    }

    getTransactionHistory(address, limit = 50) {
        const allTransactions = this.blockchain.getAllTransactions();
        
        const userTransactions = allTransactions.filter(tx => 
            tx.fromAddress === address || tx.toAddress === address
        );

        // Sort by timestamp (newest first)
        userTransactions.sort((a, b) => b.timestamp - a.timestamp);

        return userTransactions.slice(0, limit).map(tx => ({
            ...tx,
            type: this.determineTransactionType(tx, address),
            date: new Date(tx.timestamp).toISOString()
        }));
    }

    determineTransactionType(transaction, userAddress) {
        if (transaction.fromAddress === userAddress && transaction.toAddress === userAddress) {
            return 'self';
        }
        if (transaction.fromAddress === userAddress) {
            return 'sent';
        }
        if (transaction.toAddress === userAddress) {
            return 'received';
        }
        return 'unknown';
    }

    getPendingTransactions(address = null) {
        let pendingTxs = this.blockchain.pendingTransactions;
        
        if (address) {
            pendingTxs = pendingTxs.filter(tx => 
                tx.fromAddress === address || tx.toAddress === address
            );
        }

        return pendingTxs.map(tx => ({
            ...tx.toJSON(),
            status: 'pending'
        }));
    }

    getTransactionById(transactionId) {
        const allTransactions = this.blockchain.getAllTransactions();
        const transaction = allTransactions.find(tx => tx.id === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Find which block contains this transaction
        let blockInfo = null;
        for (let i = 0; i < this.blockchain.chain.length; i++) {
            const block = this.blockchain.chain[i];
            const txInBlock = block.transactions.find(tx => tx.id === transactionId);
            if (txInBlock) {
                blockInfo = {
                    blockIndex: i,
                    blockHash: block.hash,
                    blockTimestamp: block.timestamp,
                    confirmations: this.blockchain.chain.length - i
                };
                break;
            }
        }

        return {
            ...transaction,
            block: blockInfo,
            date: new Date(transaction.timestamp).toISOString()
        };
    }

    getTransferStats(address = null) {
        const allTransactions = this.blockchain.getAllTransactions();
        let relevantTxs = allTransactions;

        if (address) {
            relevantTxs = allTransactions.filter(tx => 
                tx.fromAddress === address || tx.toAddress === address
            );
        }

        const transferTxs = relevantTxs.filter(tx => tx.type === 'transfer');
        
        const stats = {
            totalTransactions: relevantTxs.length,
            totalTransfers: transferTxs.length,
            totalVolume: transferTxs.reduce((sum, tx) => sum + tx.amount, 0),
            averageAmount: transferTxs.length > 0 ? 
                (transferTxs.reduce((sum, tx) => sum + tx.amount, 0) / transferTxs.length).toFixed(2) : 0
        };

        if (address) {
            const sentTxs = transferTxs.filter(tx => tx.fromAddress === address);
            const receivedTxs = transferTxs.filter(tx => tx.toAddress === address);
            
            stats.sent = {
                count: sentTxs.length,
                amount: sentTxs.reduce((sum, tx) => sum + tx.amount, 0)
            };
            
            stats.received = {
                count: receivedTxs.length,
                amount: receivedTxs.reduce((sum, tx) => sum + tx.amount, 0)
            };
        }

        return stats;
    }

    estimateTransactionFee(amount) {
        // Simple fee calculation (in a real blockchain, this would be more complex)
        const baseFee = 0.01;
        const percentageFee = amount * 0.001; // 0.1%
        return Math.max(baseFee, percentageFee);
    }

    validateTransferRequest(fromAddress, toAddress, amount) {
        const errors = [];

        if (!fromAddress) errors.push('From address is required');
        if (!toAddress) errors.push('To address is required');
        if (!amount || amount <= 0) errors.push('Amount must be greater than 0');

        if (fromAddress && !this.walletManager.isValidAddress(fromAddress)) {
            errors.push('Invalid from address format');
        }

        if (toAddress && !this.walletManager.isValidAddress(toAddress)) {
            errors.push('Invalid to address format');
        }

        if (fromAddress === toAddress) {
            errors.push('Cannot transfer to the same address');
        }

        if (fromAddress && amount > 0) {
            const balance = this.blockchain.getBalance(fromAddress);
            if (balance < amount) {
                errors.push(`Insufficient balance. Available: ${balance}, Required: ${amount}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}