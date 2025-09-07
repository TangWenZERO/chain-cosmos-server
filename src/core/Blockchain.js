import { Block } from './Block.js';
import { Transaction } from './Transaction.js';

export class Blockchain {
    /**
     * 区块链构造函数
     * 初始化区块链，创建创世区块并设置初始参数
     */
    constructor() {
        this.chain = [this.createGenesisBlock()];     // 初始化区块链，包含创世区块
        this.difficulty = 2;                          // 挖矿难度
        this.pendingTransactions = [];                // 待处理交易池
        this.miningReward = 100;                      // 挖矿奖励
        this.totalSupply = 1000000;                   // 总供应量
        this.circulatingSupply = 0;                   // 流通供应量
    }

    /**
     * 创建创世区块
     * 创世区块是区块链的第一个区块，包含初始供应量的铸造交易
     * @returns {Block} 创世区块对象
     */
    createGenesisBlock() {
        // 创建包含初始供应量的铸造交易
        const genesisTransactions = [
            new Transaction(null, 'genesis', this.totalSupply, 'mint')
        ];
        // 创建并返回创世区块
        return new Block(Date.now(), genesisTransactions, '0');
    }

    /**
     * 获取最新的区块
     * @returns {Block} 区块链中最新的区块
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * 挖掘待处理交易
     * 将待处理交易打包成新区块并添加到区块链中
     * @param {string} miningRewardAddress - 接收挖矿奖励的地址
     */
    minePendingTransactions(miningRewardAddress) {
        // 创建挖矿奖励交易
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 'mine');
        // 将挖矿奖励交易添加到待处理交易列表
        this.pendingTransactions.push(rewardTx);

        // 创建新区块
        const block = new Block(
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        // 进行工作量证明挖矿
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        // 将新区块添加到区块链
        this.chain.push(block);
        // 增加流通供应量（挖矿奖励）
        this.circulatingSupply += this.miningReward;
        // 清空待处理交易列表
        this.pendingTransactions = [];
    }

    /**
     * 创建新交易
     * 验证交易有效性并将其添加到待处理交易池
     * @param {Transaction} transaction - 要添加的交易对象
     */
    createTransaction(transaction) {
        // 检查交易是否包含发送方和接收方地址
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        // 验证交易的有效性
        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        // 检查交易金额是否大于0
        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
        }

        // 检查发送方余额是否充足
        const walletBalance = this.getBalance(transaction.fromAddress);
        if (walletBalance < transaction.amount) {
            throw new Error('Not enough balance');
        }

        // 将交易添加到待处理交易池
        this.pendingTransactions.push(transaction);
    }

    /**
     * 获取指定地址的余额
     * 通过遍历整个区块链计算指定地址的余额
     * @param {string} address - 钱包地址
     * @returns {number} 地址的余额
     */
    getBalance(address) {
        let balance = 0; // 初始化余额为0

        // 遍历区块链中的每个区块
        for (const block of this.chain) {
            // 遍历区块中的每笔交易
            for (const trans of block.transactions) {
                // 如果是发送方，减少余额
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                // 如果是接收方，增加余额
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    /**
     * 获取所有交易记录
     * @returns {Array} 包含所有交易的数组
     */
    getAllTransactions() {
        const transactions = []; // 初始化交易数组
        // 遍历区块链中的每个区块
        for (const block of this.chain) {
            // 遍历区块中的每笔交易
            for (const trans of block.transactions) {
                transactions.push(trans);
            }
        }
        return transactions;
    }

    /**
     * 验证区块链的完整性
     * 检查所有区块的哈希值和链接是否正确
     * @returns {boolean} 区块链有效返回true，否则返回false
     */
    isChainValid() {
        // 从第二个区块开始验证（跳过创世区块）
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];     // 当前区块
            const previousBlock = this.chain[i - 1]; // 前一个区块

            // 验证当前区块中的交易有效性
            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            // 验证当前区块的哈希值是否正确
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            // 验证当前区块的前哈希值是否与前一个区块的哈希值匹配
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }

    /**
     * 根据哈希值查找区块
     * @param {string} hash - 区块的哈希值
     * @returns {Block|undefined} 找到的区块或undefined
     */
    getBlockByHash(hash) {
        return this.chain.find(block => block.hash === hash);
    }

    /**
     * 根据索引获取区块
     * @param {number} index - 区块在链中的索引
     * @returns {Block} 对应索引的区块
     */
    getBlockByIndex(index) {
        return this.chain[index];
    }

    /**
     * 获取区块链长度
     * @returns {number} 区块链中区块的数量
     */
    getChainLength() {
        return this.chain.length;
    }

    /**
     * 获取区块链基本信息
     * @returns {Object} 包含区块链基本信息的对象
     */
    getChainInfo() {
        return {
            length: this.chain.length,                    // 区块链长度
            difficulty: this.difficulty,                  // 挖矿难度
            totalSupply: this.totalSupply,                // 总供应量
            circulatingSupply: this.circulatingSupply,    // 流通供应量
            pendingTransactions: this.pendingTransactions.length // 待处理交易数量
        };
    }

    /**
     * 将区块链对象转换为JSON格式
     * @returns {Object} 包含区块链数据的JSON对象
     */
    toJSON() {
        return {
            chain: this.chain.map(block => block.toJSON()), // 将所有区块转换为JSON
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.map(tx => tx.toJSON()), // 将待处理交易转换为JSON
            miningReward: this.miningReward,
            totalSupply: this.totalSupply,
            circulatingSupply: this.circulatingSupply
        };
    }
}