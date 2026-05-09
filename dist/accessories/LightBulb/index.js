"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ColorTemperature_1 = __importDefault(require("./characteristics/ColorTemperature"));
const Brightness_1 = __importDefault(require("./characteristics/Brightness"));
const Saturation_1 = __importDefault(require("./characteristics/Saturation"));
const Hue_1 = __importDefault(require("./characteristics/Hue"));
const On_1 = __importDefault(require("./characteristics/On"));
const translateColorTemp_1 = require("../../utils/translateColorTemp");
const Accessory_1 = __importDefault(require("../../@types/Accessory"));
class LightBulbAccessory extends Accessory_1.default {
    powerChar;
    service;
    _hue;
    _saturation;
    set hue(value) {
        this._hue = value;
        this.updateHueAndSat();
    }
    set saturation(value) {
        this._saturation = value;
        this.updateHueAndSat();
    }
    get UUID() {
        return this.accessory.UUID.toString();
    }
    constructor(platform, accessory, log, deviceInfo) {
        super(platform, accessory, log, deviceInfo);
        let isColorTemperatureBlocked = false;
        let hasBrightness = false;
        let hasColors = false;
        if (deviceInfo.color_temp !== undefined ||
            deviceInfo.saturation !== undefined ||
            deviceInfo.hue !== undefined) {
            hasColors = true;
        }
        if (deviceInfo.color_temp_range?.length !== undefined &&
            deviceInfo.color_temp_range?.[0] !== undefined &&
            deviceInfo.color_temp_range[0] === deviceInfo.color_temp_range?.[1]) {
            isColorTemperatureBlocked = true;
        }
        if (deviceInfo.brightness !== undefined) {
            hasBrightness = true;
        }
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TP-Link Technologies')
            .setCharacteristic(this.platform.Characteristic.Model, this.model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.mac);
        this.service =
            this.accessory.getService(this.platform.Service.Lightbulb) ||
                this.accessory.addService(this.platform.Service.Lightbulb);
        this.powerChar = this.service
            .getCharacteristic(this.platform.Characteristic.On)
            .onGet(On_1.default.get.bind(this))
            .onSet(On_1.default.set.bind(this));
        if (hasBrightness) {
            this.service
                .getCharacteristic(this.platform.Characteristic.Brightness)
                .onGet(Brightness_1.default.get.bind(this))
                .onSet(Brightness_1.default.set.bind(this));
        }
        if (hasColors) {
            this.service
                .getCharacteristic(this.platform.Characteristic.Hue)
                .onGet(Hue_1.default.get.bind(this))
                .onSet(Hue_1.default.set.bind(this));
            this.service
                .getCharacteristic(this.platform.Characteristic.Saturation)
                .onGet(Saturation_1.default.get.bind(this))
                .onSet(Saturation_1.default.set.bind(this));
        }
        if (hasColors && !isColorTemperatureBlocked) {
            this.service
                .getCharacteristic(this.platform.Characteristic.ColorTemperature)
                .setProps({
                minValue: translateColorTemp_1.HOME_KIT_VALUES.min,
                maxValue: translateColorTemp_1.HOME_KIT_VALUES.max
            })
                .onGet(ColorTemperature_1.default.get.bind(this))
                .onSet(ColorTemperature_1.default.set.bind(this));
            const adaptiveLightingController = new this.platform.api.hap.AdaptiveLightingController(this.service, {
                controllerMode: 1 /* this.platform.api.hap.AdaptiveLightingControllerMode.AUTOMATIC */
            });
            this.accessory.configureController(adaptiveLightingController);
        }
    }
    async updateHueAndSat() {
        try {
            if (this._hue !== undefined && this._saturation !== undefined) {
                const h = parseInt(this._hue.toString());
                const s = parseInt(this._saturation.toString());
                this._hue = undefined;
                this._saturation = undefined;
                await this.tpLink.sendCommand('hueAndSaturation', h, s);
            }
        }
        catch (err) {
            this.log.error('Failed to update hue and saturation:', this.mac, '|', err.message);
        }
    }
}
exports.default = LightBulbAccessory;
//# sourceMappingURL=index.js.map