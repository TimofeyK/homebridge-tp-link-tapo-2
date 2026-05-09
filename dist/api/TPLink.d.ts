import { ChildInfo } from './@types/ChildListInfo';
import DeviceInfo from './@types/DeviceInfo';
import { Logger } from 'homebridge';
import commands from './commands';
type Commands = typeof commands;
type Command = keyof Commands;
type CommandReturnType<T extends Command> = ReturnType<Commands[T]>;
export default class TPLink {
    private readonly ip;
    private readonly email;
    private readonly password;
    private readonly log;
    private readonly lock;
    private api;
    private classSetup;
    private tryResendCommand;
    private _prevPowerState;
    private _unsentData;
    private commandCache;
    private infoCache?;
    private childInfoCache;
    constructor(ip: string, email: string, password: string, log: Logger);
    setup(): Promise<TPLink>;
    cacheSendCommand<T extends Command>(deviceId: string, command: T, ...args: Parameters<Commands[T]>): Promise<ReturnType<Commands[T]>>;
    getInfo(): Promise<DeviceInfo>;
    getChildInfo(childId: string): Promise<ChildInfo>;
    sendCommand<T extends Command>(command: T, ...args: Parameters<Commands[T]>): Promise<CommandReturnType<T>>;
    sendHubCommand<T extends Command>(command: T, childId: string, ...args: Parameters<Commands[T]>): Promise<CommandReturnType<T>>;
    private sendCommandWithNoLock;
}
export {};
//# sourceMappingURL=TPLink.d.ts.map