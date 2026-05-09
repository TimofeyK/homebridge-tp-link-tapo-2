"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createBoolCommand = (key) => (value) => ({
    [key]: value
});
const controlChild = (childId, method, params) => ({
    __method__: 'control_child',
    device_id: childId,
    requestData: {
        method,
        ...(params ? { params } : {})
    }
});
exports.default = {
    hueAndSaturation: (hue, saturation) => ({
        hue,
        saturation,
        color_temp: 0
    }),
    brightness: createBoolCommand('brightness'),
    colorTemp: createBoolCommand('color_temp'),
    power: createBoolCommand('device_on'),
    deviceInfo: () => ({
        __method__: 'get_device_info'
    }),
    childDeviceList: () => ({
        __method__: 'get_child_device_list'
    }),
    getTriggerLogs: (childId) => ({
        ...controlChild(childId, 'get_trigger_logs', {
            start_id: 0,
            page_size: 1
        })
    }),
    stopAlarm: () => ({
        __method__: 'stop_alarm'
    }),
    startAlarm: () => ({
        __method__: 'play_alarm',
        alarm_type: 'Alarm 4',
        alarm_volume: 'medium'
    }),
    getCurrentPower: () => ({
        __method__: 'get_current_power'
    }),
    childDeviceInfo: (childId) => ({
        ...controlChild(childId, 'get_device_info')
    })
};
//# sourceMappingURL=commands.js.map