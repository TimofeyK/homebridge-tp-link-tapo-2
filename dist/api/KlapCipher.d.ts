export default class KlapCipher {
    private readonly key;
    private readonly sig;
    private readonly iv;
    private seq;
    constructor(localSeed: Buffer, remoteSeed: Buffer, authHash: Buffer);
    encrypt(msg: Buffer | string): {
        encrypted: Buffer<ArrayBuffer>;
        seq: number;
    };
    decrypt(msg: Buffer): string;
    private keyDerive;
    private ivDerive;
    private sigDerive;
    private ivSeq;
}
//# sourceMappingURL=KlapCipher.d.ts.map