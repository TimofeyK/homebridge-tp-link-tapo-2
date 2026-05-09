import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import Accessory from './@types/Accessory';
import Context from './@types/Context';
import HubAccessory, { HubContext } from './accessories/Hub';
export default class Platform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    private readonly TIMEOUT_TRIES;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory<Context | HubContext>[];
    readonly loadedChildUUIDs: Record<string, true>;
    readonly registeredDevices: Accessory[];
    readonly hubs: HubAccessory[];
    private readonly deviceRetry;
    constructor(log: Logger, config: PlatformConfig, api: API);
    configureAccessory(accessory: PlatformAccessory): void;
    private discoverDevices;
    private loadDevice;
    private loadChildDevice;
    private checkOldDevices;
    private readonly accessoryClasses;
    private registerAccessory;
    private readonly childClasses;
    private registerChild;
}
//# sourceMappingURL=platform.d.ts.map