export interface Dzongkhag {
	id: number;
	name: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CreateDzongkhagDto {
	name: string;
}

export interface UpdateDzongkhagDto {
	name?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
