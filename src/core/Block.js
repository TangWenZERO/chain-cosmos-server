import { sha256Hex } from '../utils/crypto.js';

export class Block {
    /**
     * 区块构造函数
     * @param {number} timestamp - 时间戳
     * @param {Array} transactions - 交易数组
     * @param {string} previousHash - 前一个区块的哈希值
     */
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;           // 区块时间戳
        this.transactions = transactions;     // 区块包含的交易列表
        this.previousHash = previousHash;     // 前一个区块的哈希值
        this.nonce = 0;                       // 工作量证明随机数
        this.hash = this.calculateHash();     // 当前区块的哈希值
    }

    /**
     * 计算区块哈希值
     * 使用SHA-256算法对区块数据进行哈希计算
     * @returns {string} 区块的哈希值
     */
    calculateHash() {
        const payload = `${this.previousHash}${this.timestamp}${JSON.stringify(this.transactions)}${this.nonce}`;
        return sha256Hex(payload);
    }

    /**
     * 挖矿函数 - 通过调整nonce值找到符合难度要求的哈希值
     * @param {number} difficulty - 挖矿难度，表示哈希值前导零的个数
     */
    mineBlock(difficulty) {
        // 构造目标哈希值（前导零字符串）
        const target = Array(difficulty + 1).join('0');
        
        // 持续计算哈希值直到满足难度要求
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;                     // 增加随机数
            this.hash = this.calculateHash(); // 重新计算哈希值
        }

        console.log(`Block mined: ${this.hash}`);
    }

    /**
     * 验证区块内所有交易的有效性
     * @returns {boolean} 所有交易都有效返回true，否则返回false
     */
    hasValidTransactions() {
        // 遍历区块中的所有交易
        for (const tx of this.transactions) {
            // 如果有任何交易无效，则整个区块无效
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }

    /**
     * 将区块对象转换为JSON格式
     * @returns {Object} 包含区块数据的JSON对象
     */
    toJSON() {
        return {
            timestamp: this.timestamp,
            transactions: this.transactions.map(tx => tx.toJSON()), // 将交易列表也转换为JSON
            previousHash: this.previousHash,
            nonce: this.nonce,
            hash: this.hash
        };
    }
}
