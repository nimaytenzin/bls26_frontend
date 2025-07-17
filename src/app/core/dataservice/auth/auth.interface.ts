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

export interface AdminResetPassword {
	newPassword: string;
	newPasswordAgain: string;
}
export interface User {
	id: number;
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
	THEATRE_MANAGER = 'THEATRE_MANAGER',
	EXECUTIVE_PRODUCER = 'EXECUTIVE_PRODUCER',
	COUNTER_STAFF = 'COUNTER_STAFF',
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

export interface AdminSignupDto {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber?: string;
	password: string;
	role: UserRole;
	isVerified?: boolean;
	hasLoginAccess?: boolean;
	profileImage?: string;
}

export interface AdminSignupResponse {
	statusCode: number;
	message: string;
	user: User;
}
