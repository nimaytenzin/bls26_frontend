import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Hall } from '../../../../core/dataservice/hall/hall.interface';

export interface Seat {
	row: number;
	col: number;
	seatNumber: string;
	type: 'BASIC' | 'PREMIUM';
	isSelected?: boolean;
}

@Component({
	selector: 'app-admin-hall-view-layout',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		CardModule,
		ButtonModule,
		DropdownModule,
		ChipModule,
		TooltipModule,
	],
	templateUrl: './admin-hall-view-layout.component.html',
	styleUrls: ['./admin-hall-view-layout.component.css'],
})
export class AdminHallViewLayoutComponent implements OnInit {
	seats: Seat[] = [];
	seatTypes = [
		{ label: 'Basic', value: 'BASIC', color: 'bg-blue-500' },
		{ label: 'Premium', value: 'PREMIUM', color: 'bg-green-500' },
	];

	rows: number = 10; // Number of rows
	cols: number = 12; // Number of columns

	// Generate arrays for template iteration
	rowArray = Array.from({ length: this.rows }, (_, i) => i);
	colArray = Array.from({ length: this.cols }, (_, i) => i);

	// Expose String to template
	String = String;

	hallDetails!: Hall;

	constructor(private config: DynamicDialogConfig) {
		this.hallDetails = this.config.data;
	}

	ngOnInit() {
		this.createMixedSeatLayout();
	}

	createMixedSeatLayout(): void {
		const seatDefinitions = [
			[0, 0, 'BASIC', 'A1'],
			[0, 1, 'BASIC', 'A2'],
			[0, 2, 'BASIC', 'A3'],
			[0, 4, 'BASIC', 'A4'],
			[0, 5, 'BASIC', 'A5'],
			[0, 6, 'BASIC', 'A6'],
			[0, 7, 'BASIC', 'A7'],
			[0, 9, 'BASIC', 'A8'],

			[0, 11, 'BASIC', 'A10'],

			[1, 0, 'BASIC', 'B1'],
			[1, 1, 'BASIC', 'B2'],
			[1, 2, 'BASIC', 'B3'],
			[1, 4, 'BASIC', 'B4'],
			[1, 5, 'BASIC', 'B5'],
			[1, 6, 'BASIC', 'B6'],
			[1, 7, 'BASIC', 'B7'],
			[1, 9, 'BASIC', 'B8'],
			[1, 10, 'BASIC', 'B9'],
			[1, 11, 'BASIC', 'B10'],

			// Row C (2) - Basic
			[2, 0, 'BASIC', 'C1'],
			[2, 1, 'BASIC', 'C2'],
			[2, 2, 'BASIC', 'C3'],
			[2, 4, 'BASIC', 'C4'],
			[2, 5, 'BASIC', 'C5'],
			[2, 6, 'BASIC', 'C6'],
			[2, 7, 'BASIC', 'C7'],
			[2, 9, 'BASIC', 'C8'],
			[2, 10, 'BASIC', 'C9'],
			[2, 11, 'BASIC', 'C10'],

			// Row D (3) - Walkway (no seats)

			// Row E (4) - Basic
			[4, 0, 'BASIC', 'E1'],
			[4, 1, 'BASIC', 'E2'],
			[4, 2, 'BASIC', 'E3'],
			[4, 4, 'BASIC', 'E4'],
			[4, 5, 'BASIC', 'E5'],
			[4, 6, 'BASIC', 'E6'],
			[4, 7, 'BASIC', 'E7'],
			[4, 9, 'BASIC', 'E8'],
			[4, 10, 'BASIC', 'E9'],
			[4, 11, 'BASIC', 'E10'],

			// Row F (5) - Basic
			[5, 0, 'BASIC', 'F1'],
			[5, 1, 'BASIC', 'F2'],
			[5, 2, 'BASIC', 'F3'],
			[5, 4, 'BASIC', 'F4'],
			[5, 5, 'BASIC', 'F5'],
			[5, 6, 'BASIC', 'F6'],
			[5, 7, 'BASIC', 'F7'],
			[5, 9, 'BASIC', 'F8'],
			[5, 10, 'BASIC', 'F9'],
			[5, 11, 'BASIC', 'F10'],

			// Row G (6) - Walkway (no seats)

			// Row H (7) - Premium
			[7, 0, 'PREMIUM', 'H1'],
			[7, 1, 'PREMIUM', 'H2'],
			[7, 2, 'PREMIUM', 'H3'],
			[7, 4, 'PREMIUM', 'H4'],
			[7, 5, 'PREMIUM', 'H5'],
			[7, 6, 'PREMIUM', 'H6'],
			[7, 7, 'PREMIUM', 'H7'],
			[7, 9, 'PREMIUM', 'H8'],
			[7, 10, 'PREMIUM', 'H9'],
			[7, 11, 'PREMIUM', 'H10'],

			// Row I (8) - Premium
			[8, 0, 'PREMIUM', 'I1'],
			[8, 1, 'PREMIUM', 'I2'],
			[8, 2, 'PREMIUM', 'I3'],
			[8, 4, 'PREMIUM', 'I4'],
			[8, 5, 'PREMIUM', 'I5'],
			[8, 6, 'PREMIUM', 'I6'],
			[8, 7, 'PREMIUM', 'I7'],
			[8, 9, 'PREMIUM', 'I8'],
			[8, 10, 'PREMIUM', 'I9'],
			[8, 11, 'PREMIUM', 'I10'],

			// Row J (9) - Premium back
			[9, 0, 'PREMIUM', 'J1'],
			[9, 1, 'PREMIUM', 'J2'],
			[9, 2, 'PREMIUM', 'J3'],
			[9, 4, 'PREMIUM', 'J4'],
			[9, 5, 'PREMIUM', 'J5'],
			[9, 6, 'PREMIUM', 'J6'],
			[9, 7, 'PREMIUM', 'J7'],
			[9, 9, 'PREMIUM', 'J8'],
			[9, 10, 'PREMIUM', 'J9'],
			[9, 11, 'PREMIUM', 'J10'],
		];

		this.seats = seatDefinitions.map(([row, col, type, seatNumber]) => ({
			row: row as number,
			col: col as number,
			type: type as 'BASIC' | 'PREMIUM',
			seatNumber: seatNumber as string,
			isSelected: false,
		}));
	}

