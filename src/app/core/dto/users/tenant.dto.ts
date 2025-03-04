import { AdministrativeZoneDTO } from '../locations/administrative-zone.dto';
import { DzongkhagDTO } from '../locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from '../locations/sub-administrative-zone.dto';
import { UserAuthDTO } from './userauth.dto';

export interface TenantDTO {
    id: number;
    userAuthId: number;
    userAuth: UserAuthDTO;
    firstName: string;
    middleName?: string;
    lastName?: string | null;
    phoneNumber: number;
    cid?: string | null;
    profileUri?: string | null;
    signatureUri?: string | null;
    email?: string | null;
    bankName: string | null;
    accountNumber: number | null;

    dzongkhagId: number;
    dzongkhag: DzongkhagDTO;
    administrativeZoneId: number;
    administrativeZone: AdministrativeZoneDTO;
    subadministrativeZoneId: number;
    subadministrativeZone: SubAdministrativeZoneDTO;

    // leaseAgreements?: LeaseAgreementDTO[];

    createdAt?: string;
}

export interface AdminCreateTenantDTO {
    role: string;
    isVerfied: number;
    firstName: string;
    middleName?: string;
    lastName?: string | null;
    phoneNumber: number;
    cid?: string | null;
    profileUri?: string | null;
    signatureUri?: string | null;
    email?: string | null;
    bankName?: string | null;
    password?: string;
    accountNumber?: number | null;

    dzongkhagId: number;
    administrativeZoneId: number;
    subadministrativeZoneId: number;
}

export interface UpdateTenantDto {
    firstName?: string;
    middleName?: string;
    lastName?: string | null;
    phoneNumber?: number;
    cid?: string | null;

    email?: string | null;

    dzongkhagId?: number;
    administrativeZoneId?: number;
    subadministrativeZoneId?: number;
}
