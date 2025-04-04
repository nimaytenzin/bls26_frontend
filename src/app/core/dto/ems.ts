export interface UserDTO {
    id?: number;
    name: string;
    cid: string;
    email: string;
    phone: string;
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
    id?: number;
    preferredName: string;
    cid: string;
    avatarUrl: string;
    studentCode: string;
    name: string;
    dob: Date;
    gender: string;
    parentId: number;
    facilityId?: number;
}

export interface RegistrationDto {
    childId: number;
    parentId: number;
    facilityId: number;
    packageId:number;
    start_date:Date;
    end_date:Date;
    status:string;
  }
  


export interface ChildNoteDto {
    childId: number;
    medicalCondition: string;
    specialInstruction: string;
    notes: string;
}
