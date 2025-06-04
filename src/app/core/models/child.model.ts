export interface Child {
  id: number;
  name: string;
  preferredName: string;
  cid: string;
  avatarUrl: string;
  studentCode: string;
  dob: string; // or Date if parsed
  gender: 'male' | 'female';
  facilityId: number;
}

export interface ChildNote {
  childId: number; // 🔗 Foreign key to Child
  medicalCondition?: string;
  specialInstruction?: string;
  notes?: string;
}

