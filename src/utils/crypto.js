const TEXT_ENCODER = new TextEncoder();

const SHA256_INITIAL = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19
]);

const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const RIPEMD160_INIT = new Uint32Array([
    0x67452301,
    0xefcdab89,
    0x98badcfe,
    0x10325476,
    0xc3d2e1f0
]);

const RIPEMD160_R = new Uint8Array([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]);

const RIPEMD160_RP = new Uint8Array([
    5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]);

const RIPEMD160_S = new Uint8Array([
    11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]);

const RIPEMD160_SP = new Uint8Array([
    8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]);

const RIPEMD160_K = new Uint32Array([
    0x00000000,
    0x5a827999,
    0x6ed9eba1,
    0x8f1bbcdc,
    0xa953fd4e
]);

const RIPEMD160_KP = new Uint32Array([
    0x50a28be6,
    0x5c4dd124,
    0x6d703ef3,
    0x7a6d76e9,
    0x00000000
]);

function rightRotate(value, amount) {
    return ((value >>> amount) | (value << (32 - amount))) >>> 0;
}

function leftRotate(value, amount) {
    return ((value << amount) | (value >>> (32 - amount))) >>> 0;
}

function bytesToHex(bytes) {
    const out = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
        const v = bytes[i];
        out[i] = (v >>> 4).toString(16) + (v & 0x0f).toString(16);
    }
    return out.join('');
}

function hexToBytes(hex) {
    if (hex.length % 2 !== 0) {
        throw new Error('Hex string must have even length');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function normalizeInput(data, encoding = 'utf8') {
    if (data instanceof Uint8Array) {
        return data;
    }
    if (typeof data === 'string') {
        if (encoding === 'hex') {
            return hexToBytes(data.toLowerCase());
        }
        return TEXT_ENCODER.encode(data);
    }
    throw new TypeError('Unsupported data type for crypto operation');
}

function sha256BlockProcess(padded) {
    const h = new Uint32Array(SHA256_INITIAL);
    const w = new Uint32Array(64);
    for (let offset = 0; offset < padded.length; offset += 64) {
        for (let i = 0; i < 16; i += 1) {
            const idx = offset + i * 4;
            w[i] = ((padded[idx] << 24) | (padded[idx + 1] << 16) | (padded[idx + 2] << 8) | padded[idx + 3]) >>> 0;
        }
        for (let i = 16; i < 64; i += 1) {
            const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (((w[i - 16] + s0) >>> 0) + w[i - 7] + s1) >>> 0;
        }

        let a = h[0];
        let b = h[1];
        let c = h[2];
        let d = h[3];
        let e = h[4];
        let f = h[5];
        let g = h[6];
        let i = h[7];

        for (let t = 0; t < 64; t += 1) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (((((i + S1) >>> 0) + ch) >>> 0) + SHA256_K[t] + w[t]) >>> 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) >>> 0;

            i = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
        h[5] = (h[5] + f) >>> 0;
        h[6] = (h[6] + g) >>> 0;
        h[7] = (h[7] + i) >>> 0;
    }

    const digest = new Uint8Array(32);
    for (let j = 0; j < h.length; j += 1) {
        digest[j * 4] = (h[j] >>> 24) & 0xff;
        digest[j * 4 + 1] = (h[j] >>> 16) & 0xff;
        digest[j * 4 + 2] = (h[j] >>> 8) & 0xff;
        digest[j * 4 + 3] = h[j] & 0xff;
    }
    return digest;
}

function sha256Bytes(data, encoding) {
    const message = normalizeInput(data, encoding);
    const originalLength = message.length;
    const bitLength = originalLength * 8;
    const paddedLength = (((originalLength + 9 + 63) >> 6) << 6);
    const padded = new Uint8Array(paddedLength);
    padded.set(message);
    padded[originalLength] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 4, bitLength >>> 0);
    view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
    return sha256BlockProcess(padded);
}

function sha256Hex(data, encoding) {
    return bytesToHex(sha256Bytes(data, encoding));
}

function ripemdF(j, x, y, z) {
    if (j <= 15) return x ^ y ^ z;
    if (j <= 31) return (x & y) | (~x & z);
    if (j <= 47) return (x | ~y) ^ z;
    if (j <= 63) return (x & z) | (y & ~z);
    return x ^ (y | ~z);
}

