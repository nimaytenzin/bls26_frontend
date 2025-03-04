import { BuildingDTO } from '../properties/building.dto';

export interface BuildingPlotDTO {
    id: number;
    buildingId: number;
    building?: BuildingDTO;

    plotId: string;
}

export interface CreateBuildingPlotDTO {
    buildingId: number;

    plotDatabaseId: number;
}
