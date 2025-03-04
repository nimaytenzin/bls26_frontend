export interface OwnerDTO {
    id: number;
    nameEnglish: string;
    nameDzongkha: string;
    cid: string;
    phoneNumber: number;
    email: string;
    isDeleted: boolean;
}

export interface CreateOwnerDTO {
    nameEnglish: string;
    nameDzongkha?: string;
    cid?: string;
    email?: string;
    phoneNumber?: number;
    password: string;
}
