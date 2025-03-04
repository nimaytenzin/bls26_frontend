import { AdministrativeZoneDTO } from './administrative-zone.dto';
import { DzongkhagDTO } from './dzongkhag.dto';

export interface CreateSubAdministrativeZoneDTO {
    name: string;
    nameDzo?: string;
    dzongkhagId: number;
    administrativeZoneId: number;
    type: string;
    location: string;
}

export interface SubAdministrativeZoneDTO {
    id: number;
    name: string;
    nameDzo?: string;
    dzongkhagId: number;
    administrativeZoneId: number;
    type: string;
    location: string;

    dzongkhag?: DzongkhagDTO;
    administrativeZone: AdministrativeZoneDTO;
}
