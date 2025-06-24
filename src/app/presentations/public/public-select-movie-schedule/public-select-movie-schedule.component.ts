import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChipModule } from 'primeng/chip';
import { ImageModule } from 'primeng/image';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Interfaces
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import {
	Screening,
	ScreeningSeatPrice,
} from '../../../core/dataservice/screening/screening.interface';
import { Theatre } from '../../../core/dataservice/theatre/theatre.interface';
import { Hall } from '../../../core/dataservice/hall/hall.interface';
import { PublicDataService } from '../../../core/dataservice/public/public.dataservice';
import { BASEAPI_URL } from '../../../core/constants/constants';

interface GroupedScreening {
	theatre: Theatre;
	hall: Hall;
	screenings: ScreeningDisplay[];
}

interface ScreeningDisplay {
	id: number;
	startTime: string;
	endTime: string;
	date: string;
	seatPrices: ScreeningSeatPrice[];
	availableSeats: number;
	totalSeats: number;
}

@Component({
	selector: 'app-public-select-movie-schedule',
	templateUrl: './public-select-movie-schedule.component.html',
	styleUrls: ['./public-select-movie-schedule.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ButtonModule,
		CalendarModule,
		ChipModule,
		ImageModule,
		DialogModule,
		TagModule,
	],
})
export class PublicSelectMovieScheduleComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Loading and error states
	loading = true;
	error: string | null = null;

	// Movie data
	movie: Movie | null = null;
	movieId: number = 0;

	// Screening data
	allScreenings: Screening[] = [];
	groupedScreenings: GroupedScreening[] = [];
	availableDates: Date[] = [];
	selectedDate: Date = new Date();

	// Date range for screening availability (next 7 days)
	private readonly DAYS_AHEAD = 7;

	// Selected items
	selectedScreening: ScreeningDisplay | null = null;

	// Trailer properties
	showTrailerDialog = false;
	safeTrailerUrl: SafeResourceUrl | null = null;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private sanitizer: DomSanitizer,
		private publicDataService: PublicDataService
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			const movieId = +params['id'];
			if (movieId) {
				this.movieId = movieId;
				this.initializeAvailableDates();
				this.loadMovieAndScreenings(movieId);
			} else {
				this.error = 'Movie not found';
				this.loading = false;
			}
		});
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private loadMovieAndScreenings(movieId: number) {
		this.loading = true;
		this.error = null;

		// Load movie details first
		this.publicDataService
			.findMovieById(movieId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (movie) => {
					this.movie = movie;
					this.loadScreeningsForDate(movieId, this.selectedDate);
				},
				error: (err) => {
					console.error('Error loading movie:', err);
					this.error = 'Failed to load movie details';
					this.loading = false;
				},
			});
	}

	private initializeAvailableDates() {
		const today = new Date();
		this.availableDates = [];

		// Generate next 7 days starting from today
		for (let i = 0; i < this.DAYS_AHEAD; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			this.availableDates.push(date);
		}

		// Set selected date to today
		this.selectedDate = new Date(today); // Create new instance to avoid reference issues
	}
	private loadScreeningsForDate(movieId: number, date: Date) {
		if (!this.movie) {
			this.loading = true;
		}
		this.error = null;

		const dateStr = this.formatDateForAPI(date);
		console.log('Loading screenings for movie:', movieId, 'date:', dateStr);

		this.publicDataService
			.findScrenningsByMovieAndDate(movieId, dateStr)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (screenings) => {
					console.log('Loaded screenings for date:', dateStr, screenings);
					// Ensure screenings is always an array
					this.allScreenings = Array.isArray(screenings) ? screenings : [];
					this.processScreeningsForSelectedDate();
					this.loading = false;
				},
				error: (err) => {
					console.error('Error loading screenings for date:', dateStr, err);
					// Clear previous screenings on error
					this.allScreenings = [];
					this.groupedScreenings = [];
					this.loading = false;

					// Don't show error for "no screenings found" cases
					if (err.status === 404) {
						console.log('No screenings found for this date');
					} else {
						this.error = 'Failed to load movie screenings';
					}
				},
			});
	}

	formatDateForAPI(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	isDateSelected(date: Date): boolean {
		return (
			this.formatDateForAPI(date) === this.formatDateForAPI(this.selectedDate)
		);
	}

	isToday(date: Date): boolean {
		const today = new Date();
		return this.formatDateForAPI(date) === this.formatDateForAPI(today);
	}

	private processScreeningsForSelectedDate() {
		// Since we're already loading screenings for a specific date,
		// we just need to group them by theatre and hall
		this.groupScreeningsByLocation();
	}

	private processScreenings() {
		// Extract unique dates
		this.extractAvailableDates();

		// Group screenings by theatre and hall
		this.groupScreeningsByLocation();

		// Filter for selected date
		this.filterScreeningsByDate();
	}

	private extractAvailableDates() {
		if (!this.allScreenings || !Array.isArray(this.allScreenings)) {
			this.availableDates = [];
			return;
		}

		const uniqueDates = new Set<string>();

		this.allScreenings.forEach((screening) => {
			const dateStr = screening.date;
			uniqueDates.add(dateStr);
		});

		this.availableDates = Array.from(uniqueDates)
			.map((dateStr) => new Date(dateStr))
			.sort((a, b) => a.getTime() - b.getTime());

		// Set selected date to first available date or today
		if (this.availableDates.length > 0) {
			this.selectedDate = this.availableDates[0];
		}
	}

	private groupScreeningsByLocation() {
		if (!this.allScreenings || !Array.isArray(this.allScreenings)) {
			this.groupedScreenings = [];
			return;
		}

		const grouped = new Map<string, GroupedScreening>();

		this.allScreenings.forEach((screening) => {
			if (!screening.hall?.theatre) return;

			const key = `${screening.hall.theatre.id}-${screening.hall.id}`;

			if (!grouped.has(key)) {
				grouped.set(key, {
					theatre: screening.hall.theatre,
					hall: screening.hall,
					screenings: [],
				});
			}

			const group = grouped.get(key)!;
			group.screenings.push({
				id: screening.id,
				startTime: screening.startTime,
				endTime: screening.endTime,
				date: screening.date,
				seatPrices: screening.screeningSeatPrices || [],
				availableSeats: this.calculateAvailableSeats(screening),
				totalSeats: screening.hall?.capacity || 0,
			});
		});

		this.groupedScreenings = Array.from(grouped.values());

		// Sort screenings by start time within each group
		this.groupedScreenings.forEach((group) => {
			group.screenings.sort((a, b) => a.startTime.localeCompare(b.startTime));
		});
	}

	private calculateAvailableSeats(screening: Screening): number {
		// For now, return hall capacity as we don't have booking data
		// In a real implementation, this would be calculated from bookings
		return screening.hall?.capacity || 0;
	}

	private filterScreeningsByDate() {
		if (!this.selectedDate || !this.groupedScreenings) return;

		const selectedDateStr = this.formatDateForComparison(this.selectedDate);

		this.groupedScreenings.forEach((group) => {
			if (group.screenings) {
				group.screenings = group.screenings.filter(
					(screening) => screening.date === selectedDateStr
				);
			}
		});

		// Remove groups with no screenings for selected date
		this.groupedScreenings = this.groupedScreenings.filter(
			(group) => group.screenings && group.screenings.length > 0
		);
	}

	private formatDateForComparison(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	// Event handlers
	onDateChange() {
		this.selectedScreening = null;
		this.loadScreeningsForDate(this.movieId, this.selectedDate);
	}

	selectScreening(screening: ScreeningDisplay) {
		this.selectedScreening = screening;
	}

	proceedToBooking() {
		if (this.selectedScreening && this.movie) {
			this.router.navigate(['/select-seats', this.selectedScreening.id]);
		}
	}

	// Movie image helpers
	getMovieImage(): string {
		if (!this.movie?.media?.length) {
			return 'assets/images/default-movie-poster.jpg';
		}

		// Get the first landscape image
		const landscapeImage = this.movie.media.find(
			(m) => m.type === 'IMAGE' && m.orientation === 'LANDSCAPE'
		);

		if (landscapeImage) {
			return `${BASEAPI_URL}${landscapeImage.uri}`;
		}

		// Fallback to first image
		const firstImage = this.movie.media.find((m) => m.type === 'IMAGE');
		if (firstImage) {
			return `${BASEAPI_URL}${firstImage.uri}`;
		}

		return 'assets/images/default-movie-poster.jpg';
	}

	formatDuration(durationMin?: number): string {
		if (!durationMin) return 'N/A';

		const hours = Math.floor(durationMin / 60);
		const minutes = durationMin % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}min`;
		}
		return `${minutes}min`;
	}

	formatPrice(amount: number): string {
		return `Nu. ${amount}`;
	}

	formatTime(timeInput: string | number): string {
		if (!timeInput && timeInput !== 0) return '';

		// Convert to string if it's a number
		const timeString = timeInput.toString();
		console.log('timeString:', timeString, 'type:', typeof timeInput);

		// Handle 4-digit time format (e.g., "0730" or 730 -> "7:30 AM")
		if (/^\d{4}$/.test(timeString)) {
			const hours = parseInt(timeString.substring(0, 2), 10);
			const minutes = parseInt(timeString.substring(2, 4), 10);
			const date = new Date();
			date.setHours(hours, minutes, 0, 0);
			return date
				.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				})
				.replace(' ', '');
		}

		// Handle 3-digit time format (e.g., "730" or 730 -> "7:30 AM")
		if (/^\d{3}$/.test(timeString)) {
			const hours = parseInt(timeString.substring(0, 1), 10);
			const minutes = parseInt(timeString.substring(1, 3), 10);
			const date = new Date();
			date.setHours(hours, minutes, 0, 0);
			return date
				.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				})
				.replace(' ', '');
		}

		// Try to parse as "HH:mm" or "HH:mm:ss"
		const date = new Date(`1970-01-01T${timeString}`);
		if (!isNaN(date.getTime())) {
			return date
				.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				})
				.replace(' ', '');
		}

		return timeString;
	}

	formatDate(date: Date): string {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		} else if (date.toDateString() === tomorrow.toDateString()) {
			return 'Tomorrow';
		} else {
			return date.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
			});
		}
	}

	// Trailer functionality
	openTrailer() {
		if (this.movie?.trailerURL) {
			const embedUrl = this.convertToEmbedUrl(this.movie.trailerURL);
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
