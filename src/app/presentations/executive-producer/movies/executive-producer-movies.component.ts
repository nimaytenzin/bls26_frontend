import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../primeng.modules';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
	Movie,
	ScreeningStatusEnum,
} from '../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../core/constants/constants';
import { PaginatedData } from '../../../core/utility/pagination.interface';
import { MessageService } from 'primeng/api';

@Component({
	selector: 'app-executive-producer-movies',
	templateUrl: './executive-producer-movies.component.html',
	styleUrls: ['./executive-producer-movies.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [DialogService, MessageService],
})
export class ExecutiveProducerMoviesComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	ref: DynamicDialogRef = new DynamicDialogRef();

	// Data properties
	movies: Movie[] = [];
	loading = false;
	error: string | null = null;

	// Pagination properties
	currentPage = 1;
	pageSize = 10;
	totalRecords = 0;
	totalPages = 0;

	// Tab properties
	activeTabIndex = 1; // Default to "Now Showing" (index 1)
	activeStatus: ScreeningStatusEnum = ScreeningStatusEnum.NOW_SHOWING;

	// Tab configuration
	statusTabs = [
		{
			label: 'Upcoming',
			value: ScreeningStatusEnum.UPCOMING,
		},
		{
			label: 'Now Showing',
			value: ScreeningStatusEnum.NOW_SHOWING,
		},
		{
			label: 'Ended',
			value: ScreeningStatusEnum.ENDED,
		},
		{
			label: 'Cancelled',
			value: ScreeningStatusEnum.CANCELLED,
		},
	];

	// Search and filter
	searchTerm = '';
	selectedGenre = '';
	selectedLanguage = '';

	constructor(
		private movieApiService: MovieApiDataService,
		private dialogService: DialogService,
		private router: Router
	) {}

	ngOnInit() {
		this.fetchMoviesByStatus();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	getMediaUrl(uri: string) {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Fetch movies by status with pagination
	 */
	fetchMoviesByStatus() {
		this.loading = true;
		this.error = null;

		// Choose the appropriate API method based on status
		let apiCall;
		switch (this.activeStatus) {
			case ScreeningStatusEnum.UPCOMING:
				apiCall = this.movieApiService.getUpcomingMoviesPaginated(
					this.currentPage,
					this.pageSize
				);
				break;
			case ScreeningStatusEnum.NOW_SHOWING:
				apiCall = this.movieApiService.getMoviesScreeningNowPaginated(
					this.currentPage,
					this.pageSize
				);
				break;
			case ScreeningStatusEnum.ENDED:
				apiCall = this.movieApiService.getEndedMoviesPaginated(
					this.currentPage,
					this.pageSize
				);
				break;
			case ScreeningStatusEnum.CANCELLED:
				apiCall = this.movieApiService.getCancelledMoviesPaginated(
					this.currentPage,
					this.pageSize
				);
				break;
			default:
				apiCall = this.movieApiService.getMoviesScreeningNowPaginated(
					this.currentPage,
					this.pageSize
				);
		}

		apiCall.pipe(takeUntil(this.destroy$)).subscribe({
			next: (response: PaginatedData<Movie>) => {
				console.log('Movies fetched successfully:', response);
				this.movies = response.data || [];
				this.totalRecords = response.pagination?.totalCount || 0;
				this.totalPages = response.pagination?.totalPages || 0;
				this.loading = false;
			},
			error: (error: any) => {
				console.error('Error fetching movies:', error);
				this.error = 'Failed to load movies. Please try again.';
				this.movies = [];
				this.totalRecords = 0;
				this.totalPages = 0;
				this.loading = false;
			},
		});
	}

	/**
	 * Handle tab change
	 */
	onTabChange(event: any) {
		this.activeTabIndex = event.index;
		this.activeStatus = this.statusTabs[event.index].value;
		this.currentPage = 1; // Reset to first page
		this.fetchMoviesByStatus();
	}

	/**
	 * Handle page change
	 */
	onPageChange(event: any) {
		// Handle PrimeNG Paginator event
		if (event.first !== undefined && event.rows !== undefined) {
			this.currentPage = Math.floor(event.first / event.rows) + 1;
			this.pageSize = event.rows;
			this.fetchMoviesByStatus();
		}
	}

	/**
	 * Search movies
	 */
	searchMovies() {
		this.currentPage = 1;
		this.fetchMoviesByStatus();
	}

	/**
	 * Clear search
	 */
	clearSearch() {
		this.searchTerm = '';
		this.selectedGenre = '';
		this.selectedLanguage = '';
		this.currentPage = 1;
		this.fetchMoviesByStatus();
	}

	/**
	 * Get screening status display text
	 */
	getStatusText(status: string): string {
		switch (status) {
			case 'UPCOMING':
				return 'Upcoming';
			case 'NOW_SHOWING':
				return 'Now Showing';
			case 'ENDED':
				return 'Ended';
			default:
				return status || 'Unknown';
		}
	}

	/**
	 * Get status severity for styling
	 */
	getStatusSeverity(status: string): string {
		switch (status) {
			case 'NOW_SHOWING':
				return 'success';
			case 'UPCOMING':
				return 'info';
			case 'ENDED':
				return 'warning';
			default:
				return 'secondary';
		}
	}

	/**
	 * Format duration
	 */
	formatDuration(minutes: number): string {
		if (!minutes) return 'N/A';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
	}

	/**
	 * Format date
	 */
	formatDate(date: Date | string): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get movie poster URL (first image from media)
	 */
	getMoviePosterUrl(movie: Movie): string | null {
		if (movie.media && movie.media.length > 0) {
			// Find first image media
			const imageMedia = movie.media.find(
				(m: { type: string }) => m.type === 'IMAGE'
			);
			return imageMedia ? this.getMediaUrl(imageMedia.uri) : null;
		}
		return null;
	}

	/**
	 * Check if movie has poster
	 */
	hasMoviePoster(movie: Movie): boolean {
		return this.getMoviePosterUrl(movie) !== null;
	}

	/**
	 * View movie details and performance
	 */
	viewMovieDetails(movie: Movie) {
		console.log('View movie details:', movie.name);
		this.router.navigate(['/executive-producer/movies', movie.id]);
	}

	/**
	 * View movie screenings
	 */
	viewMovieScreenings(movie: Movie) {
		console.log('View movie screenings:', movie.name);
		this.router.navigate(['/executive-producer/screenings', movie.id]);
	}

	/**
	 * View movie bookings
	 */
	viewMovieBookings(movie: Movie) {
		console.log('View movie bookings:', movie.name);
		this.router.navigate(['/executive-producer/bookings', movie.id]);
	}

	/**
	 * View movie revenue
	 */
	viewMovieRevenue(movie: Movie) {
		console.log('View movie revenue:', movie.name);
		this.router.navigate(['/executive-producer/revenue', movie.id]);
	}

	/**
	 * Handle image load error
	 */
	onImageError(event: any) {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	/**
	 * Refresh movie list
	 */
	refreshMovies() {
		this.currentPage = 1; // Reset to first page
		this.fetchMoviesByStatus();
	}

	/**
	 * Get current tab label
	 */
	get currentTabLabel(): string {
		return this.statusTabs[this.activeTabIndex]?.label || 'movies';
	}

	/**
	 * Format currency for revenue display
	 */
	formatCurrency(amount: number): string {
		return `BTN ${amount?.toLocaleString() || '0'}`;
	}

	/**
	 * Get total screenings count for a movie
	 */
	getTotalScreenings(movie: Movie): number {
		// This would typically come from an API call
		// For now, return a placeholder
		return 0;
	}

	/**
	 * Get total bookings count for a movie
	 */
	getTotalBookings(movie: Movie): number {
		// This would typically come from an API call
		// For now, return a placeholder
		return 0;
	}

	/**
	 * Get total revenue for a movie
	 */
	getTotalRevenue(movie: Movie): number {
		// This would typically come from an API call
		// For now, return a placeholder
		return 0;
	}
}
