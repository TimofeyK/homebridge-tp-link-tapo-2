"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const translateColorTemp_1 = require("../../../utils/translateColorTemp");
const characteristic = {
    get: async function () {
        const deviceInfo = await this.tpLink.getInfo();
        const value = (0, translateColorTemp_1.toHomeKitValues)(deviceInfo.color_temp || translateColorTemp_1.TP_LINK_VALUES.min);
        if (value < translateColorTemp_1.HOME_KIT_VALUES.min) {
            return translateColorTemp_1.HOME_KIT_VALUES.min;
        }
        if (value > translateColorTemp_1.HOME_KIT_VALUES.max) {
            return translateColorTemp_1.HOME_KIT_VALUES.max;
        }
        return value;
    },
    set: async function (value) {
        try {
            await this.tpLink.sendCommand('colorTemp', (0, translateColorTemp_1.toTPLinkValues)(parseInt(value.toString())));
        }
        catch (err) {
            this.log.error('Failed to set colorTemp:', this.mac, '|', err.message);
        }
    }
};
exports.default = characteristic;
//# sourceMappingURL=ColorTemperature.js.map