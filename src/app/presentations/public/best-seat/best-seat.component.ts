import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';

interface Seat {
	id: string;
	row: string;
	number: number;
	type: 'standard' | 'premium' | 'vip' | 'couple' | 'disabled';
	status: 'available' | 'selected' | 'occupied' | 'blocked';
	price: number;
	x: number;
	y: number;
}

interface SeatLayout {
	totalRows: number;
	seatsPerRow: number[];
	aisles: number[];
	premiumRows: number[];
	vipRows: number[];
	coupleRows: number[];
	disabledSeats: string[];
}

@Component({
	selector: 'app-best-seat',
	templateUrl: './best-seat.component.html',
	styleUrls: ['./best-seat.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		ChipModule,
		ToastModule,
		TooltipModule,
		CardModule,
		BadgeModule,
	],
	providers: [MessageService],
})
export class BestSeatComponent implements OnInit {
	// Seat layout configuration
	layout: SeatLayout = {
		totalRows: 15,
		seatsPerRow: [16, 18, 20, 22, 24, 26, 28, 28, 28, 26, 24, 22, 20, 18, 16],
		aisles: [4, 8, 12], // Aisle positions (columns)
		premiumRows: [6, 7, 8, 9], // Rows 6-9 are premium
		vipRows: [10, 11, 12], // Rows 10-12 are VIP
		coupleRows: [13, 14], // Last 2 rows are couple seats
		disabledSeats: ['A1', 'A16', 'B1', 'B18'], // Wheelchair accessible
	};

	// Seat data
	seats: Seat[] = [];
	selectedSeats: Seat[] = [];
	maxSeatsPerBooking = 8;

	// Pricing
	prices = {
		standard: 399,
		premium: 599,
		vip: 899,
		couple: 1299,
		disabled: 299,
	};

	// Mini map settings
	showMiniMap = true;
	miniMapScale = 0.15;

	// Current view settings
	zoomLevel = 1;
	panX = 0;
	panY = 0;

	// Statistics
	totalSeats = 0;
	availableSeats = 0;
	occupiedSeats = 0;

	constructor(private messageService: MessageService) {}

	ngOnInit() {
		this.generateSeatLayout();
		this.calculateStatistics();
	}

	generateSeatLayout() {
		this.seats = [];
		let seatId = 1;

		for (let rowIndex = 0; rowIndex < this.layout.totalRows; rowIndex++) {
			const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, etc.
			const seatsInRow = this.layout.seatsPerRow[rowIndex];

			for (let seatNumber = 1; seatNumber <= seatsInRow; seatNumber++) {
				const seatCode = `${rowLetter}${seatNumber}`;

				// Determine seat type
				let seatType: Seat['type'] = 'standard';
				if (this.layout.disabledSeats.includes(seatCode)) {
					seatType = 'disabled';
				} else if (this.layout.coupleRows.includes(rowIndex + 1)) {
					seatType = 'couple';
				} else if (this.layout.vipRows.includes(rowIndex + 1)) {
					seatType = 'vip';
				} else if (this.layout.premiumRows.includes(rowIndex + 1)) {
					seatType = 'premium';
				}

				// Random occupancy for demo (70% available)
				const status: Seat['status'] =
					Math.random() > 0.7 ? 'occupied' : 'available';

				const seat: Seat = {
					id: seatCode,
					row: rowLetter,
					number: seatNumber,
					type: seatType,
					status: status,
					price: this.prices[seatType],
					x: seatNumber,
					y: rowIndex + 1,
				};

				this.seats.push(seat);
				seatId++;
			}
		}
	}

	calculateStatistics() {
		this.totalSeats = this.seats.length;
		this.availableSeats = this.seats.filter(
			(seat) => seat.status === 'available'
		).length;
		this.occupiedSeats = this.seats.filter(
			(seat) => seat.status === 'occupied'
		).length;
	}

