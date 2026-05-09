import { CharacteristicGetHandler, CharacteristicSetHandler } from 'homebridge';
import { AccessoryThisType } from '..';
declare const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType;
export default characteristic;
//# sourceMappingURL=Brightness.d.ts.map