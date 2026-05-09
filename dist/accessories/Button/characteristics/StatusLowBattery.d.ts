import { CharacteristicGetHandler } from 'homebridge';
import { AccessoryThisType } from '..';
declare const characteristic: {
    get: CharacteristicGetHandler;
} & AccessoryThisType;
export default characteristic;
//# sourceMappingURL=StatusLowBattery.d.ts.map