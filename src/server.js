import { Blockchain } from './core/Blockchain.js';
import { TokenManager } from './core/TokenManager.js';
import { TransferManager } from './core/TransferManager.js';
import { WalletManager } from './wallet/Wallet.js';
import { MiningManager } from './mining/MiningManager.js';

import { blockchainRoutes } from './api/routes/blockchain.js';
import { walletRoutes } from './api/routes/wallet.js';
import { transferRoutes } from './api/routes/transfer.js';
import { miningRoutes } from './api/routes/mining.js';
import { tokenRoutes } from './api/routes/token.js';

const DEFAULT_CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
    }
}

class Reply {
    constructor() {
        this.statusCode = 200;
        this.sent = false;
        this.headers = new Headers();
        this.payload = undefined;
    }

    code(statusCode) {
        this.statusCode = statusCode;
        return this;
    }

    header(name, value) {
        this.headers.set(name, value);
        return this;
    }

    send(payload) {
        this.payload = payload;
        this.sent = true;
        return this;
    }
}

class WorkerFastifyAdapter {
    constructor() {
        this.routes = [];
        this.prefixStack = [''];
        this.errorHandler = async (error, request, reply) => {
            this.log.error?.(error);
            reply.code(error.statusCode ?? 500).send({
                success: false,
                error: error.statusCode ? error.message : 'Internal Server Error',
                message: error.statusCode ? undefined : error.message,
                timestamp: new Date().toISOString()
            });
        };
        this.notFoundHandler = async (request, reply) => {
            reply.code(404).send({
                success: false,
                error: 'Route not found',
                message: `Route ${request.method} ${new URL(request.url).pathname} not found`,
                timestamp: new Date().toISOString()
            });
        };
        this.log = console;
    }

    decorate(name, value) {
        this[name] = value;
    }

    get currentPrefix() {
        return this.prefixStack[this.prefixStack.length - 1] || '';
    }

    normalizePrefix(prefix = '') {
        if (!prefix) {
            return '';
        }
        let cleaned = prefix.startsWith('/') ? prefix : `/${prefix}`;
        if (cleaned.length > 1 && cleaned.endsWith('/')) {
            cleaned = cleaned.slice(0, -1);
        }
        return cleaned;
    }

    normalizeRoutePath(path = '/') {
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return path || '/';
    }

    combinePaths(base, addition) {
        if (!addition) {
            return base || '';
        }
        if (!base) {
            return addition === '/' ? '' : addition;
        }
        const normalizedAddition = addition.startsWith('/') ? addition : `/${addition}`;
        let combined = `${base}${normalizedAddition}`;
        if (combined.length > 1 && combined.endsWith('/')) {
            combined = combined.slice(0, -1);
        }
        return combined;
    }

    tokenizePath(path) {
        if (!path || path === '/') {
            return [];
        }
        return path.replace(/^\/+|\/+$/g, '').split('/').map(segment => {
            if (segment.startsWith(':')) {
                return { type: 'param', name: segment.slice(1) };
            }
            return { type: 'literal', value: segment };
        });
    }

    matchRoute(method, path) {
        const normalizedPath = this.normalizeRoutePath(path);
        const requestSegments = this.tokenizeRequest(normalizedPath);
        for (const route of this.routes) {
            if (route.method !== method) {
                continue;
            }
            if (route.tokens.length !== requestSegments.length) {
                continue;
            }
            const params = {};
            let matched = true;
            for (let i = 0; i < route.tokens.length; i += 1) {
                const token = route.tokens[i];
                const value = requestSegments[i];
                if (token.type === 'literal') {
                    if (token.value !== value) {
                        matched = false;
                        break;
                    }
                } else {
                    params[token.name] = value;
                }
            }
            if (matched) {
                return { handler: route.handler, params, definition: route };
            }
        }
        return null;
    }

    tokenizeRequest(path) {
        if (!path || path === '/') {
            return [];
        }
        return path.replace(/^\/+|\/+$/g, '').split('/').map(segment => decodeURIComponent(segment));
    }

