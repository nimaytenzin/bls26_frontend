//owner model for registration
export interface Owner {
  id?: number; // optional during creation, added by backend/json-server
  name: string;
  email: string;
  cid: string;
  phone: string;
  facility: string;
  role: 'owner';
  isVerified: boolean;
	verifyToken?: string; // optional, only used if needed in frontend
}
