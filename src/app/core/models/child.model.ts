export interface Child {
  id: string;
  name: string;
  preferredName: string;
  cid: string;
  avatarUrl: string;
  studentCode: string;
  dob: string; // or Date if parsed
  gender: 'male' | 'female';
  facilityId: string;
}

export interface ChildNote {
  childId: string; // 🔗 Foreign key to Child
  medicalCondition?: string;
  specialInstruction?: string;
  notes?: string;
}

