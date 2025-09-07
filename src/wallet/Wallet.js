import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class Wallet {
    /**
     * 钱包构造函数
     * 自动生成私钥、公钥和地址
     */
    constructor() {
        this.privateKey = this.generatePrivateKey();  // 生成私钥
        this.publicKey = this.generatePublicKey();    // 生成公钥
        this.address = this.generateAddress();        // 生成地址
        this.id = uuidv4();                           // 生成唯一ID
    }

    /**
     * 生成私钥
     * 使用crypto模块生成32字节的随机数据作为私钥
     * @returns {string} 64字符的十六进制私钥字符串
     */
    generatePrivateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * 生成公钥
     * 对私钥进行SHA-256哈希运算生成公钥
     * @returns {string} 64字符的十六进制公钥字符串
     */
    generatePublicKey() {
        const hash = crypto.createHash('sha256');
        hash.update(this.privateKey);
        return hash.digest('hex');
    }

    /**
     * 生成钱包地址
     * 对公钥进行SHA-256和RIPEMD-160双重哈希，然后添加'cosmo'前缀
     * @returns {string} 以'cosmo'开头的45字符钱包地址
     */
    generateAddress() {
        // 对公钥进行SHA-256哈希
        const hash1 = crypto.createHash('sha256');
        hash1.update(this.publicKey);
        const hash1Result = hash1.digest('hex');

        // 对SHA-256结果进行RIPEMD-160哈希
        const hash2 = crypto.createHash('ripemd160');
        hash2.update(hash1Result, 'hex');
        
        // 添加'cosmo'前缀生成最终地址
        return 'cosmo' + hash2.digest('hex');
    }

    /**
     * 对消息进行签名
     * 使用HMAC-SHA256算法和私钥对消息进行签名
     * @param {string} message - 要签名的消息
     * @returns {string} 消息签名
     */
    sign(message) {
        const hmac = crypto.createHmac('sha256', this.privateKey);
        hmac.update(message);
        return hmac.digest('hex');
    }

    /**
     * 验证消息签名
     * 使用相同算法生成期望签名并与提供的签名比较
     * @param {string} message - 要验证的消息
     * @param {string} signature - 提供的签名
     * @returns {boolean} 签名有效返回true，否则返回false
     */
    verify(message, signature) {
        const expectedSignature = this.sign(message);
        return signature === expectedSignature;
    }

    /**
     * 获取钱包信息（不包含私钥）
     * @returns {Object} 包含钱包公开信息的对象
     */
    getWalletInfo() {
        return {
            id: this.id,           // 钱包唯一ID
            address: this.address, // 钱包地址
            publicKey: this.publicKey
            // 私钥在生产环境中永远不应该暴露
        };
    }

    /**
     * 导出钱包（包含私钥）
     * @returns {Object} 包含完整钱包数据的对象
     */
    exportWallet() {
        return {
            id: this.id,             // 钱包唯一ID
            address: this.address,   // 钱包地址
            publicKey: this.publicKey, // 公钥
            privateKey: this.privateKey // 私钥（仅用于导出/备份目的）
        };
    }

    /**
     * 导入钱包
     * @param {Object} walletData - 钱包数据对象
     * @returns {Wallet} 导入的钱包实例
     */
    static importWallet(walletData) {
        const wallet = new Wallet();
        wallet.id = walletData.id;           // 设置ID
        wallet.privateKey = walletData.privateKey; // 设置私钥
        wallet.publicKey = walletData.publicKey;   // 设置公钥
        wallet.address = walletData.address;       // 设置地址
        return wallet;
    }
}

export class WalletManager {
    /**
     * 钱包管理器构造函数
     * @param {Blockchain} blockchain - 区块链实例
     */
    constructor(blockchain) {
        this.blockchain = blockchain;  // 区块链实例引用
        this.wallets = new Map();      // 钱包映射表
    }

    /**
     * 创建新钱包
     * @returns {Object} 创建结果对象
     */
    createWallet() {
        const wallet = new Wallet();                    // 创建新钱包
        this.wallets.set(wallet.address, wallet);       // 将钱包存储到映射表中
        
        // 返回创建成功结果
        return {
            success: true,
            wallet: wallet.getWalletInfo(),             // 钱包信息
            message: 'Wallet created successfully'
        };
    }

    /**
     * 获取指定地址的钱包信息
     * @param {string} address - 钱包地址
     * @returns {Object} 包含钱包信息和余额的对象
     */
    getWallet(address) {
        const wallet = this.wallets.get(address);       // 根据地址获取钱包
        if (!wallet) {
            throw new Error('Wallet not found');        // 钱包不存在时抛出异常
        }
        
        // 返回钱包信息和余额
        return {
            wallet: wallet.getWalletInfo(),             // 钱包信息
            balance: this.blockchain.getBalance(address) // 钱包余额
        };
    }

    /**
     * 获取所有钱包信息
     * @returns {Array} 包含所有钱包信息和余额的数组
     */
    getAllWallets() {
        const walletsInfo = []; // 存储钱包信息的数组
        
        // 遍历所有钱包
        this.wallets.forEach((wallet, address) => {
            walletsInfo.push({
                ...wallet.getWalletInfo(),              // 钱包信息
                balance: this.blockchain.getBalance(address) // 钱包余额
            });
        });

        return walletsInfo;
    }

    /**
     * 导入钱包（通过私钥）
     * @param {string} privateKey - 私钥
     * @returns {Object} 导入结果对象
     */
    importWallet(privateKey) {
        try {
            // 创建钱包数据对象
            const walletData = {
                id: uuidv4(),          // 生成新ID
                privateKey: privateKey, // 设置私钥
                publicKey: '',
                address: ''
            };

            const wallet = Wallet.importWallet(walletData);
            // 从私钥重新生成公钥和地址
            wallet.publicKey = wallet.generatePublicKey();
            wallet.address = wallet.generateAddress();
            
            // 将钱包存储到映射表中
            this.wallets.set(wallet.address, wallet);

            // 返回导入成功结果
            return {
                success: true,
                wallet: wallet.getWalletInfo(),
                message: 'Wallet imported successfully'
            };
        } catch (error) {
            throw new Error('Invalid private key format');
        }
    }

    /**
     * 导出钱包数据
     * @param {string} address - 钱包地址
     * @returns {Object} 导出结果对象
     */
    exportWallet(address) {
        const wallet = this.wallets.get(address);       // 根据地址获取钱包
        if (!wallet) {
            throw new Error('Wallet not found');        // 钱包不存在时抛出异常
        }

        // 返回导出成功结果
        return {
            success: true,
            walletData: wallet.exportWallet(),          // 钱包数据
            message: 'Wallet exported successfully'
        };
    }

    /**
     * 删除钱包
     * @param {string} address - 钱包地址
     * @returns {Object} 删除结果对象
     */
    deleteWallet(address) {
        if (!this.wallets.has(address)) {
            throw new Error('Wallet not found');        // 钱包不存在时抛出异常
        }

        this.wallets.delete(address);                   // 从映射表中删除钱包

        // 返回删除成功结果
        return {
            success: true,
            message: 'Wallet deleted successfully'
        };
    }

    /**
     * 获取钱包数量
     * @returns {number} 钱包总数
     */
    getWalletCount() {
        return this.wallets.size;
    }

    /**
     * 验证钱包地址格式
     * @param {string} address - 钱包地址
     * @returns {boolean} 地址有效返回true，否则返回false
     */
    isValidAddress(address) {
        // 检查地址是否以'cosmo'开头且长度为45字符
        return address && address.startsWith('cosmo') && address.length === 45;
    }
}