function ripemdProcess(padded) {
    const h = new Uint32Array(RIPEMD160_INIT);
    const words = new Uint32Array(16);

    for (let offset = 0; offset < padded.length; offset += 64) {
        for (let i = 0; i < 16; i += 1) {
            const idx = offset + i * 4;
            words[i] = padded[idx] | (padded[idx + 1] << 8) | (padded[idx + 2] << 16) | (padded[idx + 3] << 24);
        }

        let al = h[0];
        let bl = h[1];
        let cl = h[2];
        let dl = h[3];
        let el = h[4];

        let ar = h[0];
        let br = h[1];
        let cr = h[2];
        let dr = h[3];
        let er = h[4];

        for (let j = 0; j < 80; j += 1) {
            const tl = (leftRotate((al + ripemdF(j, bl, cl, dl) + words[RIPEMD160_R[j]] + RIPEMD160_K[Math.floor(j / 16)]) >>> 0, RIPEMD160_S[j]) + el) >>> 0;
            al = el;
            el = dl;
            dl = leftRotate(cl, 10);
            cl = bl;
            bl = tl;

            const tr = (leftRotate((ar + ripemdF(79 - j, br, cr, dr) + words[RIPEMD160_RP[j]] + RIPEMD160_KP[Math.floor(j / 16)]) >>> 0, RIPEMD160_SP[j]) + er) >>> 0;
            ar = er;
            er = dr;
            dr = leftRotate(cr, 10);
            cr = br;
            br = tr;
        }

        const temp = (h[1] + cl + dr) >>> 0;
        h[1] = (h[2] + dl + er) >>> 0;
        h[2] = (h[3] + el + ar) >>> 0;
        h[3] = (h[4] + al + br) >>> 0;
        h[4] = (h[0] + bl + cr) >>> 0;
        h[0] = temp;
    }

    const out = new Uint8Array(20);
    for (let i = 0; i < h.length; i += 1) {
        out[i * 4] = h[i] & 0xff;
        out[i * 4 + 1] = (h[i] >>> 8) & 0xff;
        out[i * 4 + 2] = (h[i] >>> 16) & 0xff;
        out[i * 4 + 3] = (h[i] >>> 24) & 0xff;
    }
    return out;
}

function ripemd160Bytes(data, encoding) {
    const message = normalizeInput(data, encoding);
    const originalLength = message.length;
    const bitLength = originalLength * 8;
    const paddedLength = (((originalLength + 9 + 63) >> 6) << 6);
    const padded = new Uint8Array(paddedLength);
    padded.set(message);
    padded[originalLength] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, bitLength >>> 0, true);
    view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);
    return ripemdProcess(padded);
}

function ripemd160Hex(data, encoding) {
    return bytesToHex(ripemd160Bytes(data, encoding));
}

function padKey(keyBytes, blockSize) {
    if (keyBytes.length > blockSize) {
        keyBytes = sha256Bytes(keyBytes);
    }
    if (keyBytes.length < blockSize) {
        const padded = new Uint8Array(blockSize);
        padded.set(keyBytes);
        keyBytes = padded;
    }
    return keyBytes;
}

function hmacSha256Hex(key, message, keyEncoding, messageEncoding) {
    const blockSize = 64;
    let keyBytes = normalizeInput(key, keyEncoding);
    keyBytes = padKey(keyBytes, blockSize);
    const messageBytes = normalizeInput(message, messageEncoding);

    const ipad = new Uint8Array(blockSize);
    const opad = new Uint8Array(blockSize);
    for (let i = 0; i < blockSize; i += 1) {
        const value = keyBytes[i];
        ipad[i] = value ^ 0x36;
        opad[i] = value ^ 0x5c;
    }

    const innerMessage = new Uint8Array(blockSize + messageBytes.length);
    innerMessage.set(ipad);
    innerMessage.set(messageBytes, blockSize);
    const innerHash = sha256Bytes(innerMessage);

    const outerMessage = new Uint8Array(blockSize + innerHash.length);
    outerMessage.set(opad);
    outerMessage.set(innerHash, blockSize);
    return bytesToHex(sha256Bytes(outerMessage));
}

function randomHex(size) {
    if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
        throw new Error('crypto.getRandomValues is not available in this environment');
    }
    const buffer = new Uint8Array(size);
    crypto.getRandomValues(buffer);
    return bytesToHex(buffer);
}

export {
    bytesToHex,
    hexToBytes,
    sha256Bytes,
    sha256Hex,
    ripemd160Bytes,
    ripemd160Hex,
    hmacSha256Hex,
    randomHex
};
