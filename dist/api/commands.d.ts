import ChildListInfo, { ChildInfo } from './@types/ChildListInfo';
import DeviceInfo from './@types/DeviceInfo';
type ChildResponse<T> = {
    responseData: {
        result: T;
    };
};
declare const _default: {
    hueAndSaturation: (hue: number, saturation: number) => boolean;
    brightness: (value: number) => boolean;
    colorTemp: (value: number) => boolean;
    power: (value: boolean) => boolean;
    deviceInfo: () => DeviceInfo;
    childDeviceList: () => ChildListInfo;
    getTriggerLogs: (childId: string) => any;
    stopAlarm: () => boolean;
    startAlarm: () => boolean;
    getCurrentPower: () => {
        current_power: number;
    };
    childDeviceInfo: (childId: string) => ChildResponse<ChildInfo>;
};
export default _default;
//# sourceMappingURL=commands.d.ts.map