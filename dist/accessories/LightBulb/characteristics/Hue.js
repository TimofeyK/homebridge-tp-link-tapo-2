"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.tpLink.getInfo();
        return deviceInfo.hue || 0;
    },
    set: async function (value) {
        this.hue = parseInt(value.toString());
    }
};
exports.default = characteristic;
//# sourceMappingURL=Hue.js.map