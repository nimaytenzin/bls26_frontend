import { SeatCategory } from '../seat-category/seat-category.interface';
import { Seat } from '../seat/seat.interface';
import { Theatre } from '../theatre/theatre.interface';

export interface Hall {
	id: number;
	name: string;
	description?: string;
	capacity: number;
	rows: number;
	columns: number;
	screenStart: number;
	screenSpan: number;
	theatreId: number;
	theatre: Theatre; // Theatre interface reference
	createdAt?: Date;
	updatedAt?: Date;
	seatCategories?: SeatCategory[];
	seats?: Seat[];
}

export interface CreateHallDto {
	name: string;
	description?: string;
	capacity: number;
	rows: number;
	columns: number;
	screenStart: number;
	screenSpan: number;
	theatreId: number;
}

export interface UpdateHallDto {
	name?: string;
	description?: string;
	capacity?: number;
	rows?: number;
	columns?: number;
	screenStart?: number;
	screenSpan?: number;
}
