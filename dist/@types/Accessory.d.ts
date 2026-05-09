import { Logger, PlatformAccessory } from 'homebridge';
import { ChildInfo } from '../api/@types/ChildListInfo';
import DeviceInfo from '../api/@types/DeviceInfo';
import TPLink from '../api/TPLink';
import Platform from '../platform';
import Context from './Context';
export declare enum AccessoryType {
    LightBulb = "LightBulb",
    Unknown = "Unknown",
    Outlet = "Outlet",
    Hub = "Hub"
}
export declare enum ChildType {
    Unknown = "Unknown",
    Button = "Button",
    Contact = "Contact",
    MotionSensor = "MotionSensor"
}
declare abstract class Accessory {
    protected readonly platform: Platform;
    protected readonly accessory: PlatformAccessory<Context>;
    protected readonly log: Logger;
    protected readonly deviceInfo: DeviceInfo | ChildInfo;
    protected readonly tpLink: TPLink;
    protected readonly model: string;
    protected readonly mac: string;
    static GetType(deviceInfo: DeviceInfo): AccessoryType;
    static GetChildType(deviceInfo: ChildInfo): ChildType;
    abstract get UUID(): string;
    constructor(platform: Platform, accessory: PlatformAccessory<Context>, log: Logger, deviceInfo: DeviceInfo | ChildInfo);
}
export default Accessory;
//# sourceMappingURL=Accessory.d.ts.map