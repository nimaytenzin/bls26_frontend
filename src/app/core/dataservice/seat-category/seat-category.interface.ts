export interface SeatCategory {
	id: number;
	hallId: number;
	name: string;
	description?: string;
	baseColorHexCode: string;
}

export interface CreateSeatCategoryDto {
	hallId: number;
	name: string;
	description?: string;
	baseColorHexCode: string;
}

export interface UpdateSeatCategoryDto {
	name?: string;
	description?: string;
	baseColorHexCode?: string;
}
