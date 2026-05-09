import { PlatformAccessory, Logger } from 'homebridge';
import { ChildInfo } from '../../api/@types/ChildListInfo';
import HubAccessory, { HubContext } from '../Hub';
import Accessory from '../../@types/Accessory';
import Platform from '../../platform';
export declare enum Status {
    KeepOpen = "keepOpen",
    Closed = "close",
    Open = "open"
}
export type AccessoryThisType = ThisType<{
    readonly hub: HubAccessory;
    readonly getInfo: () => Promise<ChildInfo>;
}>;
export default class ContactAccessory extends Accessory {
    private readonly hub;
    private interval?;
    private lastEventUpdate;
    get UUID(): string;
    private getInfo;
    constructor(hub: HubAccessory, platform: Platform, accessory: PlatformAccessory<HubContext>, log: Logger, deviceInfo: ChildInfo);
    cleanup(): void;
    private setup;
    private statusToValue;
}
//# sourceMappingURL=index.d.ts.map