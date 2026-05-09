"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_lock_1 = __importDefault(require("async-lock"));
const crypto_1 = __importDefault(require("crypto"));
const KlapCipher_1 = __importDefault(require("./KlapCipher"));
class KlapAPI {
    ip;
    log;
    static TP_TEST_USER = 'test@tp-link.net';
    static TP_TEST_PASSWORD = 'test';
    lock;
    rawEmail;
    rawPassword;
    session;
    constructor(ip, email, password, log) {
        this.ip = ip;
        this.log = log;
        this.rawEmail = email;
        this.rawPassword = password;
        this.lock = new async_lock_1.default();
    }
    async sendSecureRequest(method, params, forceHandshake = false) {
        await this.handshake(forceHandshake);
        const rawRequest = JSON.stringify({
            method,
            params: (Object.keys(params).length > 0 && params) || null
        });
        this.log.debug('[KLAP] Sending request:', rawRequest);
        const requestData = this.session.cipher.encrypt(rawRequest);
        try {
            const url = new URL(`http://${this.ip}/app/request`);
            url.searchParams.set('seq', requestData.seq.toString());
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Host: this.ip,
                    Accept: '*/*',
                    'Content-Type': 'application/octet-stream',
                    Cookie: this.session.Cookie
                },
                body: requestData.encrypted
            });
            if (!response.ok) {
                if (response.status === 403 && !forceHandshake) {
                    this.log.warn('[KLAP] Forbidden. Redoing the request with a token regeneration.');
                    return this.sendSecureRequest(method, params, true);
                }
                throw new Error(`[KLAP] Request failed with status ${response.status}`);
            }
            const responseBuffer = Buffer.from(await response.arrayBuffer());
            const data = JSON.parse(this.session.cipher.decrypt(responseBuffer));
            return {
                body: data
            };
        }
        catch (error) {
            if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                throw new Error(`[KLAP] Request failed: ${error.message}`);
            }
            throw error;
        }
    }
    needsNewHandshake() {
        if (!this.session) {
            return true;
        }
        if (!this.session.cipher) {
            return true;
        }
        if (this.session.IsExpired) {
            return true;
        }
        if (!this.session.Cookie) {
            return true;
        }
        return false;
    }
    async handshake(force = false) {
        return this.lock.acquire('handshake', async () => {
            if (!this.needsNewHandshake() && !force) {
                return;
            }
            const { localSeed, remoteSeed, authHash } = await this.firstHandshake();
            await this.secondHandshake(localSeed, remoteSeed, authHash);
        });
    }
    async firstHandshake(seed) {
        const localSeed = seed ? seed : crypto_1.default.randomBytes(16);
        const handshake1Result = await this.sessionPost('/handshake1', localSeed);
        if (!handshake1Result.ok) {
            const body = await handshake1Result.text().catch(() => '');
            throw new Error(`Handshake1 failed with status ${handshake1Result.status}: ${body}`);
        }
        if (handshake1Result.headers.get('content-length') !== '48') {
            throw new Error('Handshake1 failed due to invalid content length');
        }
        const cookie = handshake1Result.headers.get('set-cookie');
        const data = Buffer.from(await handshake1Result.arrayBuffer());
        const [cookieValue, timeout] = cookie.split(';');
        const timeoutValue = timeout.split('=').pop();
        this.session = new Session(timeoutValue, cookieValue);
        const remoteSeed = data.subarray(0, 16);
        const serverHash = data.subarray(16);
        this.log.debug('[KLAP] First handshake completed');
        const localHash = this.hashAuth(this.rawEmail, this.rawPassword);
        const localAuthHash = this.sha256(Buffer.concat([localSeed, remoteSeed, localHash]));
        if (Buffer.compare(localAuthHash, serverHash) === 0) {
            this.log.debug('[KLAP] Local auth hash matches server hash');
            return {
                localSeed,
                remoteSeed,
                authHash: localHash
            };
        }
        const emptyHash = this.sha256(Buffer.concat([localSeed, remoteSeed, this.hashAuth('', '')]));
        if (Buffer.compare(emptyHash, serverHash) === 0) {
            this.log.debug('[KLAP] [WARN] Empty auth hash matches server hash');
            return {
                localSeed,
                remoteSeed,
                authHash: emptyHash
            };
        }
        const testHash = this.sha256(Buffer.concat([
            localSeed,
            remoteSeed,
            this.hashAuth(KlapAPI.TP_TEST_USER, KlapAPI.TP_TEST_PASSWORD)
        ]));
        if (Buffer.compare(testHash, serverHash) === 0) {
            this.log.debug('[KLAP] [WARN] Test auth hash matches server hash');
            return {
                localSeed,
                remoteSeed,
                authHash: testHash
            };
        }
        this.session = undefined;
        throw new Error('Failed to verify server hash');
    }
    async secondHandshake(localSeed, remoteSeed, authHash) {
        const localAuthHash = this.sha256(Buffer.concat([remoteSeed, localSeed, authHash]));
        try {
            const handshake2Result = await this.sessionPost('/handshake2', localAuthHash, this.session.Cookie);
            if (handshake2Result.ok) {
                this.log.debug('[KLAP] Second handshake successful');
                this.session = this.session.completeHandshake(new KlapCipher_1.default(localSeed, remoteSeed, authHash));
                return;
            }
            this.log.warn('[KLAP] Second handshake failed', await handshake2Result.text());
        }
        catch (e) {
            this.log.error('[KLAP] Second handshake failed:', e.message);
        }
        this.session = undefined;
    }
    async sessionPost(path, payload, cookie) {
        return fetch(`http://${this.ip}/app${path}`, {
            method: 'POST',
            headers: {
                Host: this.ip,
                Accept: '*/*',
                'Content-Type': 'application/octet-stream',
                ...(cookie && {
                    Cookie: cookie
                })
            },
            body: payload
        });
    }
    sha256(data) {
        return crypto_1.default.createHash('sha256').update(data).digest();
    }
    sha1(data) {
        return crypto_1.default.createHash('sha1').update(data).digest();
    }
    hashAuth(email, password) {
        return this.sha256(Buffer.concat([
            this.sha1(Buffer.from(email.normalize('NFKC'))),
            this.sha1(Buffer.from(password.normalize('NFKC')))
        ]));
    }
}
exports.default = KlapAPI;
class Session {
    cookie;
    cipher;
    handshakeCompleted = false;
    expireAt;
    rawTimeout;
    constructor(timeout, cookie, cipher) {
        this.cookie = cookie;
        this.cipher = cipher;
        this.rawTimeout = timeout;
        this.expireAt = new Date(Date.now() + parseInt(timeout) * 1000);
        if (cipher) {
            this.handshakeCompleted = true;
        }
    }
    get IsExpired() {
        return this.expireAt.getTime() - Date.now() <= 40 * 1000;
    }
    get Cookie() {
        return this.cookie;
    }
    completeHandshake(cipher) {
        return new Session(this.rawTimeout, this.cookie, cipher);
    }
}
//# sourceMappingURL=KlapAPI.js.map