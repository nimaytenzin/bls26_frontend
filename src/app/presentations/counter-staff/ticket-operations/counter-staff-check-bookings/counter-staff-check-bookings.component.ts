import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../primeng.modules';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import { Booking } from '../../../../core/dataservice/booking/booking.interface';

@Component({
	selector: 'app-counter-staff-check-bookings',
	templateUrl: './counter-staff-check-bookings.component.html',
	styleUrls: ['./counter-staff-check-bookings.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class CounterStaffCheckBookingsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Search form data
	searchPhoneNumber: string = '';
	searchEmail: string = '';

	// Results
	bookings: Booking[] = [];
	searchPerformed: boolean = false;
	loading: boolean = false;

	constructor(
		private bookingService: BookingDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		// Component initialization
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Search bookings by phone number or email
	 */
	searchBookings(): void {
		// Validate that at least one search field is provided
		if (!this.searchPhoneNumber.trim() && !this.searchEmail.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Search Required',
				detail: 'Please enter either phone number or email address to search',
			});
			return;
		}

		this.loading = true;
		this.bookings = [];

		const phoneNumber = this.searchPhoneNumber.trim() || undefined;
		const email = this.searchEmail.trim() || undefined;

		this.bookingService
			.searchBookings(phoneNumber, email)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (bookings: Booking[]) => {
					this.loading = false;
					this.bookings = bookings;
					this.searchPerformed = true;

					if (bookings.length === 0) {
						this.messageService.add({
							severity: 'info',
							summary: 'No Results',
							detail: 'No bookings found for the provided search criteria',
						});
					}
				},
				error: (error: any) => {
					this.loading = false;
					console.error('Error searching bookings:', error);

					this.messageService.add({
						severity: 'error',
						summary: 'Search Failed',
						detail:
							error.error?.message ||
							'Failed to search bookings. Please try again.',
					});
				},
			});
	}

	/**
	 * Clear search form and results
	 */
	clearSearch(): void {
		this.searchPhoneNumber = '';
		this.searchEmail = '';
		this.bookings = [];
		this.searchPerformed = false;
	}

	/**
	 * Format currency amount
	 */
	formatCurrency(amount: number): string {
		return `Nu. ${amount.toLocaleString()}`;
	}

	/**
	 * Get booking status badge class
	 */
	getStatusClass(status: string): string {
		switch (status?.toLowerCase()) {
			case 'confirmed':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	/**
	 * Get seats text for a booking
	 */
	getBookingSeatsText(booking: Booking): string {
		if (!booking.bookingSeats || booking.bookingSeats.length === 0) {
			return 'No seats';
		}
		return booking.bookingSeats
			.map((bs) => bs.seat?.seatNumber)
			.filter((seatNumber) => seatNumber)
			.join(', ');
	}
}
