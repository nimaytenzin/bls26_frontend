// Auth-related interfaces and types

export interface LoginDto {
	phoneNumber: number;
	password: string;
}

export interface LoginResponse {
	statusCode: number;
	message: string;
	token: string;
	user: User;
}

export interface User {
	id: string;
	email: string;
	phoneNumber: number;
	firstName: string;
	lastName: string;
	role: UserRole;
	isVerified: boolean;
	hasLoginAccess: boolean;
	profileImage: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserJwtPayload {
	id: string;
	email: string;
	phoneNumber: number;
	firstName: string;
	lastName: string;
	role: UserRole;
	isVerified: boolean;
}

export enum UserRole {
	ADMIN = 'ADMIN',
	MANAGER = 'MANAGER',
	USER = 'USER',
	CUSTOMER = 'CUSTOMER',
}

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
}

export interface ApiError {
	statusCode: number;
	message: string;
	error?: string;
}
