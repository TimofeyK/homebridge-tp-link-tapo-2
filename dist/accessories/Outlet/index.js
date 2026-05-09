"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InUse_1 = __importDefault(require("./characteristics/InUse"));
const On_1 = __importDefault(require("./characteristics/On"));
const Accessory_1 = __importDefault(require("../../@types/Accessory"));
class OutletAccessory extends Accessory_1.default {
    service;
    get UUID() {
        return this.accessory.UUID.toString();
    }
    constructor(platform, accessory, log, deviceInfo) {
        super(platform, accessory, log, deviceInfo);
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TP-Link Technologies')
            .setCharacteristic(this.platform.Characteristic.Model, this.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.mac);
        this.service =
            this.accessory.getService(this.platform.Service.Outlet) ||
                this.accessory.addService(this.platform.Service.Outlet);
        this.service
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(On_1.default.get.bind(this))
            .onSet(On_1.default.set.bind(this));
        this.setupAdditionalCharacteristics();
    }
    async setupAdditionalCharacteristics() {
        const current = this.service.getCharacteristic(this.platform.Characteristic.ContactSensorState);
        try {
            const check = await this.tpLink.sendCommand('getCurrentPower');
            if (check.current_power === undefined ||
                check.current_power === null ||
                !Number.isFinite(check.current_power)) {
                throw new Error('Not supported');
            }
            (current ||
                this.service.addCharacteristic(this.platform.Characteristic.ContactSensorState)).onGet(InUse_1.default.get.bind(this));
            this.log.debug('InUse characteristic supported.');
        }
        catch {
            this.log.debug('InUse characteristic not supported, ignoring.');
            if (current) {
                this.service.removeCharacteristic(current);
            }
        }
    }
}
exports.default = OutletAccessory;
//# sourceMappingURL=index.js.map