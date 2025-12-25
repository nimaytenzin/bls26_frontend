// Auth-related interfaces and types for NSFD

import { AdministrativeZone } from '../location/administrative-zone/administrative-zone.dto';
import { Survey } from '../survey/survey.dto';

export interface LoginDto {
	email: string;
	password: string;
}

export interface RegisterDto {
	name: string;
	cid: string;
	emailAddress: string;
	phoneNumber: string;
	password: string;
	role: UserRole;
}

export interface LoginResponse {
	user: User;
	token: string;
}

export interface RegisterResponse {
	user: User;
	token: string;
}

export interface ChangePasswordDto {
	currentPassword: string;
	newPassword: string;
}

export interface UpdateProfileDto {
	name?: string;
	emailAddress?: string;
	phoneNumber?: string;
}

export interface UpdateProfileResponse {
	user: User;
	message: string;
}

export interface ChangePasswordResponse {
	message: string;
}

export interface CreateSupervisorDto {
	name: string;
	cid: string;
	emailAddress: string;
	phoneNumber: string;
	password: string;
}

export interface CreateEnumeratorDto {
	name: string;
	cid: string;
	emailAddress: string;
	phoneNumber: string;
	password: string;
}

export interface UpdateUserDto {
	name?: string;
	phoneNumber?: string;
	emailAddress?: string;
	role?: UserRole;
}

export interface User {
	id: number;
	name: string;
	cid: string;
	emailAddress: string;
	phoneNumber: string;
	role: UserRole;
	profileImage?: string;
	isVerified?: boolean;
	hasLoginAccess?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface Supervisor extends User {
	dzongkhags?: Dzongkhag[];
}

export interface Dzongkhag {
	id: number;
	name: string;
	areaCode?: string;
	areaSqKm?: number;
	createdAt?: Date;
	updatedAt?: Date;

	administrativeZones: AdministrativeZone[];
}

export interface UserJwtPayload {
	id: number;
	name: string;
	cid: string;
	emailAddress: string;
	phoneNumber: string;
	role: UserRole;
}

export enum UserRole {
	ADMIN = 'ADMIN',
	SUPERVISOR = 'SUPERVISOR',
	ENUMERATOR = 'ENUMERATOR',
	THEATRE_MANAGER = 'THEATRE_MANAGER',
	EXECUTIVE_PRODUCER = 'EXECUTIVE_PRODUCER',
	COUNTER_STAFF = 'COUNTER_STAFF',
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

// Legacy interfaces for backward compatibility
export interface AdminResetPassword {
	newPassword: string;
	newPasswordAgain: string;
}

export interface AdminSignupDto {
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	cid: string;
	emailAddress: string;
	phoneNumber?: string;
	password: string;
	role: UserRole;
	isVerified?: boolean;
	hasLoginAccess?: boolean;
}

export interface AdminSignupResponse {
	statusCode: number;
	message: string;
	user: User;
}

// Supervisor-Dzongkhag Assignment interfaces
export interface SupervisorDzongkhagAssignment {
	id: number;
	supervisorId: number;
	dzongkhagId: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface AssignDzongkhagDto {
	dzongkhagIds: number[];
}

export interface AssignDzongkhagResponse {
	message: string;
	assigned: SupervisorDzongkhagAssignment[];
}

export interface RemoveDzongkhagResponse {
	message: string;
	removedCount: number;
}

// User Profile Interfaces
export interface SurveyAssignment {
	userId: number;
	surveyId: number;
	survey?: Survey;
	assignedAt?: Date;
}

export interface EnumeratorProfile {
	user: User;
	allSurveys?: SurveyAssignment[];
	activeSurveys?: Survey[];
}

export interface SupervisorProfile {
	user: User;
	dzongkhags?: Dzongkhag[];
}

export interface AdminProfile {
	user: User;
}

export type UserProfile = EnumeratorProfile | SupervisorProfile | AdminProfile;
