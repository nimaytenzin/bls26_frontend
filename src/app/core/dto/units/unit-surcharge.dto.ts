import { UnitDTO } from './unit.dto';

export interface UnitSurchargeDTO {
    id: number;
    particular: string;
    amount: number;
    unitId: number;
    unit?: UnitDTO;
}

export interface CreateUnitSurchargeDTO {
    particular: string;
    amount: number;
    unitId: number;
}
