import { CharacteristicGetHandler, CharacteristicSetHandler } from 'homebridge';
import { AccessoryThisType } from '..';
declare const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType;
export default characteristic;
//# sourceMappingURL=ColorTemperature.d.ts.map