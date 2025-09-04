import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class Wallet {
    constructor() {
        this.privateKey = this.generatePrivateKey();
        this.publicKey = this.generatePublicKey();
        this.address = this.generateAddress();
        this.id = uuidv4();
    }

    generatePrivateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    generatePublicKey() {
        const hash = crypto.createHash('sha256');
        hash.update(this.privateKey);
        return hash.digest('hex');
    }

    generateAddress() {
        const hash1 = crypto.createHash('sha256');
        hash1.update(this.publicKey);
        const hash1Result = hash1.digest('hex');

        const hash2 = crypto.createHash('ripemd160');
        hash2.update(hash1Result, 'hex');
        
        return 'cosmo' + hash2.digest('hex');
    }

    sign(message) {
        const hmac = crypto.createHmac('sha256', this.privateKey);
        hmac.update(message);
        return hmac.digest('hex');
    }

    verify(message, signature) {
        const expectedSignature = this.sign(message);
        return signature === expectedSignature;
    }

    getWalletInfo() {
        return {
            id: this.id,
            address: this.address,
            publicKey: this.publicKey,
            // Private key should never be exposed in production
        };
    }

    exportWallet() {
        return {
            id: this.id,
            address: this.address,
            publicKey: this.publicKey,
            privateKey: this.privateKey // Only for export/backup purposes
        };
    }

    static importWallet(walletData) {
        const wallet = new Wallet();
        wallet.id = walletData.id;
        wallet.privateKey = walletData.privateKey;
        wallet.publicKey = walletData.publicKey;
        wallet.address = walletData.address;
        return wallet;
    }
}

export class WalletManager {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.wallets = new Map();
    }

    createWallet() {
        const wallet = new Wallet();
        this.wallets.set(wallet.address, wallet);
        
        return {
            success: true,
            wallet: wallet.getWalletInfo(),
            message: 'Wallet created successfully'
        };
    }

    getWallet(address) {
        const wallet = this.wallets.get(address);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        
        return {
            wallet: wallet.getWalletInfo(),
            balance: this.blockchain.getBalance(address)
        };
    }

    getAllWallets() {
        const walletsInfo = [];
        
        this.wallets.forEach((wallet, address) => {
            walletsInfo.push({
                ...wallet.getWalletInfo(),
                balance: this.blockchain.getBalance(address)
            });
        });

        return walletsInfo;
    }

    importWallet(privateKey) {
        try {
            const walletData = {
                id: uuidv4(),
                privateKey: privateKey,
                publicKey: '',
                address: ''
            };

            const wallet = Wallet.importWallet(walletData);
            // Regenerate public key and address from private key
            wallet.publicKey = wallet.generatePublicKey();
            wallet.address = wallet.generateAddress();
            
            this.wallets.set(wallet.address, wallet);

            return {
                success: true,
                wallet: wallet.getWalletInfo(),
                message: 'Wallet imported successfully'
            };
        } catch (error) {
            throw new Error('Invalid private key format');
        }
    }

    exportWallet(address) {
        const wallet = this.wallets.get(address);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return {
            success: true,
            walletData: wallet.exportWallet(),
            message: 'Wallet exported successfully'
        };
    }

    deleteWallet(address) {
        if (!this.wallets.has(address)) {
            throw new Error('Wallet not found');
        }

        this.wallets.delete(address);

        return {
            success: true,
            message: 'Wallet deleted successfully'
        };
    }

    getWalletCount() {
        return this.wallets.size;
    }

    isValidAddress(address) {
        return address && address.startsWith('cosmo') && address.length === 45;
    }
}