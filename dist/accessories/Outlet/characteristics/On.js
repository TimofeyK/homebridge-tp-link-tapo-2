"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.tpLink.getInfo();
        return deviceInfo.device_on || false;
    },
    set: async function (value) {
        try {
            await this.tpLink.sendCommand('power', value);
        }
        catch (err) {
            this.log.error('Failed to set power:', this.mac, '|', err.message);
        }
    }
};
exports.default = characteristic;
//# sourceMappingURL=On.js.map