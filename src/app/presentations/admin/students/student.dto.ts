// student.dto.ts
export interface Student {
    id: string;
    studentCode: string;
    fullName: string;
    preferredName: string;
    dob: Date;
    cid: string;
    parentName: string;
    contactNumber: string;
    alternateContact: string;
    image?: string;
    registrationDate: Date;
    medicalConditions: string[];
    notes: string;
    specialInstructions: string;
}
