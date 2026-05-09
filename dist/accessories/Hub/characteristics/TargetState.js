"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const characteristic = {
    get: async function () {
        const deviceInfo = await this.tpLink.getInfo();
        return deviceInfo.in_alarm
            ? this.Characteristic.SecuritySystemTargetState.AWAY_ARM
            : this.Characteristic.SecuritySystemTargetState.DISARM;
    },
    set: async function (value) {
        try {
            await this.setAlarmEnabled(this.Characteristic.SecuritySystemTargetState.AWAY_ARM === value);
        }
        catch (err) {
            this.log.error('Failed to set power:', this.mac, '|', err.message);
        }
    }
};
exports.default = characteristic;
//# sourceMappingURL=TargetState.js.map