    extractHandler(optsOrHandler, maybeHandler) {
        if (typeof optsOrHandler === 'function') {
            return optsOrHandler;
        }
        return maybeHandler;
    }

    registerRoute(method, path, optsOrHandler, maybeHandler) {
        const handler = this.extractHandler(optsOrHandler, maybeHandler);
        if (typeof handler !== 'function') {
            throw new Error(`Handler for ${method} ${path} must be a function`);
        }
        const normalizedPath = this.normalizeRoutePath(path);
        const fullPath = this.combinePaths(this.currentPrefix, normalizedPath);
        const tokens = this.tokenizePath(fullPath || '/');
        this.routes.push({ method, handler, path: fullPath || '/', tokens });
    }

    get(path, optsOrHandler, maybeHandler) {
        this.registerRoute('GET', path, optsOrHandler, maybeHandler);
    }

    post(path, optsOrHandler, maybeHandler) {
        this.registerRoute('POST', path, optsOrHandler, maybeHandler);
    }

    put(path, optsOrHandler, maybeHandler) {
        this.registerRoute('PUT', path, optsOrHandler, maybeHandler);
    }

    delete(path, optsOrHandler, maybeHandler) {
        this.registerRoute('DELETE', path, optsOrHandler, maybeHandler);
    }

    setErrorHandler(handler) {
        this.errorHandler = handler;
    }

    setNotFoundHandler(handler) {
        this.notFoundHandler = handler;
    }

    async register(plugin, options = {}) {
        const normalizedPrefix = this.normalizePrefix(options.prefix || '');
        const parentPrefix = this.currentPrefix;
        const nextPrefix = this.combinePaths(parentPrefix, normalizedPrefix);
        this.prefixStack.push(nextPrefix);
        try {
            await plugin(this, options);
        } finally {
            this.prefixStack.pop();
        }
    }

