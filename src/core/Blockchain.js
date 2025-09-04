import { Block } from './Block.js';
import { Transaction } from './Transaction.js';

export class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.totalSupply = 1000000; // Initial total supply
        this.circulatingSupply = 0;
    }

    createGenesisBlock() {
        const genesisTransactions = [
            new Transaction(null, 'genesis', this.totalSupply, 'mint')
        ];
        return new Block(Date.now(), genesisTransactions, '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 'mine');
        this.pendingTransactions.push(rewardTx);

        const block = new Block(
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);
        this.circulatingSupply += this.miningReward;
        this.pendingTransactions = [];
    }

    createTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
        }

        const walletBalance = this.getBalance(transaction.fromAddress);
        if (walletBalance < transaction.amount) {
            throw new Error('Not enough balance');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalance(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    getAllTransactions() {
        const transactions = [];
        for (const block of this.chain) {
            for (const trans of block.transactions) {
                transactions.push(trans);
            }
        }
        return transactions;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }

    getBlockByHash(hash) {
        return this.chain.find(block => block.hash === hash);
    }

    getBlockByIndex(index) {
        return this.chain[index];
    }

    getChainLength() {
        return this.chain.length;
    }

    getChainInfo() {
        return {
            length: this.chain.length,
            difficulty: this.difficulty,
            totalSupply: this.totalSupply,
            circulatingSupply: this.circulatingSupply,
            pendingTransactions: this.pendingTransactions.length
        };
    }

    toJSON() {
        return {
            chain: this.chain.map(block => block.toJSON()),
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.map(tx => tx.toJSON()),
            miningReward: this.miningReward,
            totalSupply: this.totalSupply,
            circulatingSupply: this.circulatingSupply
        };
    }
}