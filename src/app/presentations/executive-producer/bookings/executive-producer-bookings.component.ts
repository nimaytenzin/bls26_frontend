import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../primeng.modules';
import { BookingDataService } from '../../../core/dataservice/booking/booking.dataservice';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';
import {
	Booking,
	BookingStatusEnum,
	EntryStatusEnum,
} from '../../../core/dataservice/booking/booking.interface';
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import { MessageService } from 'primeng/api';
import { PaginatedData } from '../../../core/utility/pagination.interface';
import { BASEAPI_URL } from '../../../core/constants/constants';

@Component({
	selector: 'app-executive-producer-bookings',
	templateUrl: './executive-producer-bookings.component.html',
	styleUrls: ['./executive-producer-bookings.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [MessageService],
})
export class ExecutiveProducerBookingsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	bookings: Booking[] = [];
	movies: Movie[] = [];
	selectedMovie: Movie | null = null;
	selectedMovieId: number | null = null;
	selectedScreeningId: number | null = null;

	// Tab management
	activeTabIndex = 0; // 0 = Confirmed, 1 = Processing, 2 = Failed

	// Loading states
	loading = false;
	confirmedLoading = false;
	processingLoading = false;
	failedLoading = false;

	// Pagination
	currentPage = 1;
	pageSize = 10;
	totalRecords = 0;

	// Separate pagination for each tab
	confirmedPagination: PaginatedData<Booking> | null = null;
	processingPagination: PaginatedData<Booking> | null = null;
	failedPagination: PaginatedData<Booking> | null = null;

	// Filter options
	selectedTheatreId: number | null = null;
	selectedDateRange: Date[] = [];
	searchCustomer = '';

	constructor(
		private route: ActivatedRoute,
		private bookingDataService: BookingDataService,
		private movieService: MovieApiDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		// Check for query parameters
		this.route.queryParams
			.pipe(takeUntil(this.destroy$))
			.subscribe((params) => {
				if (params['movieId']) {
					this.selectedMovieId = +params['movieId'];
				}
				if (params['screeningId']) {
					this.selectedScreeningId = +params['screeningId'];
				}
			});

		this.loadInitialData();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadInitialData() {
		this.loading = true;

		// Load movies first
		this.movieService
			.findAllMoviesScreeningNow()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (movies) => {
					this.movies = movies;

					// Set selected movie if movieId is provided
					if (this.selectedMovieId) {
						this.selectedMovie =
							this.movies.find((m) => m.id === this.selectedMovieId) || null;
					}

					// Load bookings based on default tab
					this.loadBookingsForActiveTab();
				},
				error: (error: any) => {
					console.error('Error loading movies:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load movies',
					});
				},
			});
	}

	loadBookingsForActiveTab() {
		switch (this.activeTabIndex) {
			case 0:
				this.loadConfirmedBookings();
				break;
			case 1:
				this.loadProcessingBookings();
				break;
			case 2:
				this.loadFailedBookings();
				break;
		}
	}

	onTabChange(event: any) {
		this.activeTabIndex = event.index;
		this.currentPage = 1;
		this.loadBookingsForActiveTab();
	}

	loadConfirmedBookings(page: number = 1) {
		this.confirmedLoading = true;
		this.currentPage = page;

		this.bookingDataService
			.getConfirmedBookingsPaginated(page, this.pageSize)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.confirmedPagination = result;
					this.bookings = this.filterBookingsByMovie(result.data || []);
					this.totalRecords = this.bookings.length;
					this.confirmedLoading = false;
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading confirmed bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load confirmed bookings',
					});
					this.confirmedLoading = false;
					this.loading = false;
				},
			});
	}

	loadProcessingBookings(page: number = 1) {
		this.processingLoading = true;
		this.currentPage = page;

		this.bookingDataService
			.getUnderProcessingBookingsPaginated(page, this.pageSize)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.processingPagination = result;
					this.bookings = this.filterBookingsByMovie(result.data || []);
					this.totalRecords = this.bookings.length;
					this.processingLoading = false;
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading processing bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load processing bookings',
					});
					this.processingLoading = false;
					this.loading = false;
				},
			});
	}

	loadFailedBookings(page: number = 1) {
		this.failedLoading = true;
		this.currentPage = page;

		this.bookingDataService
			.getFailedBookingsPaginated(page, this.pageSize)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.failedPagination = result;
					this.bookings = this.filterBookingsByMovie(result.data || []);
					this.totalRecords = this.bookings.length;
					this.failedLoading = false;
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading failed bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load failed bookings',
					});
					this.failedLoading = false;
					this.loading = false;
				},
			});
	}

	filterBookingsByMovie(bookings: Booking[]): Booking[] {
		if (!this.selectedMovieId) return bookings;

		return bookings.filter(
			(booking) => booking.screening?.movie?.id === this.selectedMovieId
		);
	}

	onPageChange(event: any) {
		const page = event.first ? Math.floor(event.first / event.rows) + 1 : 1;
		this.currentPage = page;
		this.loadBookingsForActiveTab();
	}

	onMovieChange(movieId: number | null) {
		this.selectedMovieId = movieId;
		this.selectedMovie = this.movies.find((m) => m.id === movieId) || null;
		this.currentPage = 1;
		this.loadBookingsForActiveTab();
	}

	clearFilters() {
		this.selectedMovieId = null;
		this.selectedMovie = null;
		this.selectedTheatreId = null;
		this.selectedDateRange = [];
		this.searchCustomer = '';
		this.currentPage = 1;
		this.loadBookingsForActiveTab();
	}

	refreshBookings() {
		this.currentPage = 1;
		this.loadBookingsForActiveTab();
	}

	// Helper methods
	getStatusSeverity(status: BookingStatusEnum): string {
		switch (status) {
			case BookingStatusEnum.CONFIRMED:
				return 'success';
			case BookingStatusEnum.PENDING:
			case BookingStatusEnum.PAYMENT_PENDING:
				return 'warning';
			case BookingStatusEnum.FAILED:
			case BookingStatusEnum.CANCELLED:
				return 'danger';
			case BookingStatusEnum.TIMEOUT:
				return 'info';
			default:
				return 'info';
		}
	}

	getEntryStatusSeverity(status: EntryStatusEnum): string {
		switch (status) {
			case EntryStatusEnum.ENTERED:
				return 'success';
			case EntryStatusEnum.VALID:
				return 'info';
			default:
				return 'info';
		}
	}

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

	formatCurrency(amount: number): string {
		return `BTN ${amount?.toFixed(2) || '0.00'}`;
	}

	getMovieTitle(booking: Booking): string {
		return booking.screening?.movie?.name || 'Unknown Movie';
	}

	getTheatreInfo(booking: Booking): string {
		const theatre = booking.screening?.hall?.theatre?.name;
		const hall = booking.screening?.hall?.name;
		if (theatre && hall) {
			return `${theatre} - ${hall}`;
		}
		return theatre || hall || 'Unknown Theatre';
	}

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

	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	getCurrentTabLoading(): boolean {
		switch (this.activeTabIndex) {
			case 0:
				return this.confirmedLoading;
			case 1:
				return this.processingLoading;
			case 2:
				return this.failedLoading;
			default:
				return false;
		}
	}

	getTotalBookingsCount(): number {
		switch (this.activeTabIndex) {
			case 0:
				return this.confirmedPagination?.pagination?.totalCount || 0;
			case 1:
				return this.processingPagination?.pagination?.totalCount || 0;
			case 2:
				return this.failedPagination?.pagination?.totalCount || 0;
			default:
				return 0;
		}
	}

	getTabLabel(): string {
		switch (this.activeTabIndex) {
			case 0:
				return 'Confirmed Bookings';
			case 1:
				return 'Processing Bookings';
			case 2:
				return 'Failed Bookings';
			default:
				return 'Bookings';
		}
	}

	getCustomerName(booking: Booking): string {
		// Since there's no customer object, we'll need to extract from notes or use phone number
		return booking.phoneNumber || 'N/A';
	}

	getCustomerEmail(booking: Booking): string {
		// Since there's no customer email in the interface, return N/A
		return 'N/A';
	}

	getCustomerPhone(booking: Booking): string {
		return booking.phoneNumber || 'N/A';
	}

	trackByBookingId = (index: number, booking: Booking) => booking.id;
}
