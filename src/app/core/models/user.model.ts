// user.model.ts (for login & session)
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'facilitator' | 'parent';
  isVerified: boolean;
}
