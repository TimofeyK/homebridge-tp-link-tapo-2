import { Logger } from 'homebridge';
import AsyncLock from 'async-lock';
import crypto from 'crypto';

import KlapCipher from './KlapCipher';

export default class KlapAPI {
  private static readonly TP_TEST_USER = 'test@tp-link.net';
  private static readonly TP_TEST_PASSWORD = 'test';

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
      const url = new URL(`http://${this.ip}/app/request`);
      url.searchParams.set('seq', requestData.seq.toString());

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Host: this.ip,
          Accept: '*/*',
          'Content-Type': 'application/octet-stream',
          Cookie: this.session!.Cookie
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
      const data = JSON.parse(this.session!.cipher!.decrypt(responseBuffer));

      return {
        body: data
      };
    } catch (error: any) {
      if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
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
      const body = await handshake1Result.text().catch(() => '');
      throw new Error(
        `Handshake1 failed with status ${handshake1Result.status}: ${body}`
      );
    }

    if (handshake1Result.headers.get('content-length') !== '48') {
      throw new Error('Handshake1 failed due to invalid content length');
    }

    const cookie = handshake1Result.headers.get('set-cookie');
    const data = Buffer.from(await handshake1Result.arrayBuffer());

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

    const emptyHash = this.sha256(
      Buffer.concat([localSeed, remoteSeed, this.hashAuth('', '')])
    );

    if (Buffer.compare(emptyHash, serverHash) === 0) {
      this.log.debug('[KLAP] [WARN] Empty auth hash matches server hash');
      return {
        localSeed,
        remoteSeed,
        authHash: emptyHash
      };
    }

    const testHash = this.sha256(
      Buffer.concat([
        localSeed,
        remoteSeed,
        this.hashAuth(KlapAPI.TP_TEST_USER, KlapAPI.TP_TEST_PASSWORD)
      ])
    );

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

      this.log.warn('[KLAP] Second handshake failed', await handshake2Result.text());
    } catch (e: any) {
      this.log.error(
        '[KLAP] Second handshake failed:',
        e.message
      );
    }

    this.session = undefined;
  }

  private async sessionPost(
    path: string,
    payload: Buffer,
    cookie?: string
  ) {
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
  public readonly handshakeCompleted: boolean = false;

  private readonly expireAt: Date;
  private readonly rawTimeout: string;

  constructor(
    timeout: string,
    private readonly cookie: string,
    public readonly cipher?: KlapCipher
  ) {
    this.rawTimeout = timeout;
    this.expireAt = new Date(Date.now() + parseInt(timeout) * 1000);

    if (cipher) {
      this.handshakeCompleted = true;
    }
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
