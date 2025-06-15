export interface Seat {
	id: number;
	hallId: number;
	rowId: number;
	colId: number;
	seatNumber: string;
	annotation?: string;
	categoryId: number;
	category?: SeatCategory;
	hall?: Hall;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CreateSeatDto {
	hallId: number;
	rowId: number;
	colId: number;
	seatNumber: string;
	annotation?: string;
	categoryId: number;
}

export interface UpdateSeatDto {
	rowId?: number;
	colId?: number;
	seatNumber?: string;
	annotation?: string;
	categoryId?: number;
}

export interface BulkCreateSeatsDto {
	seats: CreateSeatDto[];
}

// Import from existing interfaces
import { SeatCategory } from '../seat-category/seat-category.interface';
import { Hall } from '../hall/hall.interface';
import { ApiResponse } from '../theatre/theatre.interface';
