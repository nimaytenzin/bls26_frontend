import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { PrimeNgModules } from '../../../primeng.modules';
import { ScreeningDataService } from '../../../core/dataservice/screening/screening.dataservice';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';
import { TheatreDataService } from '../../../core/dataservice/theatre/theatre.dataservice';

import { Screening } from '../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import { Theatre } from '../../../core/dataservice/theatre/theatre.interface';
import { BASEAPI_URL } from '../../../core/constants/constants';
import { PaginatedData } from '../../../core/utility/pagination.interface';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

@Component({
	selector: 'app-executive-producer-screenings',
	templateUrl: './executive-producer-screenings.component.html',
	styleUrls: ['./executive-producer-screenings.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [DialogService, MessageService],
})
export class ExecutiveProducerScreeningsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	screenings: Screening[] = [];
	movies: Movie[] = [];
	theatres: Theatre[] = [];
	selectedMovie: Movie | null = null;
	selectedMovieId: number | null = null;

	// UI State
	loading = false;
	error: string | null = null;

	// Pagination
	currentPage = 1;
	pageSize = 10;
	totalRecords = 0;

	// Filters
	selectedTheatreId: number | null = null;
	selectedDateRange: Date[] = [];
	viewMode: 'list' | 'calendar' = 'list';

	// Tab management
	activeTabIndex = 0; // 0 = Current & Upcoming, 1 = Past
	currentScreeningsPagination: PaginatedData<Screening> | null = null;
	pastScreeningsPagination: PaginatedData<Screening> | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private screeningService: ScreeningDataService,
		private movieService: MovieApiDataService,
		private theatreService: TheatreDataService
	) {}

	ngOnInit(): void {
		// Check if movieId is provided in route
		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			if (params['movieId']) {
				this.selectedMovieId = +params['movieId'];
			}
			this.loadInitialData();
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadInitialData(): void {
		this.loading = true;

		forkJoin({
			movies: this.movieService.findAllMoviesScreeningNow(),
			theatres: this.theatreService.findAllTheatres(),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					this.movies = data.movies;
					this.theatres = data.theatres;

					// Set selected movie if movieId is provided
					if (this.selectedMovieId) {
						this.selectedMovie =
							this.movies.find((m) => m.id === this.selectedMovieId) || null;
					}

					this.loadScreenings();
				},
				error: (error) => {
					console.error('Error loading initial data:', error);
					this.loading = false;
					this.error = 'Failed to load data. Please refresh the page.';
				},
			});
	}

	loadScreenings(): void {
		if (this.activeTabIndex === 0) {
			this.loadCurrentScreenings();
		} else {
			this.loadPastScreenings();
		}
	}

	loadCurrentScreenings(): void {
		this.loading = true;
		this.error = null;

		if (this.selectedMovieId) {
			// Load screenings for specific movie (returns Screening[])
			this.screeningService
				.findScreeningsByMovieId(this.selectedMovieId)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (screenings: Screening[]) => {
						// Filter for current screenings only
						const now = new Date();
						const currentScreenings = screenings.filter((screening) => {
							const screeningDateTime = new Date(
								`${screening.date} ${screening.startTime}`
							);
							return screeningDateTime >= now;
						});
						this.screenings = currentScreenings;
						this.totalRecords = currentScreenings.length;
						this.loading = false;
					},
					error: (error: any) => {
						console.error('Error loading current screenings:', error);
						this.error = 'Failed to load screenings.';
						this.loading = false;
					},
				});
		} else {
			// Load all current screenings with pagination
			this.screeningService
				.getCurrentScreeningsPaginated(this.currentPage, this.pageSize)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response: PaginatedData<Screening>) => {
						this.currentScreeningsPagination = response;
						this.screenings = response.data || [];
						this.totalRecords = response.pagination?.totalCount || 0;
						this.loading = false;
					},
					error: (error: any) => {
						console.error('Error loading current screenings:', error);
						this.error = 'Failed to load screenings.';
						this.loading = false;
					},
				});
		}
	}

	loadPastScreenings(): void {
		this.loading = true;
		this.error = null;

		if (this.selectedMovieId) {
			// Load screenings for specific movie and filter for past ones
			this.screeningService
				.findScreeningsByMovieId(this.selectedMovieId)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (screenings: Screening[]) => {
						// Filter for past screenings only
						const now = new Date();
						const pastScreenings = screenings.filter((screening) => {
							const screeningDateTime = new Date(
								`${screening.date} ${screening.startTime}`
							);
							return screeningDateTime < now;
						});
						this.screenings = pastScreenings;
						this.totalRecords = pastScreenings.length;
						this.loading = false;
					},
					error: (error: any) => {
						console.error('Error loading past screenings:', error);
						this.error = 'Failed to load screenings.';
						this.loading = false;
					},
				});
		} else {
			// Load all past screenings with pagination
			this.screeningService
				.getPastScreeningsPaginated(this.currentPage, this.pageSize)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response: PaginatedData<Screening>) => {
						this.pastScreeningsPagination = response;
						this.screenings = response.data || [];
						this.totalRecords = response.pagination?.totalCount || 0;
						this.loading = false;
					},
					error: (error: any) => {
						console.error('Error loading past screenings:', error);
						this.error = 'Failed to load screenings.';
						this.loading = false;
					},
				});
		}
	}

	onTabChange(event: any): void {
		this.activeTabIndex = event.index;
		this.currentPage = 1;
		this.loadScreenings();
	}

	onPageChange(event: any): void {
		this.currentPage = event.page + 1;
		this.pageSize = event.rows;
		this.loadScreenings();
	}

	onMovieChange(movieId: number | null): void {
		this.selectedMovieId = movieId;
		this.selectedMovie = this.movies.find((m) => m.id === movieId) || null;
		this.currentPage = 1;
		this.loadScreenings();
	}

	onTheatreChange(theatreId: number | null): void {
		this.selectedTheatreId = theatreId;
		this.currentPage = 1;
		this.loadScreenings();
	}

	clearFilters(): void {
		this.selectedMovieId = null;
		this.selectedMovie = null;
		this.selectedTheatreId = null;
		this.selectedDateRange = [];
		this.currentPage = 1;
		this.loadScreenings();
	}

	refreshScreenings(): void {
		this.currentPage = 1;
		this.loadScreenings();
	}

	viewScreeningDetails(screening: Screening): void {
		// Navigate to screening detail or open dialog
		console.log('View screening details:', screening);
	}

	viewScreeningBookings(screening: Screening): void {
		this.router.navigate(['/executive-producer/bookings'], {
			queryParams: { screeningId: screening.id },
		});
	}

	// Template helper methods
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	getMoviePosterUrl(movie: Movie): string | null {
		if (movie?.media && movie.media.length > 0) {
			const imageMedia = movie.media.find(
				(m: { type: string; orientation?: string }) =>
					m.type === 'IMAGE' && m.orientation === 'PORTRAIT'
			);
			return imageMedia ? this.getMediaUrl(imageMedia.uri) : null;
		}
		return null;
	}

	formatTime(time: string): string {
		if (!time) return '';

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

	formatDate(date: string | Date): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	getScreeningSeverity(screening: Screening): string {
		const now = new Date();
		const screeningDate = new Date(screening.date);

		// Parse start time and set it to screening date
		if (screening.startTime && screening.startTime.includes(':')) {
			const timeParts = screening.startTime.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = parseInt(timeParts[1], 10);
				screeningDate.setHours(hours, minutes, 0, 0);
			}
		}

		if (screeningDate < now) return 'secondary';
		if (screeningDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
			return 'warning';
		return 'success';
	}

	getSeatCategoryPrices(screening: Screening): string {
		if (
			!screening.screeningSeatPrices ||
			screening.screeningSeatPrices.length === 0
		) {
			return 'No pricing set';
		}

		return screening.screeningSeatPrices
			.map((sp) => `${sp.seatCategory?.name}: BTN ${sp.price}`)
			.join(', ');
	}

	getTheatreInfo(screening: Screening): string {
		const theatre = screening.hall?.theatre?.name;
		const hall = screening.hall?.name;
		if (theatre && hall) {
			return `${theatre} - ${hall}`;
		}
		return theatre || hall || 'Unknown Theatre';
	}

	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	trackByScreeningId = (index: number, screening: Screening) => screening.id;
}
