// Language interfaces
export interface Language {
	id: number;
	name: string;
	code?: string; // e.g., 'en', 'dz', 'hi'
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CreateLanguageDto {
	name: string;
	code?: string;
}

export interface UpdateLanguageDto {
	name?: string;
	code?: string;
}

export interface ApiResponse<T> {
	statusCode: number;
	message: string;
	data: T;
}
