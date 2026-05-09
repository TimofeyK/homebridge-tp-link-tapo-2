"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.tpLink.getInfo();
        return deviceInfo.brightness || 100;
    },
    set: async function (value) {
        try {
            await this.tpLink.sendCommand('brightness', parseInt(value.toString()));
        }
        catch (err) {
            this.log.error('Failed to set brightness:', this.mac, '|', err.message);
        }
    }
};
exports.default = characteristic;
//# sourceMappingURL=Brightness.js.map