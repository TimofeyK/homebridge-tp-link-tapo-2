"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_lock_1 = __importDefault(require("async-lock"));
const commands_1 = __importDefault(require("./commands"));
const KlapAPI_1 = __importDefault(require("./KlapAPI"));
class TPLink {
    ip;
    email;
    password;
    log;
    lock;
    api;
    classSetup = false;
    tryResendCommand = false;
    _prevPowerState = false;
    _unsentData = {};
    commandCache = {};
    infoCache;
    childInfoCache = {};
    constructor(ip, email, password, log) {
        this.ip = ip;
        this.email = email;
        this.password = password;
        this.log = log;
        this.lock = new async_lock_1.default();
        this.api = new KlapAPI_1.default(ip, email, password, log);
    }
    async setup() {
        if (this.classSetup) {
            return this;
        }
        this.classSetup = true;
        return this;
    }
    async cacheSendCommand(deviceId, command, ...args) {
        const cacheKey = `${deviceId}-${command}`;
        return this.lock.acquire(`cache-${cacheKey}`, async () => {
            if (this.commandCache[cacheKey.toString()] &&
                Date.now() - this.commandCache[cacheKey.toString()].setAt < 100) {
                return this.commandCache[cacheKey.toString()].data;
            }
            const response = (await this.sendCommand(command, ...args)) ?? {};
            this.commandCache[cacheKey.toString()] = {
                data: response,
                setAt: Date.now()
            };
            return response;
        });
    }
    async getInfo() {
        return this.lock.acquire('get-info-cache', async () => {
            if (this.infoCache && Date.now() - this.infoCache.setAt < 100) {
                return this.infoCache.data;
            }
            const deviceInfo = (await this.sendCommand('deviceInfo')) ?? {};
            this.infoCache = {
                data: deviceInfo,
                setAt: Date.now()
            };
            this._prevPowerState = deviceInfo.device_on ?? false;
            return deviceInfo;
        });
    }
    async getChildInfo(childId) {
        return this.lock.acquire('get-child-info-cache', async () => {
            if (this.childInfoCache[childId.toString()] &&
                Date.now() - this.childInfoCache[childId.toString()].setAt < 10000) {
                return this.childInfoCache[childId.toString()].data;
            }
            const rawInfo = (await this.sendCommand('childDeviceInfo', childId)) ?? {};
            const deviceInfo = rawInfo?.responseData?.result ?? {};
            this.childInfoCache[childId.toString()] = {
                data: deviceInfo,
                setAt: Date.now()
            };
            return deviceInfo;
        });
    }
    async sendCommand(command, ...args) {
        return this.lock.acquire('send-command', () => {
            if (command === 'power') {
                if (args[0] === this._prevPowerState) {
                    return this._prevPowerState;
                }
                this._prevPowerState = args[0];
            }
            return this.sendCommandWithNoLock(command, args, this._prevPowerState);
        });
    }
    async sendHubCommand(command, childId, ...args) {
        return this.lock.acquire(`send-hub-command-${childId}`, () => {
            return this.sendCommandWithNoLock(command, args, false);
        });
    }
    async sendCommandWithNoLock(command, args, isDeviceOn = false) {
        try {
            if (!commands_1.default[command.toString()]) {
                return false;
            }
            if (this.tryResendCommand) {
                this.log.info('Session expired, forcing new handshake.');
            }
            const forceHandshake = this.tryResendCommand;
            const { __method__, ...params } = commands_1.default[command.toString()](...args);
            const validMethod = __method__ ?? 'set_device_info';
            if (!isDeviceOn && validMethod === 'set_device_info') {
                const paramsToCache = { ...params };
                delete paramsToCache.device_on;
                if (command === 'colorTemp') {
                    delete this._unsentData.saturation;
                    delete this._unsentData.hue;
                }
                this._unsentData = {
                    ...this._unsentData,
                    ...paramsToCache
                };
                if (command !== 'power') {
                    this.tryResendCommand = false;
                    return true;
                }
            }
            const extraData = isDeviceOn && validMethod === 'set_device_info'
                ? { ...this._unsentData }
                : {};
            if (isDeviceOn) {
                this._unsentData = {};
            }
            const { body } = await this.api.sendSecureRequest(validMethod, {
                ...extraData,
                ...params
            }, forceHandshake);
            if (body.error_code && body.error_code !== 0) {
                if (!this.tryResendCommand) {
                    if (`${body.error_code}` === '9999') {
                        this.tryResendCommand = true;
                        this.log.info('Session expired');
                        return this.sendCommandWithNoLock(command, args, isDeviceOn);
                    }
                    if (`${body.error_code}` === '-1301') {
                        this.tryResendCommand = true;
                        this.log.info('Rate limit exceeded. Renewing session.');
                        return this.sendCommandWithNoLock(command, args, isDeviceOn);
                    }
                }
                this.log.error('Command error:', command, '>', body.error_code);
            }
            this.tryResendCommand = false;
            return (body?.result ?? body?.error_code === 0);
        }
        catch (e) {
            this.log.error('Error sending command:', command, e);
            this.tryResendCommand = false;
            return null;
        }
    }
}
exports.default = TPLink;
//# sourceMappingURL=TPLink.js.map