import { Transaction } from './Transaction.js';

export class TransferManager {
    /**
     * 转账管理器构造函数
     * @param {Blockchain} blockchain - 区块链实例
     * @param {WalletManager} walletManager - 钱包管理器实例
     */
    constructor(blockchain, walletManager) {
        this.blockchain = blockchain;         // 区块链实例引用
        this.walletManager = walletManager;   // 钱包管理器实例引用
    }

    /**
     * 创建转账交易
     * 验证转账参数，创建交易并添加到区块链中
     * @param {string} fromAddress - 发送方地址
     * @param {string} toAddress - 接收方地址
     * @param {number} amount - 转账金额
     * @param {string} privateKey - 私钥（可选）
     * @returns {Object} 包含交易信息的结果对象
     */
    createTransfer(fromAddress, toAddress, amount, privateKey = null) {
        // 参数验证
        if (!fromAddress || !toAddress) {
            throw new Error('From and to addresses are required');
        }

        // 地址格式验证
        if (!this.walletManager.isValidAddress(fromAddress) || !this.walletManager.isValidAddress(toAddress)) {
            throw new Error('Invalid address format');
        }

        // 金额验证
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        // 检查是否发送给自己
        if (fromAddress === toAddress) {
            throw new Error('Cannot transfer to the same address');
        }

        // 余额检查
        const balance = this.blockchain.getBalance(fromAddress);
        if (balance < amount) {
            throw new Error(`Insufficient balance. Available: ${balance}, Required: ${amount}`);
        }

        // 创建交易对象
        const transaction = new Transaction(fromAddress, toAddress, amount, 'transfer');

        // 如果提供了私钥，则对交易进行签名
        if (privateKey) {
            const wallet = this.walletManager.wallets.get(fromAddress);
            if (wallet && wallet.privateKey === privateKey) {
                const signature = wallet.sign(transaction.calculateHash());
                transaction.signature = signature;
            } else {
                throw new Error('Invalid private key or wallet not found');
            }
        }

        // 将交易添加到区块链
        this.blockchain.createTransaction(transaction);

        // 返回成功结果
        return {
            success: true,
            transaction: transaction.toJSON(),
            message: `Transfer of ${amount} COSMO from ${fromAddress} to ${toAddress} has been queued`
        };
    }

    /**
     * 获取指定地址的交易历史
     * @param {string} address - 钱包地址
     * @param {number} limit - 返回交易数量限制
     * @returns {Array} 包含交易历史的数组
     */
    getTransactionHistory(address, limit = 50) {
        // 获取所有交易记录
        const allTransactions = this.blockchain.getAllTransactions();
        
        // 筛选出与指定地址相关的交易
        const userTransactions = allTransactions.filter(tx => 
            tx.fromAddress === address || tx.toAddress === address
        );

        // 按时间戳降序排序（最新的在前）
        userTransactions.sort((a, b) => b.timestamp - a.timestamp);

        // 返回指定数量的交易并添加额外信息
        return userTransactions.slice(0, limit).map(tx => ({
            ...tx.toJSON(),
            type: this.determineTransactionType(tx, address), // 确定交易类型（发送/接收）
            date: new Date(tx.timestamp).toISOString()         // 格式化时间
        }));
    }

    /**
     * 确定交易相对于指定用户地址的类型
     * @param {Transaction} transaction - 交易对象
     * @param {string} userAddress - 用户地址
     * @returns {string} 交易类型（sent发送、received接收、self自己、unknown未知）
     */
    determineTransactionType(transaction, userAddress) {
        // 自己转给自己
        if (transaction.fromAddress === userAddress && transaction.toAddress === userAddress) {
            return 'self';
        }
        // 发送交易
        if (transaction.fromAddress === userAddress) {
            return 'sent';
        }
        // 接收交易
        if (transaction.toAddress === userAddress) {
            return 'received';
        }
        // 未知类型
        return 'unknown';
    }

    /**
     * 获取待处理交易列表
     * @param {string} address - 可选，筛选特定地址的交易
     * @returns {Array} 包含待处理交易的数组
     */
    getPendingTransactions(address = null) {
        // 获取所有待处理交易
        let pendingTxs = this.blockchain.pendingTransactions;
        
        // 如果指定了地址，则筛选该地址相关的交易
        if (address) {
            pendingTxs = pendingTxs.filter(tx => 
                tx.fromAddress === address || tx.toAddress === address
            );
        }

        // 返回待处理交易并添加状态信息
        return pendingTxs.map(tx => ({
            ...tx.toJSON(),
            status: 'pending' // 添加待处理状态
        }));
    }

