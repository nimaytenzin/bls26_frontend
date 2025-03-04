import { BuildingDTO } from './building.dto';

export interface BuildingSurchargeDTO {
    id: number;
    particular: string;
    amount: number;
    buildingId: number;
    building?: BuildingDTO;
}

export interface CreateBuildingSurchargeDTO {
    particular: string;
    amount: number;
    buildingId: number;
}
