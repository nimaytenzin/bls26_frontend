import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as QRCode from 'qrcode';

// Services and Interfaces
import { BookingDataService } from '../../../core/dataservice/booking/booking.dataservice';
import {
	Booking,
	BookingSeat,
} from '../../../core/dataservice/booking/booking.interface';
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../core/constants/constants';

@Component({
	selector: 'app-public-eticket',
	templateUrl: './public-eticket.component.html',
	styleUrls: ['./public-eticket.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		CardModule,
		DividerModule,
		TagModule,
		ToastModule,
	],
	providers: [MessageService],
})
export class PublicEticketComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Loading and error states
	loading = true;
	error: string | null = null;

	// Static values for demo
	private readonly STATIC_SESSION_ID = 'session_mckd7s91_7lsloarqq_9il3s';
	private readonly STATIC_SCREENING_ID = 11;

	// Booking data
	bookingData: Booking | null = null; // Full booking details

	// QR Code
	qrCodeDataURL: string = '';

	// Date and time formatting
	currentDate = new Date();

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private bookingService: BookingDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.loadBookingData();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load booking data using the static session ID and screening ID
	 */
	private loadBookingData(): void {
		this.loading = true;
		this.error = null;

		this.bookingService
			.getBookingBySession(this.STATIC_SESSION_ID, this.STATIC_SCREENING_ID)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.bookingData = response;
					this.generateQRCode();
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading booking data:', error);
					this.error = 'Failed to load booking details. Please try again.';
					this.loading = false;
					this.showErrorMessage('Failed to load booking details');
				},
			});
	}

	/**
	 * Generate QR code for the e-ticket
	 */
	private generateQRCode(): void {
		if (!this.bookingData) return;

		const qrData = this.bookingData.uuid;

		QRCode.toDataURL(qrData, {
			errorCorrectionLevel: 'H', // High error correction for better reliability
			type: 'image/png',
			margin: 2,
			width: 300, // Larger size for better quality
			color: {
				dark: '#6F1C76', // Custom purple color for QR code
				light: '#FFFFFF00', // Transparent background
			},
		})
			.then((url) => {
				this.qrCodeDataURL = url;
			})
			.catch((err) => {
				console.error('Error generating QR code:', err);
			});
	}

	/**
	 * Download e-ticket as image
	 */
	downloadTicket(): void {
		window.print();
	}

	/**
	 * Share e-ticket
	 */
	shareTicket(): void {
		if (navigator.share && this.bookingData) {
			navigator
				.share({
					title: 'My Movie Ticket',
					text: `${this.bookingData.screening?.movie?.name}`,
					url: window.location.href,
				})
				.catch((err) => console.log('Error sharing:', err));
		} else {
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(window.location.href).then(() => {
				this.showSuccessMessage('Ticket link copied to clipboard!');
			});
		}
	}

	getMovieImage(movie: Movie): string {
		// Get the first landscape image from media array, fallback to any image, or default
		const landscapeImage = this.getFirstLandscapePosterImage(movie);

		if (landscapeImage) {
			return this.getMediaUrl(landscapeImage.uri);
		}

		// Fallback to first image
		const firstImage = movie.media?.find((m) => m.type === 'IMAGE');
		if (firstImage) {
			return this.getMediaUrl(firstImage.uri);
		}

		// Default fallback image
		return 'assets/images/default-movie-poster.jpg';
	}

	getFirstLandscapePosterImage(movie: Movie): any {
		return movie?.media?.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'LANDSCAPE'
		);
	}

	getFirstPortraitImage(movie: Movie): any {
		return movie?.media?.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}
	/**
	 * Go back to previous page
	 */
	goBack(): void {
		this.router.navigate(['/']);
	}

	/**
	 * Format currency
	 */
	formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-BT', {
			style: 'currency',
			currency: 'BTN',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	}

	/**
	 * Format date
	 */
	formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-BT', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	/**
	 * Format time
	 */
	formatTime(time: string): string {
		return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-BT', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});
	}

	/**
	 * Get seat category color
	 */
	getSeatCategoryColor(seat: BookingSeat): string {
		return seat.seat?.category?.baseColorHexCode || '#3B82F6';
	}

	/**
	 * Show success message
	 */
	private showSuccessMessage(message: string): void {
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: message,
			life: 3000,
		});
	}

	/**
	 * Show error message
	 */
	private showErrorMessage(message: string): void {
		this.messageService.add({
			severity: 'error',
			summary: 'Error',
			detail: message,
			life: 5000,
		});
	}
}
