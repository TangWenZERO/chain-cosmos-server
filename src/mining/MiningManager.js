export class MiningManager {
    /**
     * 挖矿管理器构造函数
     * @param {Blockchain} blockchain - 区块链实例
     * @param {WalletManager} walletManager - 钱包管理器实例
     */
    constructor(blockchain, walletManager) {
        this.blockchain = blockchain;           // 区块链实例引用
        this.walletManager = walletManager;     // 钱包管理器实例引用
        this.miners = new Map();                // 已注册矿工映射表
        this.miningStats = new Map();           // 挖矿统计数据映射表
        this.isMining = false;                  // 挖矿状态标记
        this.currentMiner = null;               // 当前挖矿的矿工地址
        this.miningStartTime = null;            // 挖矿开始时间
    }

    /**
     * 注册矿工
     * @param {string} minerAddress - 矿工地址
     * @param {string} minerName - 矿工名称
     * @returns {Object} 注册结果对象
     */
    registerMiner(minerAddress, minerName = 'Unknown Miner') {
        // 验证矿工地址有效性
        if (!this.walletManager.isValidAddress(minerAddress)) {
            throw new Error('Invalid miner address');
        }

        // 检查矿工是否已注册
        if (this.miners.has(minerAddress)) {
            throw new Error('Miner already registered');
        }

        // 创建矿工信息对象
        const minerInfo = {
            address: minerAddress,              // 矿工地址
            name: minerName,                    // 矿工名称
            registeredAt: Date.now(),           // 注册时间
            blocksMinedCount: 0,                // 挖出的区块数量
            totalRewards: 0,                    // 总奖励
            isActive: true                      // 是否活跃
        };

        // 将矿工信息存储到映射表中
        this.miners.set(minerAddress, minerInfo);
        // 初始化矿工挖矿统计数据
        this.miningStats.set(minerAddress, {
            blocksFound: 0,                     // 找到的区块数
            totalHashrate: 0,                   // 总哈希率
            lastBlockTime: null,                // 最后出块时间
            averageBlockTime: 0,                // 平均出块时间
            totalMiningTime: 0                  // 总挖矿时间
        });

        // 返回注册成功结果
        return {
            success: true,
            miner: minerInfo,
            message: `Miner ${minerName} registered successfully`
        };
    }

    /**
     * 开始挖矿
     * @param {string} minerAddress - 矿工地址
     * @returns {Object} 开始挖矿结果对象
     */
    startMining(minerAddress) {
        // 检查矿工是否已注册
        if (!this.miners.has(minerAddress)) {
            throw new Error('Miner not registered. Please register first.');
        }

        // 检查是否已有其他矿工在挖矿
        if (this.isMining) {
            throw new Error('Mining is already in progress by another miner');
        }

        // 检查是否有待处理交易
        if (this.blockchain.pendingTransactions.length === 0) {
            throw new Error('No pending transactions to mine');
        }

        // 设置挖矿状态
        this.isMining = true;
        this.currentMiner = minerAddress;
        this.miningStartTime = Date.now();

        // 更新矿工活跃状态
        const miner = this.miners.get(minerAddress);
        miner.isActive = true;

        // 启动挖矿过程（简化版）
        setTimeout(() => {
            this.completeMining(minerAddress);
        }, Math.random() * 10000 + 5000); // 随机挖矿时间5-15秒

        // 返回开始挖矿结果
        return {
            success: true,
            message: `Mining started by ${miner.name}`,
            minerAddress: minerAddress,
            pendingTransactions: this.blockchain.pendingTransactions.length,
            difficulty: this.blockchain.difficulty
        };
    }

    /**
     * 完成挖矿
     * @param {string} minerAddress - 矿工地址
     * @returns {Object} 挖矿完成结果对象
     */
    completeMining(minerAddress) {
        // 检查挖矿状态和当前矿工是否匹配
        if (!this.isMining || this.currentMiner !== minerAddress) {
            return;
        }

        try {
            // 挖掘待处理交易
            this.blockchain.minePendingTransactions(minerAddress);
            
            // 计算挖矿结束时间和持续时间
            const miningEndTime = Date.now();
            const miningDuration = miningEndTime - this.miningStartTime;

            // 更新矿工统计数据
            const miner = this.miners.get(minerAddress);
            const stats = this.miningStats.get(minerAddress);

            miner.blocksMinedCount += 1;        // 增加挖出区块数
            miner.totalRewards += this.blockchain.miningReward; // 增加总奖励

            stats.blocksFound += 1;             // 增加找到的区块数
            stats.lastBlockTime = miningEndTime; // 更新最后出块时间
            stats.totalMiningTime += miningDuration; // 增加总挖矿时间
            stats.averageBlockTime = stats.totalMiningTime / stats.blocksFound; // 更新平均出块时间

            // 重置挖矿状态
            this.isMining = false;
            this.currentMiner = null;
            this.miningStartTime = null;

            // 获取最新挖出的区块
            const newBlock = this.blockchain.getLatestBlock();

            // 返回挖矿成功结果
            return {
                success: true,
                message: `Block successfully mined by ${miner.name}`,
                block: newBlock.toJSON(),
                miningDuration: miningDuration,
                reward: this.blockchain.miningReward,
                blockHash: newBlock.hash
            };
        } catch (error) {
            // 发生错误时重置挖矿状态
            this.isMining = false;
            this.currentMiner = null;
            this.miningStartTime = null;
            
            throw new Error(`Mining failed: ${error.message}`);
        }
    }

    /**
     * 停止挖矿
     * @param {string} minerAddress - 矿工地址
     * @returns {Object} 停止挖矿结果对象
     */
    stopMining(minerAddress) {
        // 检查是否有挖矿进行中
        if (!this.isMining) {
            throw new Error('No mining in progress');
        }

        // 检查是否为当前挖矿的矿工
        if (this.currentMiner !== minerAddress) {
            throw new Error('You are not the current miner');
        }

        // 重置挖矿状态
        this.isMining = false;
        this.currentMiner = null;
        this.miningStartTime = null;

        // 更新矿工活跃状态
        const miner = this.miners.get(minerAddress);
        miner.isActive = false;

        // 返回停止挖矿结果
        return {
            success: true,
            message: `Mining stopped by ${miner.name}`,
            minerAddress: minerAddress
        };
    }

    /**
     * 获取挖矿状态
     * @returns {Object} 包含挖矿状态信息的对象
     */
    getMiningStatus() {
        return {
            isMining: this.isMining,                            // 是否正在挖矿
            currentMiner: this.currentMiner,                    // 当前矿工地址
            miningStartTime: this.miningStartTime,              // 挖矿开始时间
            difficulty: this.blockchain.difficulty,             // 挖矿难度
            pendingTransactions: this.blockchain.pendingTransactions.length, // 待处理交易数
            miningReward: this.blockchain.miningReward,         // 挖矿奖励
            estimatedTimeToBlock: this.isMining ? 
                Math.max(0, 10000 - (Date.now() - this.miningStartTime)) : null // 预计出块时间
        };
    }

    /**
     * 获取矿工信息
     * @param {string} minerAddress - 矿工地址
     * @returns {Object} 包含矿工详细信息的对象
     */
    getMinerInfo(minerAddress) {
        // 检查矿工是否存在
        if (!this.miners.has(minerAddress)) {
            throw new Error('Miner not found');
        }

        // 获取矿工信息和统计数据
        const miner = this.miners.get(minerAddress);
        const stats = this.miningStats.get(minerAddress);
        const balance = this.blockchain.getBalance(minerAddress); // 获取矿工余额

        // 返回合并后的矿工信息
        return {
            ...miner,
            ...stats,
            currentBalance: balance
        };
    }

    /**
     * 获取所有矿工信息
     * @returns {Array} 包含所有矿工信息的数组
     */
    getAllMiners() {
        const minersInfo = []; // 存储所有矿工信息的数组

        // 遍历所有矿工
        this.miners.forEach((miner, address) => {
            const stats = this.miningStats.get(address);           // 获取统计数据
            const balance = this.blockchain.getBalance(address);   // 获取余额
            
            // 将矿工信息、统计数据和余额合并后添加到数组中
            minersInfo.push({
                ...miner,
                ...stats,
                currentBalance: balance
            });
        });

        // 按挖出区块数量降序排序后返回
        return minersInfo.sort((a, b) => b.blocksMinedCount - a.blocksMinedCount);
    }

    /**
     * 获取排名前几位的矿工
     * @param {number} limit - 返回矿工数量限制
     * @returns {Array} 包含前N名矿工信息的数组
     */
    getTopMiners(limit = 10) {
        const allMiners = this.getAllMiners(); // 获取所有矿工信息
        return allMiners.slice(0, limit);      // 返回前N名矿工
    }

    /**
     * 获取挖矿统计数据
     * @returns {Object} 包含挖矿统计信息的对象
     */
    getMiningStats() {
        const totalMiners = this.miners.size;  // 总矿工数
        // 活跃矿工数（正在挖矿的矿工）
        const activeMiners = Array.from(this.miners.values()).filter(m => m.isActive).length;
        
        let totalBlocks = 0;     // 总挖出区块数
        let totalRewards = 0;    // 总分发奖励
        let totalHashrate = 0;   // 总哈希率

        // 计算总挖出区块数和总奖励
        this.miners.forEach(miner => {
            totalBlocks += miner.blocksMinedCount;
            totalRewards += miner.totalRewards;
        });

        // 计算总哈希率
        this.miningStats.forEach(stats => {
            totalHashrate += stats.totalHashrate;
        });

        // 计算网络哈希率
        const networkHashrate = totalHashrate / totalMiners || 0;
        // 计算平均出块时间
        const averageBlockTime = this.blockchain.chain.length > 1 ? 
            this.calculateAverageBlockTime() : 0;

        // 返回挖矿统计信息
        return {
            totalMiners,                          // 总矿工数
            activeMiners,                         // 活跃矿工数
            totalBlocksMined: totalBlocks,        // 总挖出区块数
            totalRewardsDistributed: totalRewards, // 总分发奖励
            networkHashrate: networkHashrate.toFixed(2), // 网络哈希率
            averageBlockTime: averageBlockTime.toFixed(2), // 平均出块时间
            difficulty: this.blockchain.difficulty,        // 挖矿难度
            lastBlockTime: this.blockchain.getLatestBlock().timestamp, // 最后出块时间
            chainLength: this.blockchain.chain.length      // 区块链长度
        };
    }

    /**
     * 计算平均出块时间
     * @returns {number} 平均出块时间（毫秒）
     */
    calculateAverageBlockTime() {
        const blocks = this.blockchain.chain; // 获取区块链
        if (blocks.length < 2) return 0;      // 如果区块数少于2个，返回0

        let totalTime = 0; // 总时间
        // 计算所有区块之间的时间差总和
        for (let i = 1; i < blocks.length; i++) {
            totalTime += blocks[i].timestamp - blocks[i - 1].timestamp;
        }

        // 返回平均时间
        return totalTime / (blocks.length - 1);
    }

    /**
     * 调整挖矿难度
     * @returns {Object} 包含新难度信息的对象
     */
    adjustDifficulty() {
        const averageBlockTime = this.calculateAverageBlockTime(); // 计算平均出块时间
        const targetTime = 60000; // 目标出块时间（1分钟）

        // 根据平均出块时间调整难度
        if (averageBlockTime < targetTime * 0.8) {
            // 如果出块太快，增加难度
            this.blockchain.difficulty += 1;
        } else if (averageBlockTime > targetTime * 1.2 && this.blockchain.difficulty > 1) {
            // 如果出块太慢且难度大于1，降低难度
            this.blockchain.difficulty -= 1;
        }

        // 返回调整后的难度信息
        return {
            newDifficulty: this.blockchain.difficulty,  // 新难度
            averageBlockTime: averageBlockTime,         // 平均出块时间
            targetTime: targetTime                      // 目标出块时间
        };
    }

    /**
     * 注销矿工
     * @param {string} minerAddress - 矿工地址
     * @returns {Object} 注销结果对象
     */
    unregisterMiner(minerAddress) {
        // 检查矿工是否存在
        if (!this.miners.has(minerAddress)) {
            throw new Error('Miner not found');
        }

        // 如果该矿工正在挖矿，先停止挖矿
        if (this.currentMiner === minerAddress) {
            this.stopMining(minerAddress);
        }

        // 从映射表中删除矿工信息
        this.miners.delete(minerAddress);
        this.miningStats.delete(minerAddress);

        // 返回注销成功结果
        return {
            success: true,
            message: 'Miner unregistered successfully'
        };
    }
}