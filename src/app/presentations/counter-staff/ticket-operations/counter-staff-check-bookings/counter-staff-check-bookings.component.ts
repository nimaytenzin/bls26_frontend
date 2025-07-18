import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../primeng.modules';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import { Booking } from '../../../../core/dataservice/booking/booking.interface';
import { StaffEticketComponent } from '../shared-components/staff-eticket/staff-eticket.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
	selector: 'app-counter-staff-check-bookings',
	templateUrl: './counter-staff-check-bookings.component.html',
	styleUrls: ['./counter-staff-check-bookings.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, DialogService],
})
export class CounterStaffCheckBookingsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	ref: DynamicDialogRef | undefined;
	// Search form data
	searchPhoneNumber: string = '';
	searchEmail: string = '';

	// Results
	bookings: Booking[] = [];
	filteredBookings: Booking[] = [];
	searchPerformed: boolean = false;
	loading: boolean = false;

	// Filter options
	screeningStatusFilter: 'all' | 'valid' | 'expired' = 'all';

	// Modal properties
	showTicketModal: boolean = false;
	selectedBooking: Booking | null = null;

	// Add to class properties
	resendingETicketId: number | null = null;

	constructor(
		private bookingService: BookingDataService,
		private messageService: MessageService,
		private dialogService: DialogService
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
					this.applyFilters();
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
		this.filteredBookings = [];
		this.searchPerformed = false;
		this.screeningStatusFilter = 'all';
	}

	/**
	 * Apply filters to bookings
	 */
	applyFilters(): void {
		if (this.screeningStatusFilter === 'all') {
			// Sort to show expired bookings first for better visibility
			this.filteredBookings = [...this.bookings].sort((a, b) => {
				const aExpired = this.isScreeningExpired(a);
				const bExpired = this.isScreeningExpired(b);

				// If one is expired and the other isn't, expired comes first
				if (aExpired && !bExpired) return -1;
				if (!aExpired && bExpired) return 1;

				// If both are expired or both are valid, sort by screening date/time (newest first)
				const aDateTime = this.getScreeningDateTime(a);
				const bDateTime = this.getScreeningDateTime(b);
				return bDateTime.getTime() - aDateTime.getTime();
			});
		} else if (this.screeningStatusFilter === 'valid') {
			this.filteredBookings = this.bookings
				.filter((booking) => !this.isScreeningExpired(booking))
				.sort((a, b) => {
					const aDateTime = this.getScreeningDateTime(a);
					const bDateTime = this.getScreeningDateTime(b);
					return aDateTime.getTime() - bDateTime.getTime(); // Upcoming screenings first
				});
		} else if (this.screeningStatusFilter === 'expired') {
			this.filteredBookings = this.bookings
				.filter((booking) => this.isScreeningExpired(booking))
				.sort((a, b) => {
					const aDateTime = this.getScreeningDateTime(a);
					const bDateTime = this.getScreeningDateTime(b);
					return bDateTime.getTime() - aDateTime.getTime(); // Most recently expired first
				});
		}
	}

	/**
	 * Helper method to get screening date/time as Date object
	 */
	private getScreeningDateTime(booking: Booking): Date {
		if (!booking.screening?.date || !booking.screening?.startTime) {
			return new Date(0); // Return epoch for invalid dates
		}

		try {
			const screeningDate = new Date(booking.screening.date);
			const [startHours, startMinutes] = booking.screening.startTime
				.split(':')
				.map(Number);
			screeningDate.setHours(startHours, startMinutes, 0, 0);
			return screeningDate;
		} catch (error) {
			console.error('Error parsing screening date/time:', error);
			return new Date(0);
		}
	}

	/**
	 * Handle filter change
	 */
	onFilterChange(): void {
		this.applyFilters();
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

	/**
	 * Check if screening has expired (past end time)
	 */
	isScreeningExpired(booking: Booking): boolean {
		if (!booking.screening?.date || !booking.screening?.endTime) {
			return false;
		}

		try {
			// Parse the screening date and end time
			const screeningDate = new Date(booking.screening.date);
			const [endHours, endMinutes] = booking.screening.endTime
				.split(':')
				.map(Number);

			// Set the end time on the screening date
			const screeningEndDateTime = new Date(screeningDate);
			screeningEndDateTime.setHours(endHours, endMinutes, 0, 0);

			// Compare with current time
			const now = new Date();
			return now > screeningEndDateTime;
		} catch (error) {
			console.error('Error parsing screening date/time:', error);
			return false;
		}
	}

	/**
	 * Get screening status class
	 */
	getScreeningStatusClass(booking: Booking): string {
		return this.isScreeningExpired(booking)
			? 'bg-red-100 text-red-800'
			: 'bg-green-100 text-green-800';
	}

	/**
	 * Get screening status text
	 */
	getScreeningStatusText(booking: Booking): string {
		return this.isScreeningExpired(booking) ? 'Expired' : 'Valid';
	}

	/**
	 * Get count of expired bookings
	 */
	getExpiredBookingsCount(): number {
		return this.bookings.filter((booking) => this.isScreeningExpired(booking))
			.length;
	}

	/**
	 * Get count of valid bookings
	 */
	getValidBookingsCount(): number {
		return this.bookings.filter((booking) => !this.isScreeningExpired(booking))
			.length;
	}

	/**
	 * Open ticket view modal
	 */
	viewTicket(booking: Booking): void {
		this.selectedBooking = booking;
		this.ref = this.dialogService.open(StaffEticketComponent, {
			data: {
				booking: this.selectedBooking,
			},
			header: 'E Ticket',
			closable: true,
			dismissableMask: true,
		});
	}

	/**
	 * Add method to class
	 */
	resendETicket(booking: Booking): void {
		if (!booking?.id) return;
		this.resendingETicketId = booking.id;
		this.bookingService.resendEticket(booking.id).subscribe({
			next: (res) => {
				this.resendingETicketId = null;
				this.messageService.add({
					severity: 'success',
					summary: 'eTicket Sent',
					detail: 'eTicket has been resent to the customer.',
				});
			},
			error: (err) => {
				this.resendingETicketId = null;
				this.messageService.add({
					severity: 'error',
					summary: 'Failed',
					detail: 'Failed to resend eTicket. Please try again.',
				});
			},
		});
	}
}
