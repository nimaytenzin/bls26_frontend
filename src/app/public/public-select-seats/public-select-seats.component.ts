import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { MovieService } from '../../core/services/movie.service';
import {
	Movie,
	Screening,
	Seat,
	BookingDetails,
} from '../../core/models/movie.interface';

@Component({
	selector: 'app-public-select-seats',
	templateUrl: './public-select-seats.component.html',
	styleUrls: ['./public-select-seats.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		CardModule,
		ChipModule,
		ToastModule,
		DialogModule,
	],
	providers: [MessageService],
})
export class PublicSelectSeatsComponent implements OnInit {
	movie: Movie | null = null;
	screening: Screening | null = null;
	seats: Seat[] = [];
	selectedSeats: Seat[] = [];
	loading = true;
	error: string | null = null;

	// Trailer properties
	showTrailerDialog = false;
	safeTrailerUrl: SafeResourceUrl | null = null;

	readonly MAX_SEATS = 10;
	readonly SEAT_PRICING = {
		basic: 399,
		premium: 499,
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private movieService: MovieService,
		private messageService: MessageService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			const screeningId = +params['id'];
			if (screeningId) {
				this.loadScreeningData(screeningId);
			} else {
				this.error = 'Invalid screening selected';
				this.loading = false;
			}
		});
	}

	private loadScreeningData(screeningId: number) {
		this.loading = true;
		this.error = null;

		// Load screening details
		this.movieService.getScreeningById(screeningId).subscribe({
			next: (screening) => {
				if (screening) {
					this.screening = screening;
					this.loadMovieDetails(screening.movieId);
					this.loadSeats(screeningId);
				} else {
					this.error = 'Screening not found';
					this.loading = false;
				}
			},
			error: (err) => {
				console.error('Error loading screening:', err);
				this.error = 'Failed to load screening details';
				this.loading = false;
			},
		});
	}

	private loadMovieDetails(movieId: number) {
		this.movieService.getMovieById(movieId).subscribe({
			next: (movie) => {
				this.movie = movie || null;
			},
			error: (err) => {
				console.error('Error loading movie:', err);
			},
		});
	}

	private loadSeats(screeningId: number) {
		this.movieService.getSeatsForScreening(screeningId).subscribe({
			next: (seats) => {
				this.seats = seats;
				this.loading = false;
			},
			error: (err) => {
				console.error('Error loading seats:', err);
				this.error = 'Failed to load seats';
				this.loading = false;
			},
		});
	}

	onSeatClick(seat: Seat) {
		if (!seat.isAvailable) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Seat Unavailable',
				detail: 'This seat is already booked',
			});
			return;
		}

		const seatIndex = this.selectedSeats.findIndex((s) => s.id === seat.id);

		if (seatIndex > -1) {
			// Deselect seat
			this.selectedSeats.splice(seatIndex, 1);
			seat.isSelected = false;
		} else {
			// Select seat
			if (this.selectedSeats.length >= this.MAX_SEATS) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Maximum Seats Reached',
					detail: `You can select maximum ${this.MAX_SEATS} seats`,
				});
				return;
			}

			this.selectedSeats.push({ ...seat });
			seat.isSelected = true;
		}
	}

	getSeatClass(seat: Seat): string {
		let baseClass = 'seat ';

		if (!seat.isAvailable) {
			baseClass += 'seat-unavailable';
		} else if (seat.isSelected) {
			baseClass += 'seat-selected';
		} else {
			baseClass += `seat-${seat.type}`;
		}

		return baseClass;
	}

	getRows(): string[] {
		if (!this.seats.length) return [];

		const rows = [...new Set(this.seats.map((seat) => seat.row))];
		return rows.sort();
	}

	getSeatsByRow(): { [key: string]: Seat[] } {
		const seatsByRow: { [key: string]: Seat[] } = {};

		this.seats.forEach((seat) => {
			if (!seatsByRow[seat.row]) {
				seatsByRow[seat.row] = [];
			}
			seatsByRow[seat.row].push(seat);
		});

		// Sort seats by number within each row
		Object.keys(seatsByRow).forEach((row) => {
			seatsByRow[row].sort((a, b) => a.number - b.number);
		});

		return seatsByRow;
	}

	getTotalAmount(): number {
		return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
	}

	formatCurrency(amount: number): string {
		return `Nu.${amount}`;
	}

	proceedToPayment() {
		if (this.selectedSeats.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Seats Selected',
				detail: 'Please select at least one seat',
			});
			return;
		}

		if (!this.screening) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Screening information not available',
			});
			return;
		}

		// Create booking details
		const bookingDetails: BookingDetails = {
			movieId: this.screening.movieId,
			screeningId: this.screening.id,
			selectedSeats: this.selectedSeats,
			totalAmount: this.getTotalAmount(),
			customerInfo: {
				name: '',
				email: '',
				phone: '',
			},
		};

		// Store booking details in service
		this.movieService.setCurrentBooking(bookingDetails);

		// Navigate to payment
		this.router.navigate(['/payment']);
	}

	goBack() {
		if (this.movie) {
			this.router.navigate(['/select-schedule', this.movie.id]);
		} else {
			this.router.navigate(['/']);
		}
	}

	// Trailer methods
	openTrailer() {
		if (this.movie?.trailerUrl) {
			const embedUrl = this.convertToEmbedUrl(this.movie.trailerUrl);
			this.safeTrailerUrl =
				this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
			this.showTrailerDialog = true;
		}
	}

	closeTrailer() {
		this.showTrailerDialog = false;
		this.safeTrailerUrl = null;
	}

	private convertToEmbedUrl(youtubeUrl: string): string {
		const regExp =
			/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
		const match = youtubeUrl.match(regExp);
		const videoId = match && match[7].length === 11 ? match[7] : null;

		if (videoId) {
			return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
		}
		return youtubeUrl;
	}
}
