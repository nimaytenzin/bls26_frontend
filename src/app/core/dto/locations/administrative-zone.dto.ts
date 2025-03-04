import { DzongkhagDTO } from './dzongkhag.dto';

export interface CreateAdministrativeZoneDTO {
    name: string;
    nameDzo?: string;
    dzongkhagId: number;
    type: string;
    location: string;
}

export interface AdministrativeZoneDTO {
    id: number;
    name: string;
    nameDzo?: string;
    dzongkhagId: number;
    type: string;
    location: string;

    dzongkhag?: DzongkhagDTO;
}
