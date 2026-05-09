"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
class KlapCipher {
    key;
    sig;
    iv;
    seq;
    constructor(localSeed, remoteSeed, authHash) {
        const { iv, seq } = this.ivDerive(localSeed, remoteSeed, authHash);
        this.key = this.keyDerive(localSeed, remoteSeed, authHash);
        this.sig = this.sigDerive(localSeed, remoteSeed, authHash);
        this.iv = iv;
        this.seq = seq;
    }
    encrypt(msg) {
        this.seq += 1;
        if (typeof msg === 'string') {
            msg = Buffer.from(msg, 'utf8');
        }
        if (!Buffer.isBuffer(msg)) {
            throw new Error('msg must be a string or buffer');
        }
        const cipher = crypto_1.default.createCipheriv('aes-128-cbc', this.key, this.ivSeq());
        const cipherText = Buffer.concat([cipher.update(msg), cipher.final()]);
        const seqBuffer = Buffer.alloc(4);
        seqBuffer.writeInt32BE(this.seq, 0);
        const hash = crypto_1.default.createHash('sha256');
        hash.update(Buffer.concat([this.sig, seqBuffer, cipherText]));
        const signature = hash.digest();
        return {
            encrypted: Buffer.concat([signature, cipherText]),
            seq: this.seq
        };
    }
    decrypt(msg) {
        if (!Buffer.isBuffer(msg)) {
            throw new Error('msg must be a buffer');
        }
        const decipher = crypto_1.default.createDecipheriv('aes-128-cbc', this.key, this.ivSeq());
        const decrypted = Buffer.concat([
            decipher.update(msg.subarray(32)),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    }
    keyDerive(l, r, h) {
        const payload = Buffer.concat([Buffer.from('lsk'), l, r, h]);
        const hash = crypto_1.default.createHash('sha256').update(payload).digest();
        return hash.subarray(0, 16);
    }
    ivDerive(l, r, h) {
        const payload = Buffer.concat([Buffer.from('iv'), l, r, h]);
        const fullIv = crypto_1.default.createHash('sha256').update(payload).digest();
        const seq = fullIv.subarray(-4).readInt32BE(0);
        return { iv: fullIv.subarray(0, 12), seq: seq };
    }
    sigDerive(l, r, h) {
        const payload = Buffer.concat([Buffer.from('ldk'), l, r, h]);
        const hash = crypto_1.default.createHash('sha256').update(payload).digest();
        return hash.subarray(0, 28);
    }
    ivSeq() {
        const seq = Buffer.alloc(4);
        seq.writeInt32BE(this.seq, 0);
        const iv = Buffer.concat([this.iv, seq]);
        if (iv.length !== 16) {
            throw new Error('Length of iv is not 16');
        }
        return iv;
    }
}
exports.default = KlapCipher;
//# sourceMappingURL=KlapCipher.js.map