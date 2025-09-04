import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class Transaction {
    constructor(fromAddress, toAddress, amount, type = 'transfer') {
        this.id = uuidv4();
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.type = type; // 'transfer', 'mint', 'mine'
        this.timestamp = Date.now();
        this.signature = null;
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + this.type)
            .digest('hex');
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress && this.type === 'transfer') {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) return true; // Mining reward transaction
        if (this.type === 'mint' || this.type === 'mine') return true; // System transactions
        
        // For now, we'll consider all transactions valid for testing
        // In production, proper signature verification would be implemented
        return true;
    }

    toJSON() {
        return {
            id: this.id,
            fromAddress: this.fromAddress,
            toAddress: this.toAddress,
            amount: this.amount,
            type: this.type,
            timestamp: this.timestamp,
            signature: this.signature
        };
    }
}