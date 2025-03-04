import { UnitDTO } from './unit.dto';

export interface UnitRuleDTO {
    id: number;
    particular: string;
    unitId: number;
    unit?: UnitDTO;
}

export interface CreateUnitRuleDTO {
    particular: string;
    unitId: number;
}
