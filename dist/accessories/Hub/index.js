"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Accessory_1 = __importDefault(require("../../@types/Accessory"));
const CurrentState_1 = __importDefault(require("./characteristics/CurrentState"));
const TargetState_1 = __importDefault(require("./characteristics/TargetState"));
class HubAccessory extends Accessory_1.default {
    Characteristic = this.platform.Characteristic;
    currentChar;
    targetChar;
    prevTarget = false;
    get UUID() {
        return this.accessory.UUID.toString();
    }
    async getChildDevices() {
        const response = await this.tpLink.sendCommand('childDeviceList');
        return response.child_device_list;
    }
    async getChildInfo(childId) {
        return this.tpLink.getChildInfo(childId);
    }
    async getChildLogs(childId) {
        const response = await this.tpLink.sendHubCommand('getTriggerLogs', childId, childId);
        return response?.responseData?.result;
    }
    constructor(platform, accessory, log, deviceInfo) {
        super(platform, accessory, log, deviceInfo);
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.Characteristic.Manufacturer, 'TP-Link Technologies')
            .setCharacteristic(this.Characteristic.Model, this.model)
            .setCharacteristic(this.Characteristic.SerialNumber, this.mac);
        const service = this.accessory.getService(this.platform.Service.SecuritySystem) ||
            this.accessory.addService(this.platform.Service.SecuritySystem);
        this.currentChar = service
            .getCharacteristic(this.Characteristic.SecuritySystemCurrentState)
            .onGet(CurrentState_1.default.get.bind(this));
        this.targetChar = service
            .getCharacteristic(this.Characteristic.SecuritySystemTargetState)
            .setProps({
            validValues: [
                this.Characteristic.SecuritySystemTargetState.DISARM,
                this.Characteristic.SecuritySystemTargetState.AWAY_ARM
            ]
        })
            .onGet(TargetState_1.default.get.bind(this))
            .onSet(TargetState_1.default.set.bind(this));
    }
    async setAlarmEnabled(value) {
        if (this.prevTarget === value) {
            this.currentChar.updateValue(this.prevTarget
                ? this.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED
                : this.Characteristic.SecuritySystemCurrentState.DISARMED);
            this.targetChar.updateValue(this.prevTarget
                ? this.Characteristic.SecuritySystemTargetState.AWAY_ARM
                : this.Characteristic.SecuritySystemTargetState.DISARM);
            return;
        }
        this.prevTarget = value;
        if (value) {
            await this.tpLink.sendCommand('startAlarm');
            this.currentChar.updateValue(this.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED);
            this.targetChar.updateValue(this.Characteristic.SecuritySystemTargetState.AWAY_ARM);
            return;
        }
        await this.tpLink.sendCommand('stopAlarm');
        this.currentChar.updateValue(this.Characteristic.SecuritySystemCurrentState.DISARMED);
        this.targetChar.updateValue(this.Characteristic.SecuritySystemTargetState.DISARM);
    }
}
exports.default = HubAccessory;
//# sourceMappingURL=index.js.map