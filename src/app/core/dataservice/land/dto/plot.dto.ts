import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { OwnerDTO } from '../../owners/dto/owner.dto';
import { ThramDTO } from './thram.dto';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';

export interface PlotDTO {
    id: number;
    thramId: string;
    plotId: string;
    plotCategory: string;

    netArea: number;
    areaUnit: string;

    lapName: string;
    lapCode: string;
    precinctName: string;
    precinctCode: string;

    remarks: string;

    thram?: ThramDTO;

    buildings?: BuildingDTO[];
}

export interface CreatePlotDTO {
    thramId: number;
    plotId: string;
    plotCategory: string;

    netArea: number;
    areaUnit: string;

    lapName: string;
    lapCode: string;
    precinctName: string;
    precinctCode: string;

    remarks?: string;
}

export interface UpdatePlotDTO {
    plotId?: string;
    plotCategory?: string;

    netArea?: number;
    areaUnit?: string;

    lapName?: string;
    lapCode?: string;
    precinctName?: string;
    precinctCode?: string;

    remarks?: string;
}

export interface PlotImageDTO {
    id: number;
    plotId: number;
    uri: string;
}
