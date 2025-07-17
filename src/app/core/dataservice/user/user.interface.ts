export enum UserRoleEnum {
	ADMIN = 'ADMIN',
	THEATRE_MANAGER = 'THEATRE_MANAGER',
	EXECUTIVE_PRODUCER = 'EXECUTIVE_PRODUCER',
	COUNTER_STAFF = 'COUNTER_STAFF',
}

export interface User {
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
	phoneNumber: string;
	password?: string;
	role: UserRoleEnum;
	isVerified: boolean;
	hasLoginAccess: boolean;
	emailVerificationToken?: string;
	emailVerificationExpiry?: Date;
	passwordResetToken?: string;
	passwordResetExpiry?: Date;
	temporaryLoginCode?: string;
	lastLoginAt?: Date;
	profileImage?: string;
	dateOfBirth?: Date;
	address?: string;
	deviceToken?: string;
	createdAt?: Date;
	updatedAt?: Date;
	fullName?: string;
}

export interface CreateUserDto {
	firstName: string;
	lastName: string;
	email?: string;
	phoneNumber: number;
	password: string;
	role: string;
	profileImage?: string;
}

export interface UpdateUserDto {
	firstName?: string;
	lastName?: string;
	email?: string;
	phoneNumber?: number;
	role?: string;
	isVerified?: boolean;
	hasLoginAccess?: boolean;
	profileImage?: string;
}

export interface UserListResponse {
	success: boolean;
	message: string;
	data: User[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		limit: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

export interface UserQueryParams {
	page?: number;
	limit?: number;
	role?: UserRoleEnum;
	isVerified?: boolean;
	hasLoginAccess?: boolean;
	search?: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message: string;
}
