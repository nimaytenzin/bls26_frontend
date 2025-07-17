import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { MovieApiDataService } from '../../../../../core/dataservice/movie/movie-api.dataservice';
import { BASEAPI_URL } from '../../../../../core/constants/constants';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { CommonModule } from '@angular/common';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { Screening } from '../../../../../core/dataservice/screening/screening.interface';
import { BookingStatusEnum } from '../../../../../core/dataservice/booking/booking.interface';

@Component({
	selector: 'app-admin-screenings-by-movie',
	templateUrl: './admin-screenings-by-movie.component.html',
	styleUrls: ['./admin-screenings-by-movie.component.css'],
	imports: [PrimeNgModules, CommonModule],
})
export class AdminScreeningsByMovieComponent implements OnInit {
	movieId!: number;
	movie!: Movie;
	screenings: Screening[] = [];
	loading = false;

	// View management
	activeTabIndex = 0;

	// Calendar events for screenings
	calendarEvents: any[] = [];

	constructor(
		private config: DynamicDialogConfig,
		private movieService: MovieApiDataService,
		private screeningService: ScreeningDataService
	) {
		this.movieId = this.config.data.movieId;
	}

	ngOnInit() {
		console.log('Passed movie', this.movie);
		this.loadMovieDetails();
		this.loadScreenigDetailsByMovie();
	}

	loadMovieDetails() {
		this.movieService.findMovieById(this.movieId).subscribe({
			next: (movie: Movie) => {
				this.movie = movie;
				console.log('Loaded movie details:', this.movie);
			},
			error: (error) => {
				console.error('Error loading movie details:', error);
			},
		});
	}

	loadScreenigDetailsByMovie() {
		this.loading = true;
		this.screeningService
			.findScreeningsByMovieIdDetailed(this.movieId)
			.subscribe({
				next: (screenings) => {
					console.log('Loaded screenings for movie:', screenings);
					this.screenings = screenings;
					this.prepareCalendarEvents();
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading screenings:', error);
					this.loading = false;
				},
			});
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
	 * Prepare calendar events from screenings
	 */
	prepareCalendarEvents(): void {
		this.calendarEvents = this.screenings.map((screening) => ({
			title: `${this.formatTime(screening.startTime)} - ${
				screening.hall.theatre.name
			}`,
			start: new Date(`${screening.date}T${screening.startTime}`),
			end: new Date(`${screening.date}T${screening.endTime}`),
			backgroundColor: this.getScreeningColorByStatus(screening),
			borderColor: this.getScreeningColorByStatus(screening),
			textColor: '#ffffff',
			screening: screening,
		}));
	}

	/**
	 * Get screening color based on status
	 */
	getScreeningColorByStatus(screening: Screening): string {
		const now = new Date();
		const screeningDateTime = new Date(
			`${screening.date}T${screening.startTime}`
		);

		if (screeningDateTime < now) {
			return '#6b7280'; // Past screening - gray
		} else if (
			screeningDateTime.getTime() - now.getTime() <
			24 * 60 * 60 * 1000
		) {
			return '#f59e0b'; // Today - amber
		} else {
			return '#3b82f6'; // Future - blue
		}
	}

	/**
	 * Get screening status
	 */
	getScreeningStatus(screening: Screening): {
		label: string;
		severity: string;
		icon: string;
	} {
		const now = new Date();
		const screeningDateTime = new Date(
			`${screening.date}T${screening.startTime}`
		);

		if (screeningDateTime < now) {
			return {
				label: 'Completed',
				severity: 'success',
				icon: 'pi-check-circle',
			};
		} else if (
			screeningDateTime.getTime() - now.getTime() <
			24 * 60 * 60 * 1000
		) {
			return { label: 'Today', severity: 'warning', icon: 'pi-clock' };
		} else {
			return { label: 'Upcoming', severity: 'info', icon: 'pi-calendar-plus' };
		}
	}

	/**
	 * Format time from HH:MM:SS to 12-hour format
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

		// Handle legacy 4-digit format (HHMM)
		if (time.length === 4 && /^\d{4}$/.test(time)) {
			const hours = parseInt(time.substring(0, 2), 10);
			const minutes = time.substring(2, 4);
			const period = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
			return `${displayHours}:${minutes} ${period}`;
		}

		return time;
	}

	/**
	 * Format date
	 */
	formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get tickets sold for a screening
	 */
	getTicketsSold(screening: Screening): number {
		if (!screening.bookings || screening.bookings.length === 0) {
			return 0;
		}

		return screening.bookings.reduce((total, booking) => {
			return total + (booking.bookingSeats?.length || 0);
		}, 0);
	}

	/**
	 * Get total revenue for a screening
	 */
	getScreeningRevenue(screening: Screening): number {
		if (!screening.bookings || screening.bookings.length === 0) {
			return 0;
		}
		return screening.bookings.reduce((total, booking) => {
			return total + (Number(booking.amount) || 0);
		}, 0);
	}

	/**
	 * Get total confirmed bookings for a screening
	 */
	getConfirmedBookings(screening: Screening): number {
		return screening.bookings?.length || 0;
	}

	/**
	 * Get occupancy percentage for a screening
	 */
	getOccupancyPercentage(screening: Screening): number {
		const ticketsSold = this.getTicketsSold(screening);
		const totalCapacity = screening.hall?.capacity || 0;

		if (totalCapacity === 0) {
			return 0;
		}

		return Math.round((ticketsSold / totalCapacity) * 100);
	}

	/**
	 * Get overall movie statistics
	 */
	getMovieStatistics() {
		if (!this.screenings || this.screenings.length === 0) {
			return {
				totalScreenings: 0,
				totalTicketsSold: 0,
				totalRevenue: 0,
				averageOccupancy: 0,
				totalCapacity: 0,
			};
		}

		const totalScreenings = this.screenings.length;
		const totalTicketsSold = this.screenings.reduce(
			(sum, screening) => sum + this.getTicketsSold(screening),
			0
		);
		const totalRevenue = this.screenings.reduce(
			(sum, screening) => sum + this.getScreeningRevenue(screening),
			0
		);
		const totalCapacity = this.screenings.reduce(
			(sum, screening) => sum + (screening.hall?.capacity || 0),
			0
		);
		const averageOccupancy =
			totalCapacity > 0
				? Math.round((totalTicketsSold / totalCapacity) * 100)
				: 0;

		return {
			totalScreenings,
			totalTicketsSold,
			totalRevenue,
			averageOccupancy,
			totalCapacity,
		};
	}

	/**
	 * Get unique screening locations (dzongkhags) from all screenings
	 */
	getScreeningLocations(): string[] {
		if (!this.screenings || this.screenings.length === 0) {
			return [];
		}

		const uniqueDzongkhags = new Set<string>();

		this.screenings.forEach((screening) => {
			if (screening.hall?.theatre?.dzongkhag?.name) {
				uniqueDzongkhags.add(screening.hall.theatre.dzongkhag.name);
			}
		});

		return Array.from(uniqueDzongkhags).sort();
	}

	/**
	 * Get formatted screening locations string
	 */
	getFormattedScreeningLocations(): string {
		const locations = this.getScreeningLocations();
		if (locations.length === 0) {
			return 'No locations available';
		}
		return locations.join(', ');
	}
}
