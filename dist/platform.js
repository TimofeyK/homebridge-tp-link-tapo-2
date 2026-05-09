"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Accessory_1 = __importStar(require("./@types/Accessory"));
const settings_1 = require("./settings");
const TPLink_1 = __importDefault(require("./api/TPLink"));
const delay_1 = __importDefault(require("./utils/delay"));
const Hub_1 = __importDefault(require("./accessories/Hub"));
const LightBulb_1 = __importDefault(require("./accessories/LightBulb"));
const Outlet_1 = __importDefault(require("./accessories/Outlet"));
const Button_1 = __importDefault(require("./accessories/Button"));
const Contact_1 = __importDefault(require("./accessories/Contact"));
const MotionSensor_1 = __importDefault(require("./accessories/MotionSensor"));
class Platform {
    log;
    config;
    api;
    TIMEOUT_TRIES = 20;
    Service;
    Characteristic;
    accessories = [];
    loadedChildUUIDs = {};
    registeredDevices = [];
    hubs = [];
    deviceRetry = {};
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.log.debug('Finished initializing platform:', this.config.name);
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            this.discoverDevices();
        });
    }
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }
    async discoverDevices() {
        try {
            const { email, password, addresses } = this.config ?? {};
            if (!email ||
                !password ||
                !addresses ||
                !Array.isArray(addresses) ||
                addresses.length <= 0) {
                if (this.accessories.length > 0) {
                    this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, this.accessories);
                }
                return;
            }
            await Promise.all(addresses.map((address) => this.loadDevice(address, email, password)));
            await Promise.all(this.hubs.map(async (hub) => {
                const devices = await hub.getChildDevices();
                await Promise.all(devices.map((device) => {
                    if (Object.keys(device || {}).length === 0) {
                        return Promise.resolve();
                    }
                    this.loadedChildUUIDs[this.api.hap.uuid.generate(device.device_id)] = true;
                    return this.loadChildDevice(device.device_id, device, hub);
                }));
            }));
            this.checkOldDevices();
        }
        catch (err) {
            this.log.error('Failed to discover devices:', err.message);
        }
    }
    async loadDevice(ip, email, password) {
        const uuid = this.api.hap.uuid.generate(ip);
        if (this.deviceRetry[uuid] === undefined) {
            this.deviceRetry[uuid] = this.TIMEOUT_TRIES;
        }
        else if (this.deviceRetry[uuid] <= 0) {
            this.log.info('Retry timeout:', ip);
            return;
        }
        else {
            this.log.info('Retry to connect in 10s', ':', ip);
            await (0, delay_1.default)(10 * 1000);
            this.log.info('Try for', ip, ':', `${this.deviceRetry[uuid]}/${this.TIMEOUT_TRIES}`);
        }
        try {
            const tpLink = await new TPLink_1.default(ip, email, password, this.log).setup();
            const deviceInfo = await tpLink.getInfo();
            if (Object.keys(deviceInfo || {}).length === 0) {
                this.log.error('Failed to get info about:', ip);
                this.deviceRetry[uuid] -= 1;
                return await this.loadDevice(ip, email, password);
            }
            const deviceName = Buffer.from(deviceInfo?.nickname || 'Tm8gTmFtZQ==', 'base64').toString('utf-8');
            const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
            if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                existingAccessory.context = {
                    name: deviceName,
                    tpLink,
                    child: false
                };
                const registeredAccessory = this.registerAccessory(existingAccessory, deviceInfo);
                if (!registeredAccessory) {
                    this.log.error('Failed to register accessory "%s" of type "%s" (%s)', deviceName, Accessory_1.default.GetType(deviceInfo), deviceInfo?.type);
                    return;
                }
                this.registeredDevices.push(registeredAccessory);
                return;
            }
            this.log.info('Adding new accessory:', deviceName);
            const accessory = new this.api.platformAccessory(deviceName, uuid);
            accessory.context = {
                name: deviceName,
                tpLink,
                child: false
            };
            const registeredAccessory = this.registerAccessory(accessory, deviceInfo);
            if (!registeredAccessory) {
                this.log.error('Failed to register accessory "%s" of type "%s" (%s)', deviceName, Accessory_1.default.GetType(deviceInfo), deviceInfo?.type);
                return;
            }
            this.registeredDevices.push(registeredAccessory);
            return this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                accessory
            ]);
        }
        catch (err) {
            this.log.error('Failed to get info about:', ip, '|', err.message);
            this.deviceRetry[uuid] -= 1;
            return await this.loadDevice(ip, email, password);
        }
    }
    async loadChildDevice(id, deviceInfo, parent) {
        const uuid = this.api.hap.uuid.generate(id);
        if (this.deviceRetry[uuid] === undefined) {
            this.deviceRetry[uuid] = this.TIMEOUT_TRIES;
        }
        else if (this.deviceRetry[uuid] <= 0) {
            this.log.info('Retry timeout:', id);
            return;
        }
        else {
            this.log.info('Retry to connect in 10s', ':', id);
            await (0, delay_1.default)(10 * 1000);
            this.log.info('Try for', id, ':', `${this.deviceRetry[uuid]}/${this.TIMEOUT_TRIES}`);
        }
        try {
            const deviceName = Buffer.from(deviceInfo.nickname || 'Tm8gTmFtZQ==', 'base64').toString('utf-8');
            const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
            if (existingAccessory) {
                this.log.info('Restoring existing child accessory from cache:', existingAccessory.displayName);
                existingAccessory.context = {
                    name: deviceName,
                    child: true,
                    parent: parent.UUID
                };
                const registeredAccessory = this.registerChild(existingAccessory, deviceInfo, parent);
                if (!registeredAccessory) {
                    this.log.error('Failed to register child accessory "%s" of type "%s" (%s)', deviceName, Accessory_1.default.GetChildType(deviceInfo), deviceInfo?.type);
                    return;
                }
                this.registeredDevices.push(registeredAccessory);
                return;
            }
            this.log.info('Adding new child accessory:', deviceName);
            const accessory = new this.api.platformAccessory(deviceName, uuid);
            accessory.context = {
                name: deviceName,
                child: true,
                parent: parent.UUID
            };
            const registeredAccessory = this.registerChild(accessory, deviceInfo, parent);
            if (!registeredAccessory) {
                this.log.error('Failed to register child accessory "%s" of type "%s" (%s)', deviceName, Accessory_1.default.GetChildType(deviceInfo), deviceInfo?.type);
                return;
            }
            this.registeredDevices.push(registeredAccessory);
            return this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                accessory
            ]);
        }
        catch (err) {
            this.log.error('Failed to get info about child:', id, '|', err.message);
            this.deviceRetry[uuid] -= 1;
            return await this.loadChildDevice(id, deviceInfo, parent);
        }
    }
    checkOldDevices() {
        const addressesByUUID = (this.config?.addresses || []).reduce((acc, ip) => ({
            ...acc,
            [this.api.hap.uuid.generate(ip)]: ip
        }), {});
        this.accessories.map((accessory) => {
            const deleteDevice = (!accessory.context.child &&
                !addressesByUUID[accessory.UUID.toString()]) ||
                (accessory.context.child &&
                    !addressesByUUID[accessory.context.parent]) ||
                (accessory.context.child &&
                    addressesByUUID[accessory.context.parent] &&
                    !this.loadedChildUUIDs[accessory.UUID.toString()]);
            if (deleteDevice) {
                this.log.info('Remove cached accessory:', accessory.displayName);
                this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                    accessory
                ]);
            }
        });
    }
    accessoryClasses = {
        [Accessory_1.AccessoryType.LightBulb]: LightBulb_1.default,
        [Accessory_1.AccessoryType.Outlet]: Outlet_1.default,
        [Accessory_1.AccessoryType.Hub]: Hub_1.default
    };
    registerAccessory(accessory, deviceInfo) {
        const AccessoryClass = this.accessoryClasses[Accessory_1.default.GetType(deviceInfo)];
        if (!AccessoryClass) {
            return null;
        }
        const acc = new AccessoryClass(this, accessory, this.log, deviceInfo);
        if (acc instanceof Hub_1.default) {
            this.hubs.push(acc);
        }
        return acc;
    }
    childClasses = {
        [Accessory_1.ChildType.Button]: Button_1.default,
        [Accessory_1.ChildType.Contact]: Contact_1.default,
        [Accessory_1.ChildType.MotionSensor]: MotionSensor_1.default,
    };
    registerChild(accessory, deviceInfo, parent) {
        const ChildClass = this.childClasses[Accessory_1.default.GetChildType(deviceInfo)];
        if (!ChildClass) {
            return null;
        }
        return new ChildClass(parent, this, accessory, this.log, deviceInfo);
    }
}
exports.default = Platform;
//# sourceMappingURL=platform.js.map