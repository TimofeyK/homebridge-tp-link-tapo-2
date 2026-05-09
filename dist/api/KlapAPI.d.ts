import { Logger } from 'homebridge';
export default class KlapAPI {
    private readonly ip;
    private readonly log;
    private static readonly TP_TEST_USER;
    private static readonly TP_TEST_PASSWORD;
    private readonly lock;
    private readonly rawEmail;
    private readonly rawPassword;
    private session?;
    constructor(ip: string, email: string, password: string, log: Logger);
    sendSecureRequest(method: string, params: {
        [key: string]: any;
    }, forceHandshake?: boolean): Promise<{
        body: any;
    }>;
    needsNewHandshake(): boolean;
    private handshake;
    private firstHandshake;
    private secondHandshake;
    private sessionPost;
    private sha256;
    private sha1;
    private hashAuth;
}
//# sourceMappingURL=KlapAPI.d.ts.map