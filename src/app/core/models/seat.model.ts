export type SeatCategory = 'REGULAR' | 'RECLINER' | 'SAVER' | 'VIP' | 'SPECIAL';
export type SeatState = 'AVAILABLE' | 'HELD' | 'SOLD' | 'SELECTED';

export interface Seat {
	id: string; // e.g. "10-C-14"
	rowIndex: number; // 0-based
	colIndex: number;
	rowLabel: string; // "C"
	category: SeatCategory;
	state: SeatState;
	priceBand: number; // BTN
}

export interface SeatPrice {
	category: SeatCategory;
	price: number;
}

export interface SeatRow {
	rowLabel: string;
	seats: Seat[];
}

export interface SeatMap {
	rows: SeatRow[];
	prices?: SeatPrice[];
	screenNumber?: number;
}
