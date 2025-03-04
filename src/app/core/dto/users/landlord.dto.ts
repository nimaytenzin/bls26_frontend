import { BankAccountDto } from '../../dataservice/bankaccounts/bankaccount.dto';
import { AdministrativeZoneDTO } from '../locations/administrative-zone.dto';
import { DzongkhagDTO } from '../locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from '../locations/sub-administrative-zone.dto';
import { BuildingOwnershipDto } from '../properties/building-ownership.dto';
import { BuildingDTO } from '../properties/building.dto';
import { UserAuthDTO } from './userauth.dto';

export interface LandLordDTO {
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

    buildings: BuildingDTO[];
    BuildingOwnership?: BuildingOwnershipDto;

    bankAccounts?: BankAccountDto[];
}

export interface AdminCreateLandLordDTO {
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
    bankName: string | null;
    password: string;
    accountNumber: number | null;

    dzongkhagId: number;
    administrativeZoneId: number;
    subadministrativeZoneId: number;
}
