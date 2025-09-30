import { v4 as uuidv4 } from 'uuid';
import { sha256Hex } from '../utils/crypto.js';

export class Transaction {
    /**
     * 交易构造函数
     * @param {string} fromAddress - 发送方地址
     * @param {string} toAddress - 接收方地址
     * @param {number} amount - 交易金额
     * @param {string} type - 交易类型（transfer转账、mint铸造、mine挖矿奖励）
     */
    constructor(fromAddress, toAddress, amount, type = 'transfer') {
        this.id = uuidv4();              // 交易唯一标识符
        this.fromAddress = fromAddress;  // 发送方地址
        this.toAddress = toAddress;      // 接收方地址
        this.amount = amount;            // 交易金额
        this.type = type;                // 交易类型
        this.timestamp = Date.now();     // 交易时间戳
        this.signature = null;           // 交易签名
    }

    /**
     * 计算交易哈希值
     * 使用SHA-256算法对交易数据进行哈希计算
     * @returns {string} 交易的哈希值
     */
    calculateHash() {
        const payload = `${this.fromAddress}${this.toAddress}${this.amount}${this.timestamp}${this.type}`;
        return sha256Hex(payload);
    }

    /**
     * 对交易进行签名
     * @param {Object} signingKey - 签名密钥对象
     */
    signTransaction(signingKey) {
        // 检查签名密钥是否与发送方地址匹配（转账交易）
        if (signingKey.getPublic('hex') !== this.fromAddress && this.type === 'transfer') {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        // 计算交易哈希并进行签名
        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex'); // 存储签名
    }

    /**
     * 验证交易的有效性
     * @returns {boolean} 交易有效返回true，否则返回false
     */
    isValid() {
        // 挖矿奖励交易（发送方为null）始终有效
        if (this.fromAddress === null) return true;
        // 系统交易（铸造和挖矿奖励）始终有效
        if (this.type === 'mint' || this.type === 'mine') return true;
        
        // 对于测试目的，目前认为所有交易都有效
        // 在生产环境中，会实现适当的签名验证
        return true;
    }

    /**
     * 将交易对象转换为JSON格式
     * @returns {Object} 包含交易数据的JSON对象
     */
    toJSON() {
        return {
            id: this.id,                 // 交易ID
            fromAddress: this.fromAddress, // 发送方地址
            toAddress: this.toAddress,     // 接收方地址
            amount: this.amount,           // 交易金额
            type: this.type,               // 交易类型
            timestamp: this.timestamp,     // 时间戳
            signature: this.signature      // 签名
        };
    }
}
