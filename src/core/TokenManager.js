import { Transaction } from './Transaction.js';

export class TokenManager {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.tokenName = 'CosmoCoin';
        this.tokenSymbol = 'COSMO';
    }

    mintTokens(toAddress, amount, adminAddress = null) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        // Check if minting would exceed total supply
        if (this.blockchain.circulatingSupply + amount > this.blockchain.totalSupply) {
            throw new Error('Minting would exceed total supply');
        }

        const mintTransaction = new Transaction(null, toAddress, amount, 'mint');
        
        // Add to pending transactions
        this.blockchain.pendingTransactions.push(mintTransaction);
        
        return {
            success: true,
            transaction: mintTransaction.toJSON(),
            message: `${amount} ${this.tokenSymbol} tokens queued for minting to ${toAddress}`
        };
    }

    burnTokens(fromAddress, amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const balance = this.blockchain.getBalance(fromAddress);
        if (balance < amount) {
            throw new Error('Insufficient balance for burning');
        }

        const burnTransaction = new Transaction(fromAddress, null, amount, 'burn');
        
        // Add to pending transactions
        this.blockchain.pendingTransactions.push(burnTransaction);
        
        return {
            success: true,
            transaction: burnTransaction.toJSON(),
            message: `${amount} ${this.tokenSymbol} tokens queued for burning from ${fromAddress}`
        };
    }

    getTokenInfo() {
        return {
            name: this.tokenName,
            symbol: this.tokenSymbol,
            totalSupply: this.blockchain.totalSupply,
            circulatingSupply: this.blockchain.circulatingSupply,
            decimal: 18
        };
    }

    getBalanceOf(address) {
        return this.blockchain.getBalance(address);
    }

    getAllBalances() {
        const balances = new Map();
        const transactions = this.blockchain.getAllTransactions();
        
        transactions.forEach(tx => {
            if (tx.fromAddress) {
                const currentBalance = balances.get(tx.fromAddress) || 0;
                balances.set(tx.fromAddress, currentBalance - tx.amount);
            }
            
            if (tx.toAddress && tx.toAddress !== 'genesis') {
                const currentBalance = balances.get(tx.toAddress) || 0;
                balances.set(tx.toAddress, currentBalance + tx.amount);
            }
        });

        // Convert Map to Object and filter out zero/negative balances
        const result = {};
        balances.forEach((balance, address) => {
            if (balance > 0) {
                result[address] = balance;
            }
        });

        return result;
    }

    getTopHolders(limit = 10) {
        const balances = this.getAllBalances();
        
        return Object.entries(balances)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([address, balance]) => ({
                address,
                balance,
                percentage: ((balance / this.blockchain.circulatingSupply) * 100).toFixed(2)
            }));
    }

    getTokenStats() {
        const allBalances = this.getAllBalances();
        const holders = Object.keys(allBalances).length;
        const topHolders = this.getTopHolders(5);
        
        return {
            tokenInfo: this.getTokenInfo(),
            holders,
            topHolders,
            averageBalance: holders > 0 ? (this.blockchain.circulatingSupply / holders).toFixed(2) : 0
        };
    }
}