const INITIAL_STATE = {
    blockchain: null,
    wallets: [],
    mining: null,
    updatedAt: null
};

let state = cloneValue(INITIAL_STATE);

function cloneValue(value) {
    if (value === undefined || value === null) {
        return value;
    }
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function updateTimestamp() {
    state.updatedAt = new Date().toISOString();
}

export function initializeState() {
    if (!state.updatedAt) {
        updateTimestamp();
    }
    return readState();
}

export function saveBlockchainState(blockchain) {
    if (!blockchain || typeof blockchain.toJSON !== 'function') {
        return;
    }
    state.blockchain = cloneValue(blockchain.toJSON());
    updateTimestamp();
}

export function saveWalletState(walletManager) {
    if (!walletManager || typeof walletManager.toJSON !== 'function') {
        return;
    }
    state.wallets = cloneValue(walletManager.toJSON({ includePrivate: true }));
    updateTimestamp();
}

export function saveMiningState(miningManager) {
    if (!miningManager || typeof miningManager.toJSON !== 'function') {
        return;
    }
    state.mining = cloneValue(miningManager.toJSON());
    updateTimestamp();
}

export function readState() {
    return cloneValue(state);
}

export function resetState() {
    state = cloneValue(INITIAL_STATE);
    updateTimestamp();
    return readState();
}
