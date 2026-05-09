"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Accessory_1 = __importDefault(require("../../@types/Accessory"));
const delay_1 = __importDefault(require("../../utils/delay"));
const StatusLowBattery_1 = __importDefault(require("./characteristics/StatusLowBattery"));
const StatusActive_1 = __importDefault(require("./characteristics/StatusActive"));
class MotionSensorAccessory extends Accessory_1.default {
    hub;
    interval;
    lastEventUpdate = 0;
    get UUID() {
        return this.accessory.UUID.toString();
    }
    getInfo() {
        return this.hub.getChildInfo(this.deviceInfo.device_id);
    }
    constructor(hub, platform, accessory, log, deviceInfo) {
        super(platform, accessory, log, deviceInfo);
        this.hub = hub;
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TP-Link Technologies')
            .setCharacteristic(this.platform.Characteristic.Model, this.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.mac);
        const service = this.accessory.getService(this.platform.Service.MotionSensor) ||
            this.accessory.addService(this.platform.Service.MotionSensor);
        const motionDetected = service.getCharacteristic(this.platform.Characteristic.MotionDetected);
        const isActive = service.getCharacteristic(this.platform.Characteristic.StatusActive)
            .onGet(StatusActive_1.default.get.bind(this));
        service
            .getCharacteristic(this.platform.Characteristic.StatusLowBattery)
            .onGet(StatusLowBattery_1.default.get.bind(this));
        const checkStatus = async (initStatus) => {
            if (initStatus) {
                motionDetected.updateValue(initStatus.detected);
                isActive.updateValue(initStatus.active);
            }
            try {
                const response = await this.getInfo();
                if (!response) {
                    this.log.warn('Failed to check for updates, delaying 500ms');
                    await (0, delay_1.default)(500);
                }
                motionDetected.updateValue(response.detected);
            }
            catch (error) {
                this.log.error('Failed to check for updates', error);
                await (0, delay_1.default)(500);
            }
        };
        this.setup(checkStatus.bind(this));
    }
    cleanup() {
        clearInterval(this.interval);
    }
    async setup(callback) {
        const init = await this.getInfo();
        await callback({
            detected: init.detected,
            active: init.status === 'online'
        });
        this.interval = setInterval(() => {
            callback();
        }, 5000);
    }
}
exports.default = MotionSensorAccessory;
//# sourceMappingURL=index.js.map