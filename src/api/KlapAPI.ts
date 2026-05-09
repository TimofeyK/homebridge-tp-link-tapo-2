import { Logger } from 'homebridge';
import AsyncLock from 'async-lock';
import crypto from 'crypto';
import http from 'http';

import KlapCipher from './KlapCipher';

interface HttpResponse {
  status: number;
  ok: boolean;
  headers: http.IncomingHttpHeaders;
  data: Buffer;
}

export default class KlapAPI {
  private readonly lock: AsyncLock;
  private readonly rawEmail: string;
  private readonly rawPassword: string;

  private session?: Session;

  constructor(
    private readonly ip: string,
    email: string,
    password: string,
    private readonly log: Logger
  ) {
    this.rawEmail = email;
    this.rawPassword = password;
    this.lock = new AsyncLock();
  }

  public async sendSecureRequest(
    method: string,
    params: {
      [key: string]: any;
    },
    forceHandshake = false
  ): Promise<{
    body: any;
  }> {
    await this.handshake(forceHandshake);

    const rawRequest = JSON.stringify({
      method,
      params: (Object.keys(params).length > 0 && params) || null
    });
    this.log.debug('[KLAP] Sending request:', rawRequest);

    const requestData = this.session!.cipher!.encrypt(rawRequest);

    try {
      const response = await this.sessionPost(
        `/request?seq=${requestData.seq}`,
        requestData.encrypted,
        this.session!.Cookie
      );

      if (!response.ok) {
        if (response.status === 403 && !forceHandshake) {
          this.log.warn('[KLAP] Forbidden. Redoing the request with a token regeneration.');
          return this.sendSecureRequest(method, params, true);
        }
        throw new Error(`[KLAP] Request failed with status ${response.status}`);
      }

      const data = JSON.parse(this.session!.cipher!.decrypt(response.data));

      return {
        body: data
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`[KLAP] Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  public needsNewHandshake() {
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

  private async handshake(force = false) {
    return this.lock.acquire('handshake', async () => {
      if (!this.needsNewHandshake() && !force) {
        return;
      }

      const { localSeed, remoteSeed, authHash } = await this.firstHandshake();
      await this.secondHandshake(localSeed, remoteSeed, authHash);
    });
  }

  private async firstHandshake(seed?: Buffer) {
    const localSeed = seed ? seed : crypto.randomBytes(16);

    const handshake1Result = await this.sessionPost(
      '/handshake1',
      localSeed
    );

    if (!handshake1Result.ok) {
      throw new Error(
        `Handshake1 failed with status ${handshake1Result.status}: ${handshake1Result.data.toString()}`
      );
    }

    const contentLength = handshake1Result.headers['content-length'];
    if (contentLength !== '48') {
      throw new Error('Handshake1 failed due to invalid content length');
    }

    const cookie = Array.isArray(handshake1Result.headers['set-cookie'])
      ? handshake1Result.headers['set-cookie'][0]
      : handshake1Result.headers['set-cookie'];
    const data = handshake1Result.data;

    const [cookieValue, timeout] = cookie!.split(';');
    const timeoutValue = timeout.split('=').pop();

    this.session = new Session(timeoutValue!, cookieValue!);

    const remoteSeed: Buffer = data.subarray(0, 16);
    const serverHash: Buffer = data.subarray(16);

    this.log.debug('[KLAP] First handshake completed');

    const localHash = this.hashAuth(this.rawEmail, this.rawPassword);
    const localAuthHash = this.sha256(
      Buffer.concat([localSeed, remoteSeed, localHash])
    );

    if (Buffer.compare(localAuthHash, serverHash) === 0) {
      this.log.debug('[KLAP] Local auth hash matches server hash');
      return {
        localSeed,
        remoteSeed,
        authHash: localHash
      };
    }

    this.session = undefined;
    throw new Error('Failed to verify server hash');
  }

  private async secondHandshake(
    localSeed: Buffer,
    remoteSeed: Buffer,
    authHash: Buffer
  ) {
    const localAuthHash = this.sha256(
      Buffer.concat([remoteSeed, localSeed, authHash])
    );

    try {
      const handshake2Result = await this.sessionPost(
        '/handshake2',
        localAuthHash,
        this.session!.Cookie
      );

      if (handshake2Result.ok) {
        this.log.debug('[KLAP] Second handshake successful');
        this.session = this.session!.completeHandshake(
          new KlapCipher(localSeed, remoteSeed, authHash)
        );

        return;
      }

      this.log.warn('[KLAP] Second handshake failed', handshake2Result.data.toString());
    } catch (e: any) {
      this.log.error(
        '[KLAP] Second handshake failed:',
        e.message
      );
    }

    this.session = undefined;
  }

  private sessionPost(
    path: string,
    payload: Buffer,
    cookie?: string
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: this.ip,
          port: 80,
          path: `/app${path}`,
          method: 'POST',
          headers: {
            Host: this.ip,
            Accept: '*/*',
            'Content-Type': 'application/octet-stream',
            'Content-Length': payload.length,
            Connection: 'close',
            ...(cookie && { Cookie: cookie })
          },
          agent: new http.Agent({ keepAlive: false })
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const status = res.statusCode ?? 0;
            resolve({
              status,
              ok: status >= 200 && status < 300,
              headers: res.headers,
              data: Buffer.concat(chunks)
            });
          });
        }
      );

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  private sha256(data: Buffer) {
    return crypto.createHash('sha256').update(data).digest();
  }

  private sha1(data: Buffer) {
    return crypto.createHash('sha1').update(data).digest();
  }

  private hashAuth(email: string, password: string) {
    return this.sha256(
      Buffer.concat([
        this.sha1(Buffer.from(email.normalize('NFKC'))),
        this.sha1(Buffer.from(password.normalize('NFKC')))
      ])
    );
  }
}

class Session {
  private readonly expireAt: Date;
  private readonly rawTimeout: string;

  constructor(
    timeout: string,
    private readonly cookie: string,
    public readonly cipher?: KlapCipher
  ) {
    this.rawTimeout = timeout;
    this.expireAt = new Date(Date.now() + parseInt(timeout) * 1000);
  }

  public get IsExpired() {
    return this.expireAt.getTime() - Date.now() <= 40 * 1000;
  }

  public get Cookie() {
    return this.cookie;
  }

  public completeHandshake(cipher: KlapCipher) {
    return new Session(this.rawTimeout, this.cookie, cipher);
  }
}
