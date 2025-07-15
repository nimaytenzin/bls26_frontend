import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	LayoutSection,
	LayoutSeat,
} from '../../../core/models/seat-layout.model';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Router } from '@angular/router';

export interface LayoutCell {
	number: number | null;
	category: 'BASIC' | 'PREMIUM' | null;
	state: 'AVAILABLE' | 'BOOKED' | 'PROCESSING' | 'UNAVAILABLE';
	annotation?: string; // optional text to display on this cell
}

export interface LayoutRow {
	index: number;
	label: string;
	cells: LayoutCell[];
}

// Define the overall hall layout
export interface HallLayout {
	name: string;
	columns: number;
	rows: LayoutRow[];
}

export interface SelectedSeat {
	number: number;
	rowLabel: string;
	category: 'BASIC' | 'PREMIUM' | null;
	state: 'AVAILABLE' | 'BOOKED' | 'PROCESSING' | 'UNAVAILABLE';
}

@Component({
	selector: 'app-seat-layout',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	templateUrl: './seat-layout.component.html',
	styleUrls: ['./seat-layout.component.scss'],
})
export class SeatLayoutComponent implements OnChanges {
	@Output() seatSelected = new EventEmitter<SelectedSeat>();

	columnRange(n: number): number[] {
		return Array.from({ length: n }, (_, i) => i);
	}

	displayTermsDialog: boolean = false;

	selectedSeats: SelectedSeat[] = [];
	screeningPricing = [
		{
			category: 'BASIC',
			price: 399,
		},
		{
			category: 'PREMIUM',
			price: 499,
		},
	];
	tvScreen = {
		colStart: 3, // 1-based index of first column
		colSpan: 19, // span across all columns
		label: 'TV SCREEN',
	};
	hallLayout: HallLayout = {
		name: 'Screen-4',
		columns: 24,
		rows: [
			{
				index: 0,
				label: 'A',
				cells: [
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
						annotation: 'Exit',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
				],
			},
			{
				index: 0,
				label: 'A',
				cells: [
					{ number: 1, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 2, category: 'BASIC', state: 'AVAILABLE' },
					{
						number: null,
						category: null,
						state: 'UNAVAILABLE',
					},
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 3, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 4, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 5, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 6, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 7, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 8, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 9, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 10, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 11, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 12, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 13, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 14, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 15, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 16, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 17, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 18, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 19, category: 'BASIC', state: 'AVAILABLE' },
				],
			},
			{
				index: 1,
				label: 'B',
				cells: [
					{ number: 1, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 2, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 3, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 4, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 5, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 6, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 7, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 8, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 9, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 10, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 11, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 12, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 13, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 14, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 15, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 16, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 17, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
				],
			},
			{
				index: 2,
				label: 'C',
				cells: [
					{ number: 1, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 2, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 3, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 4, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 5, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 6, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 7, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 8, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 9, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 10, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 11, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 12, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 13, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 14, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 15, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 16, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 17, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 18, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 19, category: 'BASIC', state: 'AVAILABLE' },
				],
			},
			{
				index: 3,
				label: 'D',
				cells: [
					{ number: 1, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 2, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 3, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 4, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 5, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 6, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 7, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 8, category: 'BASIC', state: 'PROCESSING' },
					{ number: 9, category: 'BASIC', state: 'PROCESSING' },
					{ number: 10, category: 'PREMIUM', state: 'AVAILABLE' },
					{ number: 11, category: 'PREMIUM', state: 'AVAILABLE' },
					{ number: 12, category: 'PREMIUM', state: 'AVAILABLE' },
					{ number: 13, category: 'PREMIUM', state: 'AVAILABLE' },
					{ number: 14, category: 'PREMIUM', state: 'AVAILABLE' },
					{ number: 15, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 16, category: 'BASIC', state: 'AVAILABLE' },
					{ number: 17, category: 'BASIC', state: 'AVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: null, category: null, state: 'UNAVAILABLE' },
					{ number: 18, category: 'BASIC', state: 'BOOKED' },
					{ number: 19, category: 'BASIC', state: 'BOOKED' },
				],
			},
		],
	};

	constructor(private router: Router) {}

	ngOnChanges() {}

	toggleSeat(seat: LayoutCell, rowLabel: string): void {
		if (seat.number === null) {
			// Guard: skip null seats
			return;
		}

		const existingIndex = this.selectedSeats.findIndex(
			(s) =>
				s.number === seat.number &&
				s.rowLabel === rowLabel &&
				s.category === seat.category &&
				s.state === seat.state
		);

		if (existingIndex > -1) {
			// Deselect
			this.selectedSeats.splice(existingIndex, 1);
		} else {
			// Select
			this.selectedSeats.push({
				number: seat.number,
				rowLabel,
				category: seat.category,
				state: seat.state,
			});
		}

		// Emit the toggled seat info
		this.seatSelected.emit({
			number: seat.number,
			rowLabel,
			category: seat.category,
			state: seat.state,
		});
	}

	isSeatSelected(seat: LayoutCell, rowLabel: string): boolean {
		if (seat.number === null) {
			return false;
		}
		return this.selectedSeats.some(
			(s) =>
				s.number === seat.number &&
				s.rowLabel === rowLabel &&
				s.category === seat.category &&
				s.state === seat.state
		);
	}
	getSeatPrice(seat: SelectedSeat): number {
		const pricing = this.screeningPricing.find(
			(p) => p.category === seat.category
		);
		return pricing ? pricing.price : 0;
	}

	// Function to calculate the total price of all selected seats
	getTotalPrice(): number {
		return this.selectedSeats.reduce(
			(sum, seat) => sum + this.getSeatPrice(seat),
			0
		);
	}

	openConfirmBooking(): void {
		this.displayTermsDialog = true;
	}

	acceptTerms(): void {
		this.displayTermsDialog = false;
		this.router.navigate(['/booking-confirmation']);
		// Implement booking confirmation logic here
	}

	// Decline terms and close dialog
	declineTerms(): void {
		this.displayTermsDialog = false;
		// Optionally clear selected seats or perform other logic
	}
}