	onSeatClick(seat: Seat) {
		if (seat.status === 'occupied' || seat.status === 'blocked') {
			this.messageService.add({
				severity: 'warn',
				summary: 'Seat Unavailable',
				detail: `Seat ${seat.id} is not available for booking.`,
			});
			return;
		}

		if (seat.status === 'selected') {
			// Deselect seat
			seat.status = 'available';
			this.selectedSeats = this.selectedSeats.filter((s) => s.id !== seat.id);
			this.messageService.add({
				severity: 'info',
				summary: 'Seat Deselected',
				detail: `Seat ${seat.id} has been deselected.`,
			});
		} else {
			// Select seat
			if (this.selectedSeats.length >= this.maxSeatsPerBooking) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Maximum Seats',
					detail: `You can select maximum ${this.maxSeatsPerBooking} seats.`,
				});
				return;
			}

			seat.status = 'selected';
			this.selectedSeats.push(seat);
			this.messageService.add({
				severity: 'success',
				summary: 'Seat Selected',
				detail: `Seat ${seat.id} selected for ₹${seat.price}`,
			});
		}
	}

	getSeatClass(seat: Seat): string {
		const baseClasses =
			'seat transition-all duration-300 transform hover:scale-110 cursor-pointer';

		switch (seat.status) {
			case 'available':
				switch (seat.type) {
					case 'standard':
						return `${baseClasses} seat-standard`;
					case 'premium':
						return `${baseClasses} seat-premium`;
					case 'vip':
						return `${baseClasses} seat-vip`;
					case 'couple':
						return `${baseClasses} seat-couple`;
					case 'disabled':
						return `${baseClasses} seat-disabled`;
					default:
						return `${baseClasses} seat-standard`;
				}
			case 'selected':
				return `${baseClasses} seat-selected`;
			case 'occupied':
				return `${baseClasses} seat-occupied cursor-not-allowed`;
			case 'blocked':
				return `${baseClasses} seat-blocked cursor-not-allowed`;
			default:
				return baseClasses;
		}
	}

	getRowSeats(rowIndex: number): Seat[] {
		const rowLetter = String.fromCharCode(65 + rowIndex);
		return this.seats.filter((seat) => seat.row === rowLetter);
	}

	hasAisle(seatNumber: number): boolean {
		return this.layout.aisles.includes(seatNumber);
	}

	getTotalPrice(): number {
		return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
	}

	clearSelection() {
		this.selectedSeats.forEach((seat) => (seat.status = 'available'));
		this.selectedSeats = [];
		this.messageService.add({
			severity: 'info',
			summary: 'Selection Cleared',
			detail: 'All selected seats have been cleared.',
		});
	}

	proceedToBooking() {
		if (this.selectedSeats.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Seats Selected',
				detail: 'Please select at least one seat to proceed.',
			});
			return;
		}

		this.messageService.add({
			severity: 'success',
			summary: 'Proceeding to Payment',
			detail: `Booking ${
				this.selectedSeats.length
			} seats for ₹${this.getTotalPrice()}`,
		});
	}

	// Mini map methods
	toggleMiniMap() {
		this.showMiniMap = !this.showMiniMap;
	}

	// Zoom and pan methods
	zoomIn() {
		this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
	}

	zoomOut() {
		this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
	}

	resetView() {
		this.zoomLevel = 1;
		this.panX = 0;
		this.panY = 0;
	}

	// Get best seats suggestion
	getBestSeats(count: number = 2): Seat[] {
		// Center rows with good viewing angle (rows 6-9)
		const centerRows = this.seats.filter(
			(seat) =>
				seat.status === 'available' && ['F', 'G', 'H', 'I'].includes(seat.row)
		);

		// Find consecutive seats in center
		const bestSeats: Seat[] = [];
		for (let i = 0; i < centerRows.length - count + 1; i++) {
			const consecutive = centerRows.slice(i, i + count);
			if (
				consecutive.every(
					(seat, index) =>
						index === 0 || seat.number === consecutive[index - 1].number + 1
				)
			) {
				return consecutive;
			}
		}

		// Fallback to any available consecutive seats
		return this.seats
			.filter((seat) => seat.status === 'available')
			.slice(0, count);
	}

	selectBestSeats() {
		this.clearSelection();
		const bestSeats = this.getBestSeats(2);
		bestSeats.forEach((seat) => this.onSeatClick(seat));
	}

	// Utility methods
	getRowLetter(index: number): string {
		return String.fromCharCode(65 + index);
	}

	// Get seat position relative to screen (left, center, right)
	getSeatPositionRelativeToScreen(seat: Seat): 'left' | 'center' | 'right' {
		const rowSeats = this.getRowSeats(seat.row.charCodeAt(0) - 65);
		const totalSeatsInRow = rowSeats.length;
		const seatPosition = seat.number;

		if (seatPosition <= totalSeatsInRow / 3) {
			return 'left';
		} else if (seatPosition >= (totalSeatsInRow * 2) / 3) {
			return 'right';
		} else {
			return 'center';
		}
	}

	// Enhanced seat tooltip with position info
	getSeatTooltip(seat: Seat): string {
		const position = this.getSeatPositionRelativeToScreen(seat);
		const positionText =
			position === 'center'
				? 'Center View'
				: position === 'left'
				? 'Left Side'
				: 'Right Side';
		return `${seat.id} - ₹${seat.price} (${seat.type}) - ${positionText}`;
	}
}
