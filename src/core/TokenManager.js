import { Transaction } from './Transaction.js';

export class TokenManager {
    /**
     * 代币管理器构造函数
     * @param {Blockchain} blockchain - 区块链实例
     */
    constructor(blockchain) {
        this.blockchain = blockchain;         // 区块链实例引用
        this.tokenName = 'CosmoCoin';         // 代币名称
        this.tokenSymbol = 'COSMO';           // 代币符号
    }

    /**
     * 铸造代币
     * 创建代币铸造交易并添加到待处理交易池
     * @param {string} toAddress - 接收代币的地址
     * @param {number} amount - 铸造的代币数量
     * @param {string} adminAddress - 管理员地址（可选）
     * @returns {Object} 包含交易信息的结果对象
     */
    mintTokens(toAddress, amount, adminAddress = null) {
        // 检查铸造数量必须为正数
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        // 检查铸造是否会超过总供应量
        if (this.blockchain.circulatingSupply + amount > this.blockchain.totalSupply) {
            throw new Error('Minting would exceed total supply');
        }

        // 创建铸造交易
        const mintTransaction = new Transaction(null, toAddress, amount, 'mint');
        
        // 将铸造交易添加到待处理交易池
        this.blockchain.pendingTransactions.push(mintTransaction);
        
        // 返回成功结果
        return {
            success: true,
            transaction: mintTransaction.toJSON(),
            message: `${amount} ${this.tokenSymbol} tokens queued for minting to ${toAddress}`
        };
    }

    /**
     * 销毁代币
     * 创建代币销毁交易并添加到待处理交易池
     * @param {string} fromAddress - 销毁代币的地址
     * @param {number} amount - 销毁的代币数量
     * @returns {Object} 包含交易信息的结果对象
     */
    burnTokens(fromAddress, amount) {
        // 检查销毁数量必须为正数
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        // 检查地址余额是否充足
        const balance = this.blockchain.getBalance(fromAddress);
        if (balance < amount) {
            throw new Error('Insufficient balance for burning');
        }

        // 创建销毁交易
        const burnTransaction = new Transaction(fromAddress, null, amount, 'burn');
        
        // 将销毁交易添加到待处理交易池
        this.blockchain.pendingTransactions.push(burnTransaction);
        
        // 返回成功结果
        return {
            success: true,
            transaction: burnTransaction.toJSON(),
            message: `${amount} ${this.tokenSymbol} tokens queued for burning from ${fromAddress}`
        };
    }

    /**
     * 获取代币信息
     * @returns {Object} 包含代币基本信息的对象
     */
    getTokenInfo() {
        return {
            name: this.tokenName,                    // 代币名称
            symbol: this.tokenSymbol,                // 代币符号
            totalSupply: this.blockchain.totalSupply, // 总供应量
            circulatingSupply: this.blockchain.circulatingSupply, // 流通供应量
            decimal: 18                              // 小数位数
        };
    }

    /**
     * 获取指定地址的代币余额
     * @param {string} address - 钱包地址
     * @returns {number} 地址的代币余额
     */
    getBalanceOf(address) {
        return this.blockchain.getBalance(address);
    }

    /**
     * 获取所有地址的余额
     * @returns {Object} 包含所有地址余额的对象
     */
    getAllBalances() {
        const balances = new Map();                     // 使用Map存储地址和余额的映射
        const transactions = this.blockchain.getAllTransactions(); // 获取所有交易
        
        // 遍历所有交易计算每个地址的余额
        transactions.forEach(tx => {
            // 如果有发送方，减少其余额
            if (tx.fromAddress) {
                const currentBalance = balances.get(tx.fromAddress) || 0;
                balances.set(tx.fromAddress, currentBalance - tx.amount);
            }
            
            // 如果有接收方且不是创世地址，增加其余额
            if (tx.toAddress && tx.toAddress !== 'genesis') {
                const currentBalance = balances.get(tx.toAddress) || 0;
                balances.set(tx.toAddress, currentBalance + tx.amount);
            }
        });

        // 将Map转换为对象并过滤掉零余额或负余额
        const result = {};
        balances.forEach((balance, address) => {
            if (balance > 0) {
                result[address] = balance;
            }
        });

        return result;
    }

    /**
     * 获取代币持有者排行榜
     * @param {number} limit - 返回的持有者数量限制
     * @returns {Array} 包含前N个持有者信息的数组
     */
    getTopHolders(limit = 10) {
        const balances = this.getAllBalances(); // 获取所有余额
        
        // 将余额对象转换为数组并按余额排序，取前N个
        return Object.entries(balances)
            .sort(([,a], [,b]) => b - a)  // 按余额降序排序
            .slice(0, limit)              // 取前limit个
            .map(([address, balance]) => ({
                address,                  // 地址
                balance,                  // 余额
                percentage: ((balance / this.blockchain.circulatingSupply) * 100).toFixed(2) // 占比
            }));
    }

    /**
     * 获取代币统计数据
     * @returns {Object} 包含代币统计信息的对象
     */
    getTokenStats() {
        const allBalances = this.getAllBalances();      // 获取所有余额
        const holders = Object.keys(allBalances).length; // 持有者数量
        const topHolders = this.getTopHolders(5);       // 前5名持有者
        
        // 返回代币统计信息
        return {
            tokenInfo: this.getTokenInfo(),             // 代币基本信息
            holders,                                    // 持有者总数
            topHolders,                                 // 前5名持有者
            averageBalance: holders > 0 ? (this.blockchain.circulatingSupply / holders).toFixed(2) : 0 // 平均持有量
        };
    }
}