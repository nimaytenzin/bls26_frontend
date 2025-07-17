import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';
import { Booking } from '../../../../../core/dataservice/booking/booking.interface';
import { BASEAPI_URL } from '../../../../../core/constants/constants';

@Component({
	selector: 'app-admin-bookings-search-by-customer',
	templateUrl: './admin-bookings-search-by-customer.component.html',
	styleUrls: ['./admin-bookings-search-by-customer.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminBookingsSearchByCustomerComponent
	implements OnInit, OnDestroy
{
	private destroy$ = new Subject<void>();

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
	bookingStatusFilter:
		| 'all'
		| 'confirmed'
		| 'pending'
		| 'failed'
		| 'cancelled' = 'all';

	// Track resending eTicket state
	resendingEtickets: Set<number> = new Set();

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
					this.applyFilters();
					this.searchPerformed = true;

					if (bookings.length === 0) {
						this.messageService.add({
							severity: 'info',
							summary: 'No Results',
							detail: 'No bookings found for the provided search criteria',
						});
					} else {
						this.messageService.add({
							severity: 'success',
							summary: 'Search Complete',
							detail: `Found ${bookings.length} booking${
								bookings.length > 1 ? 's' : ''
							}`,
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
		this.bookingStatusFilter = 'all';
		this.resendingEtickets.clear();
	}

	/**
	 * Apply filters to bookings
	 */
	applyFilters(): void {
		let filtered = [...this.bookings];

		// Apply screening status filter
		if (this.screeningStatusFilter === 'valid') {
			filtered = filtered.filter(
				(booking) => !this.isScreeningExpired(booking)
			);
		} else if (this.screeningStatusFilter === 'expired') {
			filtered = filtered.filter((booking) => this.isScreeningExpired(booking));
		}

		// Apply booking status filter
		if (this.bookingStatusFilter !== 'all') {
			filtered = filtered.filter(
				(booking) =>
					booking.bookingStatus?.toLowerCase() ===
					this.bookingStatusFilter.toLowerCase()
			);
		}

		// Sort bookings - expired screenings first, then by screening date/time
		this.filteredBookings = filtered.sort((a, b) => {
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
		return `Nu. ${amount?.toLocaleString() || '0'}`;
	}

	/**
	 * Get booking status severity for p-tag
	 */
	getBookingStatusSeverity(status: string): string {
		switch (status?.toLowerCase()) {
			case 'confirmed':
				return 'success';
			case 'pending':
			case 'payment_pending':
				return 'warning';
			case 'failed':
			case 'cancelled':
				return 'danger';
			case 'timeout':
				return 'info';
			default:
				return 'info';
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
	 * Get screening status severity
	 */
	getScreeningStatusSeverity(booking: Booking): string {
		return this.isScreeningExpired(booking) ? 'danger' : 'success';
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
	 * Get confirmed bookings count
	 */
	getConfirmedBookingsCount(): number {
		return this.bookings.filter(
			(booking) => booking.bookingStatus?.toLowerCase() === 'confirmed'
		).length;
	}

	/**
	 * Get pending bookings count
	 */
	getPendingBookingsCount(): number {
		return this.bookings.filter(
			(booking) =>
				booking.bookingStatus?.toLowerCase() === 'pending' ||
				booking.bookingStatus?.toLowerCase() === 'payment_pending'
		).length;
	}

	/**
	 * Get failed/cancelled bookings count
	 */
	getFailedBookingsCount(): number {
		return this.bookings.filter(
			(booking) =>
				booking.bookingStatus?.toLowerCase() === 'failed' ||
				booking.bookingStatus?.toLowerCase() === 'cancelled'
		).length;
	}

	/**
	 * Get movie title
	 */
	getMovieTitle(booking: Booking): string {
		return booking.screening?.movie?.name || 'Unknown Movie';
	}

	/**
	 * Get theatre and hall info
	 */
	getTheatreInfo(booking: Booking): string {
		const theatre = booking.screening?.hall?.theatre?.name;
		const hall = booking.screening?.hall?.name;
		if (theatre && hall) {
			return `${theatre} - ${hall}`;
		}
		return theatre || hall || 'Unknown Theatre';
	}

	/**
	 * Get screening time formatted
	 */
	getScreeningTime(booking: Booking): string {
		if (!booking.screening) return 'Unknown Time';

		const date = booking.screening.date;
		const startTime = booking.screening.startTime;

		if (date && startTime) {
			const screeningDate = new Date(date);
			return `${screeningDate.toLocaleDateString()} at ${this.formatTime(
				startTime
			)}`;
		}

		return 'Unknown Time';
	}

	/**
	 * Format time to 12-hour format
	 */
	formatTime(time: string): string {
		if (!time) return '';

		// Handle HH:MM:SS format
		if (time.includes(':')) {
			const timeParts = time.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = timeParts[1];
				const period = hours >= 12 ? 'PM' : 'AM';
				const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
				return `${displayHours}:${minutes} ${period}`;
			}
		}

		return time;
	}

	/**
	 * Get movie poster URL
	 */
	getMoviePosterUrl(booking: Booking): string | null {
		const movie = booking.screening?.movie;
		if (!movie?.media || !Array.isArray(movie.media)) {
			return null;
		}

		const posterImage = movie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);

		return posterImage ? `${BASEAPI_URL}${posterImage.uri}` : null;
	}

	/**
	 * Handle image error
	 */
	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	/**
	 * Format date for display
	 */
	formatDate(date: any): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	/**
	 * Check if resend eTicket is available for a booking
	 */
	canResendEticket(booking: Booking): boolean {
		// Can resend if booking is confirmed and screening is not expired
		return (
			booking.bookingStatus?.toLowerCase() === 'confirmed' &&
			!this.isScreeningExpired(booking)
		);
	}

	/**
	 * Check if eTicket is being resent for a booking
	 */
	isResendingEticket(bookingId: number): boolean {
		return this.resendingEtickets.has(bookingId);
	}

	/**
	 * Resend eTicket for a booking
	 */
	resendEticket(booking: Booking): void {
		if (!this.canResendEticket(booking)) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Cannot Resend',
				detail:
					'eTicket can only be resent for confirmed bookings with valid screenings',
			});
			return;
		}

		if (!booking.id) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Invalid booking ID',
			});
			return;
		}

		// Set loading state for this specific booking
		this.resendingEtickets.add(booking.id);

		this.bookingService
			.resendEticket(booking.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: any) => {
					this.resendingEtickets.delete(booking.id!);
					this.messageService.add({
						severity: 'success',
						summary: 'eTicket Sent',
						detail: `eTicket has been resent successfully to ${
							booking.email || booking.phoneNumber
						}`,
					});
				},
				error: (error: any) => {
					this.resendingEtickets.delete(booking.id!);
					console.error('Error resending eTicket:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Resend Failed',
						detail:
							error.error?.message ||
							'Failed to resend eTicket. Please try again.',
					});
				},
			});
	}
}
