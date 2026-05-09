import { PlatformAccessory, Logger } from 'homebridge';
import DeviceInfo from '../../api/@types/DeviceInfo';
import Accessory from '../../@types/Accessory';
import Context from '../../@types/Context';
import TPLink from '../../api/TPLink';
import Platform from '../../platform';
export type AccessoryThisType = ThisType<{
    readonly Characteristic: typeof import('homebridge').Characteristic;
    readonly setAlarmEnabled: (value: boolean) => Promise<void>;
    readonly alarmEnabled: boolean;
    readonly tpLink: TPLink;
    readonly log: Logger;
    readonly mac: string;
}>;
export interface HubContext {
    name: string;
    child: true;
    parent: string;
}
export default class HubAccessory extends Accessory {
    private readonly Characteristic;
    private readonly currentChar;
    private readonly targetChar;
    private prevTarget;
    get UUID(): string;
    getChildDevices(): Promise<import("../../api/@types/ChildListInfo").ChildInfo[]>;
    getChildInfo(childId: string): Promise<import("../../api/@types/ChildListInfo").ChildInfo>;
    getChildLogs(childId: string): Promise<any>;
    constructor(platform: Platform, accessory: PlatformAccessory<Context>, log: Logger, deviceInfo: DeviceInfo);
    private setAlarmEnabled;
}
//# sourceMappingURL=index.d.ts.map