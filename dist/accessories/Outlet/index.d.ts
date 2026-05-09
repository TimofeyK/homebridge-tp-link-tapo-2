import { PlatformAccessory, Logger } from 'homebridge';
import DeviceInfo from '../../api/@types/DeviceInfo';
import Accessory from '../../@types/Accessory';
import Context from '../../@types/Context';
import TPLink from '../../api/TPLink';
import Platform from '../../platform';
export type AccessoryThisType = ThisType<{
    readonly tpLink: TPLink;
    readonly log: Logger;
    readonly mac: string;
}>;
export default class OutletAccessory extends Accessory {
    private readonly service;
    get UUID(): string;
    constructor(platform: Platform, accessory: PlatformAccessory<Context>, log: Logger, deviceInfo: DeviceInfo);
    private setupAdditionalCharacteristics;
}
//# sourceMappingURL=index.d.ts.map