"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.getInfo();
        return deviceInfo.status === 'online';
    }
};
exports.default = characteristic;
//# sourceMappingURL=StatusActive.js.map