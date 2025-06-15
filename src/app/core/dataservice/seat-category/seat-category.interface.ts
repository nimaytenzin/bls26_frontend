export interface SeatCategory {
	id: number;
	hallId: number;
	name: string;
	description?: string;
	className: string;
}

export interface CreateSeatCategoryDto {
	hallId: number;
	name: string;
	description?: string;
	className: string;
}

export interface UpdateSeatCategoryDto {
	name?: string;
	description?: string;
	className?: string;
}