	// Helper method to find seat at specific position
	getSeatAt(row: number, col: number): Seat | null {
		return (
			this.seats.find((seat) => seat.row === row && seat.col === col) || null
		);
	}

	getSeatClass(row: number, col: number): string {
		const seat = this.getSeatAt(row, col);
		const baseClass =
			'w-10 h-10 rounded flex items-center justify-center text-xs font-medium transition-all duration-200';

		// Handle empty spaces (no seat defined)
		if (!seat) {
			return `${baseClass} bg-gray-100 border border-dashed border-gray-300`;
		}

		// Handle actual seats
		const seatClass = `${baseClass} cursor-pointer border-2 hover:scale-110`;

		if (seat.isSelected) {
			return `${seatClass} border-blue-600 bg-blue-200 text-blue-800`;
		}

		switch (seat.type) {
			case 'BASIC':
				return `${seatClass} border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200`;
			case 'PREMIUM':
				return `${seatClass} border-green-300 bg-green-100 text-green-700 hover:bg-green-200`;
			default:
				return `${seatClass} border-gray-300 bg-gray-100 text-gray-700`;
		}
	}

	getSeatDisplayText(row: number, col: number): string {
		const seat = this.getSeatAt(row, col);
		if (!seat) return '';

		// Return the full seat number
		return seat.seatNumber;
	}

	resetLayout(): void {
		this.createMixedSeatLayout();
	}

	getLegendSeatClass(type: string): string {
		const baseClass =
			'w-4 h-4 rounded border-2 flex items-center justify-center text-xs font-medium';

		switch (type) {
			case 'BASIC':
				return `${baseClass} border-blue-300 bg-blue-100 text-blue-700`;
			case 'PREMIUM':
				return `${baseClass} border-green-300 bg-green-100 text-green-700`;
			default:
				return `${baseClass} border-gray-300 bg-gray-100 text-gray-700`;
		}
	}

	getSeatsCount(seatType: 'BASIC' | 'PREMIUM'): number {
		return this.seats.filter((seat) => seat.type === seatType).length;
	}

	getTotalSeats(): number {
		return this.seats.length;
	}
}
