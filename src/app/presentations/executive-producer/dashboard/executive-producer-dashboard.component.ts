import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { ExecutiveProducerDataService } from '../../../core/dataservice/executive-producer/executive-producer.dataservice';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import {
	MovieDashboardData,
	DashboardOverview,
	AnalyticsFilterParams,
} from '../../../core/dataservice/executive-producer/executive-producer.interface';
import { BASEAPI_URL } from '../../../core/constants/constants';

@Component({
	selector: 'app-executive-producer-dashboard',
	templateUrl: './executive-producer-dashboard.component.html',
	styleUrls: ['./executive-producer-dashboard.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [MessageService],
})
export class ExecutiveProducerDashboardComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	movies: Movie[] = [];
	selectedMovie: Movie | null = null;
	selectedMovieId: number | null = null;
	movie: Movie | null = null; // Alias for selectedMovie to match admin component

	// Dashboard Data
	overviewData: DashboardOverview | null = null;
	movieDashboardData: MovieDashboardData | null = null;

	// UI State
	loading = false;
	error: string | null = null;

	// Chart Data
	revenueChartData: any = null;
	occupancyChartData: any = null;

	// Trailer properties
	showTrailerDialog = false;
	safeTrailerUrl: SafeResourceUrl | null = null;

	// Tab properties
	activeTabIndex = 0;

	// Chart Options (updated for clean lines without grid)
	chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: true,
				position: 'top' as const,
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				grid: {
					display: false, // Remove grid lines
				},
				ticks: {
					callback: function (value: any) {
						if (value >= 1000) {
							return (value / 1000).toFixed(0) + 'K';
						}
						return value;
					},
				},
			},
			x: {
				grid: {
					display: false, // Remove grid lines
				},
			},
		},
		elements: {
			line: {
				tension: 0.4, // Smooth curves
			},
		},
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private executiveProducerService: ExecutiveProducerDataService,
		private movieApiService: MovieApiDataService,
		private messageService: MessageService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		// Get movie ID from route if provided
		const movieId = this.route.snapshot.paramMap.get('id');

		// Load movies first
		this.loadMovies();

		if (movieId) {
			this.selectedMovieId = parseInt(movieId);
			this.loadMovieDetails(this.selectedMovieId);
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load all movies for the executive producer
	 */
	loadMovies() {
		this.loading = true;
		this.error = null;

		this.executiveProducerService
			.getAllMovies()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: any) => {
					this.movies = response.data || response || [];
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading movies:', error);
					this.error = 'Failed to load movies. Please try again.';
					this.loading = false;
				},
			});
	}

	/**
	 * Load movie details by ID
	 */
	loadMovieDetails(movieId: number) {
		if (!movieId) return;

		this.loading = true;
		this.error = null;

		this.movieApiService
			.findMovieById(movieId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: any) => {
					this.selectedMovie = response.data || response;
					this.movie = this.selectedMovie; // Set alias
					this.loadMovieDashboard(movieId);
				},
				error: (error: any) => {
					console.error('Error loading movie details:', error);
					this.error = 'Failed to load movie details. Please try again.';
					this.loading = false;
				},
			});
	}

	/**
	 * Load movie dashboard data
	 */
	loadMovieDashboard(movieId: number) {
		this.executiveProducerService
			.getMovieDashboard(movieId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: any) => {
					this.movieDashboardData = response.data || response;
					this.prepareChartData();
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading movie dashboard:', error);
					this.error = 'Failed to load movie analytics. Please try again.';
					this.loading = false;
				},
			});
	}

	/**
	 * Handle movie selection change - Navigate to movie detail component
	 */
	onMovieChange(movieId: number | null) {
		if (movieId) {
			// Navigate to the dedicated movie detail component
			this.router.navigate(['/executive-producer/movies', movieId]);
		} else {
			// Navigate back to dashboard/movie selection
			this.router.navigate(['/executive-producer/dashboard']);
		}
	}

	/**
	 * Navigate back to movie selection
	 */
	goBack() {
		this.selectedMovieId = null;
		this.selectedMovie = null;
		this.movie = null;
		this.movieDashboardData = null;
		this.router.navigate(['/executive-producer/dashboard']);
	}

	/**
	 * Refresh current data
	 */
	refreshData() {
		if (this.selectedMovieId) {
			this.loadMovieDetails(this.selectedMovieId);
		} else {
			this.loadMovies();
		}
	}

	/**
	 * Export dashboard report
	 */
	exportDashboard() {
		if (!this.selectedMovieId) return;

		this.executiveProducerService
			.exportDashboardReport(this.selectedMovieId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: any) => {
					// Handle file download
					this.messageService.add({
						severity: 'success',
						summary: 'Export Complete',
						detail: 'Dashboard report exported successfully',
					});
				},
				error: (error: any) => {
					console.error('Error exporting dashboard:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Export Failed',
						detail: 'Failed to export dashboard report',
					});
				},
			});
	}

	/**
	 * Prepare chart data from dashboard response
	 */
	prepareChartData() {
		if (!this.movieDashboardData) return;

		// Mock chart data - replace with actual data from API
		this.revenueChartData = {
			labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
			datasets: [
				{
					label: 'Revenue (in thousands)',
					data: [12, 19, 15, 25, 22, 30],
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.1)',
					tension: 0.4,
				},
			],
		};

		this.occupancyChartData = {
			labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
			datasets: [
				{
					label: 'Occupancy Rate (%)',
					data: [65, 75, 70, 80],
					backgroundColor: '#8b5cf6',
					borderColor: '#8b5cf6',
					borderWidth: 1,
				},
			],
		};
	}

	/**
	 * Format currency values
	 */
	formatCurrency(value: number): string {
		if (!value) return '$0';

		if (value >= 1000000) {
			return `$${(value / 1000000).toFixed(1)}M`;
		} else if (value >= 1000) {
			return `$${(value / 1000).toFixed(0)}K`;
		}
		return `$${value.toLocaleString()}`;
	}

	/**
	 * Format percentage values
	 */
	formatPercentage(value: number): string {
		if (!value) return '0%';
		return `${value.toFixed(1)}%`;
	}

	/**
	 * Format date values
	 */
	formatDate(date: Date | string | null): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
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
			case 'CANCELLED':
				return 'Cancelled';
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
			case 'CONFIRMED':
				return 'success';
			case 'UPCOMING':
			case 'PENDING':
				return 'info';
			case 'ENDED':
				return 'warning';
			case 'CANCELLED':
				return 'danger';
			default:
				return 'secondary';
		}
	}

	/**
	 * Get media URL with base API URL
	 */
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Get the first portrait image from the movie's media
	 */
	getFirstPortraitImage(): any {
		if (
			!this.selectedMovie?.media ||
			!Array.isArray(this.selectedMovie.media)
		) {
			return null;
		}

		return this.selectedMovie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	/**
	 * Get movie poster URL (first image from media)
	 */
	getMoviePosterUrl(movie: Movie): string | null {
		if (movie.media && movie.media.length > 0) {
			// Find first image media with portrait orientation if available
			const portraitImage = movie.media.find(
				(m: any) => m.type === 'IMAGE' && m.orientation === 'PORTRAIT'
			);
			if (portraitImage) {
				return this.getMediaUrl(portraitImage.uri);
			}

			// Fallback to any image
			const imageMedia = movie.media.find((m: any) => m.type === 'IMAGE');
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
	 * Handle image load error
	 */
	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	/**
	 * Open trailer dialog
	 */
	openTrailer() {
		if (this.selectedMovie?.trailerURL) {
			// Convert YouTube URL to embed format
			let embedUrl = this.selectedMovie.trailerURL;
			if (embedUrl.includes('youtube.com/watch?v=')) {
				const videoId = embedUrl.split('v=')[1].split('&')[0];
				embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
			} else if (embedUrl.includes('youtu.be/')) {
				const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
				embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
			}

			this.safeTrailerUrl =
				this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
			this.showTrailerDialog = true;
		}
	}

	/**
	 * Close trailer dialog
	 */
	closeTrailer() {
		this.showTrailerDialog = false;
		this.safeTrailerUrl = null;
	}

	trackByMovieId = (index: number, item: any) => item.movieId || item.id;
}
