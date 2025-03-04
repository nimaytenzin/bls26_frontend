import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';
import { OwnerDTO } from '../../owners/dto/owner.dto';
import { PlotDTO } from './plot.dto';
import { UserDTO } from '../../users-and-auth/dto/user.dto';

export interface ThramDTO {
    id: number;
    dzongkhagId: number;
    administrativeZoneId: number;
    subAdministrativeZoneId: number;
    ownershipType: string;

    thramNo: string;

    dzongkhag?: DzongkhagDTO;
    administrativeZone: AdministrativeZoneDTO;
    subAdministrativeZone: SubAdministrativeZoneDTO;
    owners?: UserDTO[];
    plots?: PlotDTO[];
}

export interface CreateThramDTO {
    dzongkhagId: number;
    administrativeZoneId: number;
    subAdministrativeZoneId: number;
    thramNo: string;
    ownershipType: string;

    owners: UserDTO[];
}

export interface UpdateThramDTO {
    dzongkhagId?: number;
    administrativeZoneId?: number;
    subAdministrativeZoneId?: number;
    thramNo?: string;
    ownershipType?: string;
    owners?: UserDTO;
}

export interface SearchThramDTO {
    dzongkhagId: number;
    administrativeZoneId: number;
    thramNo: string;
}
