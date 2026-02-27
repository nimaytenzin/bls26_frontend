/**
 * Auth module interfaces aligned with Livability Backend API.
 * Base URL: /auth
 */

export enum UserRole {
	ADMIN = 'ADMIN',
	ENUMERATOR = 'ENUMERATOR',
}

export interface User {
	id: number;
	name: string;
	cid: string;
	phoneNumber?: string;
	role: UserRole;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface LoginDto {
	cid: string;
	password: string;
}

export interface RegisterDto {
	name: string;
	cid: string;
	phoneNumber?: string;
	password: string;
	role?: UserRole;
}

export interface AuthResponse {
	user: User;
	token: string;
}

export interface CreateUserDto {
	name: string;
	cid: string;
	phoneNumber?: string;
	password: string;
	role: UserRole;
}

export interface UpdateProfileDto {
	name?: string;
	phoneNumber?: string;
}

/** Alias for admin update user (same as UpdateProfileDto). */
export type UpdateUserDto = UpdateProfileDto;

/** Backward compatibility: Supervisor is same as User (backend has only ADMIN | ENUMERATOR). */
export type Supervisor = User;

export interface ChangePasswordDto {
	currentPassword: string;
	newPassword: string;
}

export interface ResetPasswordDto {
	newPassword: string;
}

export interface BulkEnumeratorsDto {
	enumerators: Array<{
		name: string;
		cid: string;
		phoneNumber?: string;
		password: string;
	}>;
}

export interface BulkEnumeratorsResponse {
	created: number;
	failed: number;
	users?: User[];
	errors?: Array<{ row?: number; message: string }>;
}
