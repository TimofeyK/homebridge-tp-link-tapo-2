"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTPLinkValues = exports.toHomeKitValues = exports.HOME_KIT_VALUES = exports.TP_LINK_VALUES = void 0;
exports.TP_LINK_VALUES = {
    min: 2500,
    max: 6500
};
exports.HOME_KIT_VALUES = {
    min: 140,
    max: 364
};
const getZeroMax = (values) => values.max - values.min;
const zeroMaxTPLink = getZeroMax(exports.TP_LINK_VALUES);
const zeroMaxHomeKit = getZeroMax(exports.HOME_KIT_VALUES);
const toHomeKitValues = (input) => {
    return Math.round((1 - (input - exports.TP_LINK_VALUES.min) / zeroMaxTPLink) * zeroMaxHomeKit +
        exports.HOME_KIT_VALUES.min);
};
exports.toHomeKitValues = toHomeKitValues;
const toTPLinkValues = (input) => {
    return Math.round((1 - (input - exports.HOME_KIT_VALUES.min) / zeroMaxHomeKit) * zeroMaxTPLink +
        exports.TP_LINK_VALUES.min);
};
exports.toTPLinkValues = toTPLinkValues;
//# sourceMappingURL=translateColorTemp.js.map