    async buildRequestObject(request, url, params) {
        const query = {};
        for (const [key, value] of url.searchParams.entries()) {
            if (query[key] === undefined) {
                query[key] = value;
            } else if (Array.isArray(query[key])) {
                query[key].push(value);
            } else {
                query[key] = [query[key], value];
            }
        }

        const wrapper = {
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries()),
            query,
            params,
            body: undefined,
            raw: request,
            fastify: this,
            log: this.log
        };

        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    wrapper.body = await request.clone().json();
                } catch (error) {
                    throw new HttpError(400, 'Invalid JSON body');
                }
            } else if (contentType.includes('text/plain')) {
                wrapper.body = await request.clone().text();
            } else if (contentType) {
                wrapper.body = await request.clone().arrayBuffer();
            }
        }

        return wrapper;
    }

    applyCors(response) {
        for (const [key, value] of Object.entries(DEFAULT_CORS_HEADERS)) {
            if (!response.headers.has(key)) {
                response.headers.set(key, value);
            }
        }
    }

    buildResponse(payload, reply) {
        let response;
        const status = reply.statusCode || 200;
        if (payload instanceof Response) {
            response = payload;
        } else if (payload === undefined) {
            response = new Response(null, { status });
        } else if (typeof payload === 'string' || payload instanceof ArrayBuffer || payload instanceof Uint8Array) {
            response = new Response(payload, { status });
        } else {
            response = new Response(JSON.stringify(payload), {
                status,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }

        for (const [name, value] of reply.headers.entries()) {
            response.headers.set(name, value);
        }

        this.applyCors(response);
        return response;
    }

    async handleNotFound(requestWrapper, reply) {
        const result = await this.notFoundHandler(requestWrapper, reply);
        return this.finalizeReply(reply, result);
    }

    async handleError(error, requestWrapper, reply) {
        const result = await this.errorHandler(error, requestWrapper, reply);
        return this.finalizeReply(reply, result);
    }

    finalizeReply(reply, result) {
        const payload = reply.sent ? reply.payload : result;
        return this.buildResponse(payload, reply);
    }

    handleOptions(request) {
        const response = new Response(null, { status: 204 });
        const requestMethod = request.headers.get('Access-Control-Request-Method');
        const requestHeaders = request.headers.get('Access-Control-Request-Headers');
        this.applyCors(response);
        if (requestMethod) {
            response.headers.set('Access-Control-Allow-Methods', requestMethod);
        }
        if (requestHeaders) {
            response.headers.set('Access-Control-Allow-Headers', requestHeaders);
        }
        return response;
    }

    normalizeRequestPath(pathname) {
        if (!pathname.startsWith('/')) {
            return `/${pathname}`;
        }
        if (pathname.length > 1 && pathname.endsWith('/')) {
            return pathname.slice(0, -1);
        }
        return pathname || '/';
    }

    async handle(request) {
        if (request.method === 'OPTIONS') {
            return this.handleOptions(request);
        }

        const url = new URL(request.url);
        const path = this.normalizeRequestPath(url.pathname);
        const matched = this.matchRoute(request.method, path);
        const params = matched?.params || {};
        const reply = new Reply();
        let requestWrapper;

        try {
            requestWrapper = await this.buildRequestObject(request, url, params);
        } catch (error) {
            if (error instanceof HttpError) {
                reply.code(error.statusCode);
                return this.buildResponse({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }, reply);
            }
            throw error;
        }

        if (!matched) {
            return this.handleNotFound(requestWrapper, reply);
        }

        try {
            const result = await matched.handler(requestWrapper, reply);
            return this.finalizeReply(reply, result);
        } catch (error) {
            return this.handleError(error, requestWrapper, reply);
        }
    }
}

const app = new WorkerFastifyAdapter();

const blockchain = new Blockchain();
const walletManager = new WalletManager(blockchain);
const tokenManager = new TokenManager(blockchain);
const transferManager = new TransferManager(blockchain, walletManager);
const miningManager = new MiningManager(blockchain, walletManager);

app.decorate('blockchain', blockchain);
app.decorate('walletManager', walletManager);
app.decorate('tokenManager', tokenManager);
app.decorate('transferManager', transferManager);
app.decorate('miningManager', miningManager);
app.decorate('log', console);

app.setErrorHandler(async (error, request, reply) => {
    app.log.error?.(error);

    reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

app.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
        success: false,
        error: 'Route not found',
        message: `Route ${request.method} ${new URL(request.url).pathname} not found`,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
}));

app.get('/', async () => {
    const chainInfo = blockchain.getChainInfo();
    const tokenInfo = tokenManager.getTokenInfo();
    const miningStatus = miningManager.getMiningStatus();

    return {
        message: 'Chain Cosmos API Server',
        version: '1.0.0',
        status: 'running',
        blockchain: chainInfo,
        token: tokenInfo,
        mining: miningStatus,
        endpoints: {
            blockchain: '/api/blockchain',
            wallets: '/api/wallets',
            transfers: '/api/transfers',
            mining: '/api/mining',
            tokens: '/api/tokens'
        }
    };
});

const setupPromise = (async () => {
    console.log('🚀 Chain Cosmos Worker initialized');

    const wallet1 = walletManager.createWallet();
    const wallet2 = walletManager.createWallet();

    console.log(`钱包 1: ${wallet1.wallet.address}`);
    console.log(`钱包 2: ${wallet2.wallet.address}`);

    const minerResult = miningManager.registerMiner(wallet1.wallet.address, '测试矿工 1');
    console.log(`✅ 已注册矿工: ${minerResult.miner.name}`);

    await app.register(blockchainRoutes, { prefix: '/api/blockchain' });
    await app.register(walletRoutes, { prefix: '/api/wallets' });
    await app.register(transferRoutes, { prefix: '/api/transfers' });
    await app.register(miningRoutes, { prefix: '/api/mining' });
    await app.register(tokenRoutes, { prefix: '/api/tokens' });
})();

export default {
    /**
     * @param {Request} request
     * @param {Env} env
     * @param {ExecutionContext} ctx
     * @returns {Promise<Response>}
     */
    async fetch(request, env, ctx) {
        await setupPromise;
        return app.handle(request);
    }
};
