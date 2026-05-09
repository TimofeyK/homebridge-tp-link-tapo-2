"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildType = exports.AccessoryType = void 0;
var AccessoryType;
(function (AccessoryType) {
    AccessoryType["LightBulb"] = "LightBulb";
    AccessoryType["Unknown"] = "Unknown";
    AccessoryType["Outlet"] = "Outlet";
    AccessoryType["Hub"] = "Hub";
})(AccessoryType || (exports.AccessoryType = AccessoryType = {}));
var ChildType;
(function (ChildType) {
    ChildType["Unknown"] = "Unknown";
    ChildType["Button"] = "Button";
    ChildType["Contact"] = "Contact";
    ChildType["MotionSensor"] = "MotionSensor";
})(ChildType || (exports.ChildType = ChildType = {}));
class Accessory {
    platform;
    accessory;
    log;
    deviceInfo;
    tpLink;
    model;
    mac;
    static GetType(deviceInfo) {
        if (deviceInfo?.type?.includes('BULB')) {
            return AccessoryType.LightBulb;
        }
        if (deviceInfo?.type?.includes('PLUG')) {
            return AccessoryType.Outlet;
        }
        if (deviceInfo?.type?.includes('HUB')) {
            return AccessoryType.Hub;
        }
        return AccessoryType.Unknown;
    }
    static GetChildType(deviceInfo) {
        if (deviceInfo?.type?.includes('SENSOR')) {
            if (deviceInfo?.category?.includes('button')) {
                return ChildType.Button;
            }
            if (deviceInfo?.category?.includes('contact-sensor')) {
                return ChildType.Contact;
            }
            if (deviceInfo?.category?.includes('motion-sensor')) {
                return ChildType.MotionSensor;
            }
        }
        return ChildType.Unknown;
    }
    constructor(platform, accessory, log, deviceInfo) {
        this.platform = platform;
        this.accessory = accessory;
        this.log = log;
        this.deviceInfo = deviceInfo;
        this.tpLink = accessory.context.tpLink;
        this.model = deviceInfo.model;
        this.mac = deviceInfo.mac;
    }
}
exports.default = Accessory;
//# sourceMappingURL=Accessory.js.map