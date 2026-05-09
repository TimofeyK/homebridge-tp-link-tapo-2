"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.getInfo();
        return deviceInfo.at_low_battery;
    }
};
exports.default = characteristic;
//# sourceMappingURL=StatusLowBattery.js.map