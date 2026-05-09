"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.tpLink.getInfo();
        return deviceInfo.saturation || 0;
    },
    set: async function (value) {
        this.saturation = parseInt(value.toString());
    }
};
exports.default = characteristic;
//# sourceMappingURL=Saturation.js.map