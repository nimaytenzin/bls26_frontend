import {
    ORGANIZATIONTYPES,
    ORGANIZATIONUSERTYPES,
} from '../../constants/enums';
import { UserDTO } from '../users-and-auth/dto/user.dto';

export interface OrganiztionDTO {
    id: number;
    userId: number;

    type: ORGANIZATIONTYPES;
    userType: ORGANIZATIONUSERTYPES;

    name: string;
    licenseNumber: string;

    user?: UserDTO;
}

export interface CreateOrganizationDTO {
    userId: number;

    type: ORGANIZATIONTYPES;
    userType: ORGANIZATIONUSERTYPES;

    name: string;
    licenseNumber: string;
}

export interface UpdateOrganizationDTO {
    type?: ORGANIZATIONTYPES;
    userType?: ORGANIZATIONUSERTYPES;

    name?: string;
    licenseNumber?: string;
}
