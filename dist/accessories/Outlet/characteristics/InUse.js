"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const response = await this.tpLink.cacheSendCommand(this.mac, 'getCurrentPower');
        return response.current_power > 0;
    }
};
exports.default = characteristic;
//# sourceMappingURL=InUse.js.map