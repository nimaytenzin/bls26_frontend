export interface Guardian {
  id?: string;
  name: string;
  relationship: string; // e.g., 'aunt', 'uncle', 'neighbor'
  phone: string;
  email?: string;
  avatarUrl?: string;
  childId: string;
}
