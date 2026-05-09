import { PlatformAccessory, Characteristic, Logger } from 'homebridge';
import DeviceInfo from '../../api/@types/DeviceInfo';
import Accessory from '../../@types/Accessory';
import Context from '../../@types/Context';
import TPLink from '../../api/TPLink';
import Platform from '../../platform';
export type AccessoryThisType = ThisType<{
    readonly powerChar: Characteristic;
    readonly tpLink: TPLink;
    readonly log: Logger;
    readonly mac: string;
    saturation: number;
    hue: number;
}>;
export default class LightBulbAccessory extends Accessory {
    private readonly powerChar;
    private readonly service;
    private _hue?;
    private _saturation?;
    private set hue(value);
    private set saturation(value);
    get UUID(): string;
    constructor(platform: Platform, accessory: PlatformAccessory<Context>, log: Logger, deviceInfo: DeviceInfo);
    private updateHueAndSat;
}
//# sourceMappingURL=index.d.ts.map