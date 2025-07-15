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
import html2canvas from 'html2canvas';

// Services and Interfaces
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import {
	Booking,
	BookingSeat,
} from '../../../../core/dataservice/booking/booking.interface';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../../core/constants/constants';

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

	// Route parameters
	sessionId: string | null = null;
	bookingId: number | null = null;

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
		// Extract route parameters
		this.sessionId = this.route.snapshot.paramMap.get('sessionId');
		const bookingIdParam = this.route.snapshot.paramMap.get('bookingId');
		this.bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : null;

		// Validate required parameters
		if (!this.sessionId || !this.bookingId) {
			this.error =
				'Invalid booking link. Missing session or booking information.';
			this.loading = false;
			this.showErrorMessage('Invalid booking link');
			return;
		}

		this.loadBookingData();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load booking data using route parameters
	 */
	private loadBookingData(): void {
		this.loading = true;
		this.error = null;

		this.bookingService
			.getBookingBySession(this.sessionId!, this.bookingId!)

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
		if (!this.bookingData) {
			this.showErrorMessage('No booking data available to download');
			return;
		}

		// Get the e-ticket element by ID
		const eTicketElement = document.getElementById(
			'eticket-card'
		) as HTMLElement;

		if (!eTicketElement) {
			this.showErrorMessage('Unable to capture e-ticket for download');
			return;
		}

		// Show loading message
		this.showSuccessMessage('Preparing your e-ticket for download...');

		// Capture the e-ticket as image
		html2canvas(eTicketElement, {
			scale: 2, // Higher quality
			useCORS: true,
			allowTaint: true,
			backgroundColor: '#000000',
			width: eTicketElement.scrollWidth,
			height: eTicketElement.scrollHeight,
			logging: false, // Disable logging for production
		})
			.then((canvas) => {
				// Convert canvas to blob
				canvas.toBlob(
					(blob) => {
						if (blob) {
							// Create download link
							const url = URL.createObjectURL(blob);
							const link = document.createElement('a');
							link.href = url;
							link.download = `movie-ticket-${
								this.bookingData?.uuid || 'eticket'
							}.png`;

							// Trigger download
							document.body.appendChild(link);
							link.click();
							document.body.removeChild(link);

							// Clean up
							URL.revokeObjectURL(url);

							this.showSuccessMessage('E-ticket downloaded successfully!');
						} else {
							this.showErrorMessage('Failed to generate e-ticket image');
						}
					},
					'image/png',
					1.0
				);
			})
			.catch((error) => {
				console.error('Error capturing e-ticket:', error);
				this.showErrorMessage('Failed to capture e-ticket for download');
			});
	}

	/**
	 * Share e-ticket
	 */
	shareTicket(): void {
		if (!this.bookingData) {
			this.showErrorMessage('No booking data available to share');
			return;
		}

		const shareUrl = window.location.href;
		const shareTitle = `My Movie Ticket - ${this.bookingData.screening?.movie?.name}`;
		const shareText = `Check out my movie ticket for "${this.bookingData.screening?.movie?.name}" at ${this.bookingData.screening?.hall?.theatre?.name}`;

		// Try native sharing first (mobile devices)
		if (navigator.share) {
			navigator
				.share({
					title: shareTitle,
					text: shareText,
					url: shareUrl,
				})
				.then(() => {
					this.showSuccessMessage('E-ticket shared successfully!');
				})
				.catch((error) => {
					console.log('Native sharing failed:', error);
					// Fallback to clipboard
					this.copyToClipboard(shareUrl);
				});
		} else {
			// Fallback: copy to clipboard
			this.copyToClipboard(shareUrl);
		}
	}

	/**
	 * Copy link to clipboard
	 */
	private copyToClipboard(text: string): void {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard
				.writeText(text)
				.then(() => {
					this.showSuccessMessage('E-ticket link copied to clipboard!');
				})
				.catch((error) => {
					console.error('Failed to copy to clipboard:', error);
					this.fallbackCopyToClipboard(text);
				});
		} else {
			this.fallbackCopyToClipboard(text);
		}
	}

	/**
	 * Fallback method to copy text to clipboard
	 */
	private fallbackCopyToClipboard(text: string): void {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			document.execCommand('copy');
			this.showSuccessMessage('E-ticket link copied to clipboard!');
		} catch (error) {
			console.error('Fallback copy failed:', error);
			this.showErrorMessage(
				'Unable to copy link. Please copy the URL manually.'
			);
		}

		document.body.removeChild(textArea);
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
