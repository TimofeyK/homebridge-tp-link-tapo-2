"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Accessory_1 = __importDefault(require("../../@types/Accessory"));
const delay_1 = __importDefault(require("../../utils/delay"));
const StatusLowBattery_1 = __importDefault(require("./characteristics/StatusLowBattery"));
class ButtonAccessory extends Accessory_1.default {
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
        const service = this.accessory.getService(this.platform.Service.StatelessProgrammableSwitch) ||
            this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch);
        const characteristic = service
            .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
            .setProps({
            validValues: [
                this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
                this.platform.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
            ]
        });
        (service.getCharacteristic(this.platform.Characteristic.StatusLowBattery) ||
            service.addCharacteristic(this.platform.Characteristic.StatusLowBattery)).onGet(StatusLowBattery_1.default.get.bind(this));
        const checkStatus = async () => {
            try {
                const response = await this.hub.getChildLogs(this.deviceInfo.device_id);
                if (!response) {
                    this.log.warn('Failed to check for updates, delaying 500ms');
                    await (0, delay_1.default)(500);
                }
                const lastEvent = response?.logs?.[0];
                if (this.lastEventUpdate < lastEvent?.timestamp) {
                    this.lastEventUpdate = lastEvent?.timestamp ?? 0;
                    switch (lastEvent?.event ?? '') {
                        case 'singleClick':
                            characteristic.updateValue(this.platform.Characteristic.ProgrammableSwitchEvent
                                .SINGLE_PRESS);
                            break;
                        case 'doubleClick':
                            characteristic.updateValue(this.platform.Characteristic.ProgrammableSwitchEvent
                                .DOUBLE_PRESS);
                            break;
                    }
                }
            }
            catch (error) {
                this.log.error('Failed to check for updates', error);
                await (0, delay_1.default)(500);
            }
            checkStatus();
        };
        this.setup(() => checkStatus());
    }
    cleanup() {
        clearInterval(this.interval);
    }
    async setup(callback) {
        const init = await this.hub.getChildLogs(this.deviceInfo.device_id);
        this.lastEventUpdate = init?.logs?.[0].timestamp ?? 0;
        callback();
    }
}
exports.default = ButtonAccessory;
//# sourceMappingURL=index.js.map