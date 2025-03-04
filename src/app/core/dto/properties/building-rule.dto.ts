import { BuildingDTO } from './building.dto';

export interface BuildingRuleDTO {
    id: number;
    particular: string;
    buildingId: number;
    building: BuildingDTO;
}

export interface CreateBuildingRuleDTO {
    particular: string;
    buildingId: number;
}