    /**
     * 根据交易ID获取交易详情
     * @param {string} transactionId - 交易ID
     * @returns {Object} 包含交易详情和区块信息的对象
     */
    getTransactionById(transactionId) {
        // 获取所有交易记录
        const allTransactions = this.blockchain.getAllTransactions();
        // 根据ID查找交易
        const transaction = allTransactions.find(tx => tx.id === transactionId);
        
        // 如果未找到交易，抛出异常
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // 查找包含此交易的区块信息
        let blockInfo = null;
        for (let i = 0; i < this.blockchain.chain.length; i++) {
            const block = this.blockchain.chain[i];
            const txInBlock = block.transactions.find(tx => tx.id === transactionId);
            if (txInBlock) {
                blockInfo = {
                    blockIndex: i,              // 区块索引
                    blockHash: block.hash,      // 区块哈希
                    blockTimestamp: block.timestamp, // 区块时间戳
                    confirmations: this.blockchain.chain.length - i // 确认数
                };
                break;
            }
        }

        // 返回交易详情
        return {
            ...transaction.toJSON(),
            block: blockInfo,                    // 区块信息
            date: new Date(transaction.timestamp).toISOString() // 格式化时间
        };
    }

    /**
     * 获取转账统计信息
     * @param {string} address - 可选，指定地址的统计信息
     * @returns {Object} 包含转账统计信息的对象
     */
    getTransferStats(address = null) {
        // 获取所有交易记录
        const allTransactions = this.blockchain.getAllTransactions();
        let relevantTxs = allTransactions;

        // 如果指定了地址，则筛选该地址相关的交易
        if (address) {
            relevantTxs = allTransactions.filter(tx => 
                tx.fromAddress === address || tx.toAddress === address
            );
        }

        // 筛选出转账类型的交易
        const transferTxs = relevantTxs.filter(tx => tx.type === 'transfer');
        
        // 计算基础统计信息
        const stats = {
            totalTransactions: relevantTxs.length,           // 总交易数
            totalTransfers: transferTxs.length,              // 转账交易数
            totalVolume: transferTxs.reduce((sum, tx) => sum + tx.amount, 0), // 总交易量
            averageAmount: transferTxs.length > 0 ? 
                (transferTxs.reduce((sum, tx) => sum + tx.amount, 0) / transferTxs.length).toFixed(2) : 0 // 平均交易金额
        };

        // 如果指定了地址，计算发送和接收的详细信息
        if (address) {
            const sentTxs = transferTxs.filter(tx => tx.fromAddress === address);    // 发送的交易
            const receivedTxs = transferTxs.filter(tx => tx.toAddress === address);  // 接收的交易
            
            // 添加发送统计
            stats.sent = {
                count: sentTxs.length,                        // 发送交易数
                amount: sentTxs.reduce((sum, tx) => sum + tx.amount, 0) // 发送总金额
            };
            
            // 添加接收统计
            stats.received = {
                count: receivedTxs.length,                     // 接收交易数
                amount: receivedTxs.reduce((sum, tx) => sum + tx.amount, 0) // 接收总金额
            };
        }

        return stats;
    }

    /**
     * 估算交易手续费
     * @param {number} amount - 交易金额
     * @returns {number} 估算的手续费
     */
    estimateTransactionFee(amount) {
        // 简单的手续费计算（在真实的区块链中会更复杂）
        const baseFee = 0.01;                    // 基础手续费
        const percentageFee = amount * 0.001;    // 按金额比例计算的手续费（0.1%）
        // 返回基础手续费和比例手续费中的较大值
        return Math.max(baseFee, percentageFee);
    }

    /**
     * 验证转账请求参数
     * @param {string} fromAddress - 发送方地址
     * @param {string} toAddress - 接收方地址
     * @param {number} amount - 转账金额
     * @returns {Object} 包含验证结果和错误信息的对象
     */
    validateTransferRequest(fromAddress, toAddress, amount) {
        const errors = []; // 错误信息数组

        // 基本参数验证
        if (!fromAddress) errors.push('From address is required');
        if (!toAddress) errors.push('To address is required');
        if (!amount || amount <= 0) errors.push('Amount must be greater than 0');

        // 地址格式验证
        if (fromAddress && !this.walletManager.isValidAddress(fromAddress)) {
            errors.push('Invalid from address format');
        }

        if (toAddress && !this.walletManager.isValidAddress(toAddress)) {
            errors.push('Invalid to address format');
        }

        // 检查是否发送给自己
        if (fromAddress === toAddress) {
            errors.push('Cannot transfer to the same address');
        }

        // 余额验证
        if (fromAddress && amount > 0) {
            const balance = this.blockchain.getBalance(fromAddress);
            if (balance < amount) {
                errors.push(`Insufficient balance. Available: ${balance}, Required: ${amount}`);
            }
        }

        // 返回验证结果
        return {
            valid: errors.length === 0, // 是否有效
            errors                      // 错误信息列表
        };
    }
}