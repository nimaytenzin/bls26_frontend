import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { BASEAPI_URL } from '../../../../../core/constants/constants';
import {
	Screening,
	ScreeningSeatPrice,
} from '../../../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';
import { Booking } from '../../../../../core/dataservice/booking/booking.interface';

@Component({
	selector: 'app-admin-screening-detailed-view',
	templateUrl: './admin-screening-detailed-view.component.html',
	styleUrls: ['./admin-screening-detailed-view.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminScreeningDetailedViewComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	screening: Screening | null = null;
	loading = false;
	bookingsLoading = false;

	// Tab management
	activeTabIndex = 0;

	screeningSeatPrices: ScreeningSeatPrice[] = [];

	// Bookings data
	bookings: Booking[] = [];
	bookingSummary = {
		totalBookings: 0,
		totalSeatsBooked: 0,
		totalRevenue: 0,
		occupancyPercentage: 0,
	};

	constructor(
		private screeningService: ScreeningDataService,
		private messageService: MessageService,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig,
		private bookingService: BookingDataService
	) {}

	ngOnInit(): void {
		this.screening = this.config.data.screening;
		console.log('Screening data:', this.screening);
		this.screeningSeatPrices = this.screening?.screeningSeatPrices || [];
		this.loadAllBookings();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadAllBookings() {
		if (!this.screening?.id) return;

		this.bookingsLoading = true;
		this.bookingService
			.findAllConfirmedBookingsByScreeningId(this.screening.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (res) => {
					this.bookings = res || [];
					this.calculateBookingSummary();
					this.bookingsLoading = false;
				},
				error: (error) => {
					console.error('Error loading bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load booking data',
					});
					this.bookingsLoading = false;
				},
			});
	}

	calculateBookingSummary() {
		if (!this.bookings.length || !this.screening?.hall?.capacity) {
			this.bookingSummary = {
				totalBookings: 0,
				totalSeatsBooked: 0,
				totalRevenue: 0,
				occupancyPercentage: 0,
			};
			return;
		}

		const totalBookings = this.bookings.length;
		const totalSeatsBooked = this.bookings.reduce((sum, booking) => {
			return sum + (booking.bookingSeats?.length || 0);
		}, 0);
		const totalRevenue = this.bookings.reduce((sum, booking) => {
			return sum + (Number(booking.amount) || 0);
		}, 0);
		const occupancyPercentage =
			(totalSeatsBooked / this.screening.hall.capacity) * 100;

		this.bookingSummary = {
			totalBookings,
			totalSeatsBooked,
			totalRevenue,
			occupancyPercentage: Math.round(occupancyPercentage * 100) / 100,
		};
	}

	/**
	 * Get the first portrait image from the movie's media
	 */
	getFirstPortraitImage(movie: Movie): any {
		if (!movie?.media || !Array.isArray(movie.media)) {
			return null;
		}

		return movie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	/**
	 * Get the first landscape image from the movie's media
	 */
	getFirstLandscapeImage(movie: Movie): any {
		if (!movie?.media || !Array.isArray(movie.media)) {
			return null;
		}

		return movie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'LANDSCAPE'
		);
	}

	/**
	 * Get media URL
	 */
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Handle image load error
	 */
	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	/**
	 * Format time from HH:MM:SS or HHMM to 12-hour format
	 */
	formatTime(time: string): string {
		if (!time) return '';

		// Handle HH:MM:SS format (preferred format)
		if (time.includes(':')) {
			const timeParts = time.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = timeParts[1];

				// Convert to 12-hour format for display
				const period = hours >= 12 ? 'PM' : 'AM';
				const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
				return `${displayHours}:${minutes} ${period}`;
			}
		}

		// Handle legacy 4-digit format (HHMM)
		if (time.length === 4 && /^\d{4}$/.test(time)) {
			const hours = parseInt(time.substring(0, 2), 10);
			const minutes = time.substring(2, 4);
			const period = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
			return `${displayHours}:${minutes} ${period}`;
		}

		// Fallback: return as-is
		return time;
	}

	/**
	 * Format date
	 */
	formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	/**
	 * Get screening status
	 */
	getScreeningStatus(): { label: string; severity: string; icon: string } {
		if (!this.screening)
			return { label: 'Unknown', severity: 'secondary', icon: 'pi-question' };

		const now = new Date();
		const screeningDate = new Date(this.screening.date);

		// Parse start time
		const startTimeString =
			typeof this.screening.startTime === 'string'
				? this.screening.startTime
				: String(this.screening.startTime || '');

		if (startTimeString && startTimeString.includes(':')) {
			const timeParts = startTimeString.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = parseInt(timeParts[1], 10);
				const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
				screeningDate.setHours(hours, minutes, seconds, 0);
			}
		}

		if (screeningDate < now) {
			return {
				label: 'Screening: Completed',
				severity: 'success',
				icon: 'pi-check-circle',
			};
		} else if (screeningDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
			return {
				label: 'Screening: Today',
				severity: 'warning',
				icon: 'pi-clock',
			};
		} else {
			return {
				label: 'Screening: Upcoming',
				severity: 'info',
				icon: 'pi-calendar-plus',
			};
		}
	}

	/**
	 * Close the dialog
	 */
	close(): void {
		this.ref.close();
	}

	/**
	 * Close with edit action
	 */
	editScreening(): void {
		this.ref.close({ action: 'edit', screening: this.screening });
	}
}
