// Genre interfaces
export interface Genre {
	id: number;
	name: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CreateGenreDto {
	name: string;
}

export interface UpdateGenreDto {
	name?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
