import { USERROLESENUM } from 'src/app/core/constants/enums';

export interface RequestPasswordResetDto {
    phoneNumber: number;
}

export interface UpdateUserPhoneNumber {
    newPhoneNumber: number;
    adminId: number;
}

export interface AuthenticatedUserDTO {
    phoneNumber: number;
    role: string;
    id: number;
    roles: {
        name: string;
        adminId: number | null;
    }[];
    exp: number;
    iat: number;
    isVerified: number;
    userAuthId: number;
    nameEnglish: string;
    nameDzongkha: string;
}
export interface CurrentRoleDTO {
    name: USERROLESENUM;
    adminId: number | null;
}
export interface UpdatePinDto {
    userAuthId: number;
    pin: string;
}

export interface ResetPinDto {
    userAuthId: number;
}

export interface UpdatePasswordDTO {
    userId: number;

    newPassword: string;

    newPasswordRentry: string;

    role: string;
    adminId: number;
}
