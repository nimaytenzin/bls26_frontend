export interface UserDTO {
    id?: number;
    name: string;
    cid: string;
    email: string;
    phone: string;
}


export interface ParentDTO extends UserDTO {
    profile?: {
        userId: number;
        children_count: number;
        subscription_status: string;
    }
}

export interface PackageDTO {
    id?: number;
    facilityId: number;
    description: string;
    name: string;
    billing_cycle: string;
    price: number;
}

export interface ChildDto {
    preferredName: string;
    cid: string;
    avatarUrl: string;
    studentCode: string;
    name: string;
    dob: Date;
    gender: string;
    parentId: number;
    facilityId: number;
}
