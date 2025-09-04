export class MiningManager {
    constructor(blockchain, walletManager) {
        this.blockchain = blockchain;
        this.walletManager = walletManager;
        this.miners = new Map();
        this.miningStats = new Map();
        this.isMining = false;
        this.currentMiner = null;
        this.miningStartTime = null;
    }

    registerMiner(minerAddress, minerName = 'Unknown Miner') {
        if (!this.walletManager.isValidAddress(minerAddress)) {
            throw new Error('Invalid miner address');
        }

        if (this.miners.has(minerAddress)) {
            throw new Error('Miner already registered');
        }

        const minerInfo = {
            address: minerAddress,
            name: minerName,
            registeredAt: Date.now(),
            blocksMinedCount: 0,
            totalRewards: 0,
            isActive: true
        };

        this.miners.set(minerAddress, minerInfo);
        this.miningStats.set(minerAddress, {
            blocksFound: 0,
            totalHashrate: 0,
            lastBlockTime: null,
            averageBlockTime: 0,
            totalMiningTime: 0
        });

        return {
            success: true,
            miner: minerInfo,
            message: `Miner ${minerName} registered successfully`
        };
    }

    startMining(minerAddress) {
        if (!this.miners.has(minerAddress)) {
            throw new Error('Miner not registered. Please register first.');
        }

        if (this.isMining) {
            throw new Error('Mining is already in progress by another miner');
        }

        if (this.blockchain.pendingTransactions.length === 0) {
            throw new Error('No pending transactions to mine');
        }

        this.isMining = true;
        this.currentMiner = minerAddress;
        this.miningStartTime = Date.now();

        const miner = this.miners.get(minerAddress);
        miner.isActive = true;

        // Start mining process (simplified)
        setTimeout(() => {
            this.completeMining(minerAddress);
        }, Math.random() * 10000 + 5000); // Random mining time between 5-15 seconds

        return {
            success: true,
            message: `Mining started by ${miner.name}`,
            minerAddress: minerAddress,
            pendingTransactions: this.blockchain.pendingTransactions.length,
            difficulty: this.blockchain.difficulty
        };
    }

    completeMining(minerAddress) {
        if (!this.isMining || this.currentMiner !== minerAddress) {
            return;
        }

        try {
            // Mine the block
            this.blockchain.minePendingTransactions(minerAddress);
            
            const miningEndTime = Date.now();
            const miningDuration = miningEndTime - this.miningStartTime;

            // Update miner stats
            const miner = this.miners.get(minerAddress);
            const stats = this.miningStats.get(minerAddress);

            miner.blocksMinedCount += 1;
            miner.totalRewards += this.blockchain.miningReward;

            stats.blocksFound += 1;
            stats.lastBlockTime = miningEndTime;
            stats.totalMiningTime += miningDuration;
            stats.averageBlockTime = stats.totalMiningTime / stats.blocksFound;

            // Reset mining state
            this.isMining = false;
            this.currentMiner = null;
            this.miningStartTime = null;

            const newBlock = this.blockchain.getLatestBlock();

            return {
                success: true,
                message: `Block successfully mined by ${miner.name}`,
                block: newBlock.toJSON(),
                miningDuration: miningDuration,
                reward: this.blockchain.miningReward,
                blockHash: newBlock.hash
            };
        } catch (error) {
            this.isMining = false;
            this.currentMiner = null;
            this.miningStartTime = null;
            
            throw new Error(`Mining failed: ${error.message}`);
        }
    }

    stopMining(minerAddress) {
        if (!this.isMining) {
            throw new Error('No mining in progress');
        }

        if (this.currentMiner !== minerAddress) {
            throw new Error('You are not the current miner');
        }

        this.isMining = false;
        this.currentMiner = null;
        this.miningStartTime = null;

        const miner = this.miners.get(minerAddress);
        miner.isActive = false;

        return {
            success: true,
            message: `Mining stopped by ${miner.name}`,
            minerAddress: minerAddress
        };
    }

    getMiningStatus() {
        return {
            isMining: this.isMining,
            currentMiner: this.currentMiner,
            miningStartTime: this.miningStartTime,
            difficulty: this.blockchain.difficulty,
            pendingTransactions: this.blockchain.pendingTransactions.length,
            miningReward: this.blockchain.miningReward,
            estimatedTimeToBlock: this.isMining ? 
                Math.max(0, 10000 - (Date.now() - this.miningStartTime)) : null
        };
    }

    getMinerInfo(minerAddress) {
        if (!this.miners.has(minerAddress)) {
            throw new Error('Miner not found');
        }

        const miner = this.miners.get(minerAddress);
        const stats = this.miningStats.get(minerAddress);
        const balance = this.blockchain.getBalance(minerAddress);

        return {
            ...miner,
            ...stats,
            currentBalance: balance
        };
    }

    getAllMiners() {
        const minersInfo = [];

        this.miners.forEach((miner, address) => {
            const stats = this.miningStats.get(address);
            const balance = this.blockchain.getBalance(address);
            
            minersInfo.push({
                ...miner,
                ...stats,
                currentBalance: balance
            });
        });

        return minersInfo.sort((a, b) => b.blocksMinedCount - a.blocksMinedCount);
    }

    getTopMiners(limit = 10) {
        const allMiners = this.getAllMiners();
        return allMiners.slice(0, limit);
    }

    getMiningStats() {
        const totalMiners = this.miners.size;
        const activeMiners = Array.from(this.miners.values()).filter(m => m.isActive).length;
        
        let totalBlocks = 0;
        let totalRewards = 0;
        let totalHashrate = 0;

        this.miners.forEach(miner => {
            totalBlocks += miner.blocksMinedCount;
            totalRewards += miner.totalRewards;
        });

        this.miningStats.forEach(stats => {
            totalHashrate += stats.totalHashrate;
        });

        const networkHashrate = totalHashrate / totalMiners || 0;
        const averageBlockTime = this.blockchain.chain.length > 1 ? 
            this.calculateAverageBlockTime() : 0;

        return {
            totalMiners,
            activeMiners,
            totalBlocksMined: totalBlocks,
            totalRewardsDistributed: totalRewards,
            networkHashrate: networkHashrate.toFixed(2),
            averageBlockTime: averageBlockTime.toFixed(2),
            difficulty: this.blockchain.difficulty,
            lastBlockTime: this.blockchain.getLatestBlock().timestamp,
            chainLength: this.blockchain.chain.length
        };
    }

    calculateAverageBlockTime() {
        const blocks = this.blockchain.chain;
        if (blocks.length < 2) return 0;

        let totalTime = 0;
        for (let i = 1; i < blocks.length; i++) {
            totalTime += blocks[i].timestamp - blocks[i - 1].timestamp;
        }

        return totalTime / (blocks.length - 1);
    }

    adjustDifficulty() {
        const averageBlockTime = this.calculateAverageBlockTime();
        const targetTime = 60000; // 1 minute target block time

        if (averageBlockTime < targetTime * 0.8) {
            this.blockchain.difficulty += 1;
        } else if (averageBlockTime > targetTime * 1.2 && this.blockchain.difficulty > 1) {
            this.blockchain.difficulty -= 1;
        }

        return {
            newDifficulty: this.blockchain.difficulty,
            averageBlockTime: averageBlockTime,
            targetTime: targetTime
        };
    }

    unregisterMiner(minerAddress) {
        if (!this.miners.has(minerAddress)) {
            throw new Error('Miner not found');
        }

        if (this.currentMiner === minerAddress) {
            this.stopMining(minerAddress);
        }

        this.miners.delete(minerAddress);
        this.miningStats.delete(minerAddress);

        return {
            success: true,
            message: 'Miner unregistered successfully'
        };
    }
}