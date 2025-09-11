import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

// Common imports
import { CommonModule } from '@angular/common';
import { ExecutiveProducerDataService } from '../../../core/dataservice/executive-producer/executive-producer.dataservice';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';

// Import proper types
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import {
	MovieDashboardData,
	ApiResponse,
} from '../../../core/dataservice/executive-producer/executive-producer.interface';
import { AdminMovieStatisticsComponent } from '../../admin/movie/components/admin-movie-statistics/admin-movie-statistics.component';

@Component({
	selector: 'app-executive-producer-movie-detail',
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		CardModule,
		ChartModule,
		DialogModule,
		ProgressBarModule,
		TagModule,
		TabViewModule,
		ToastModule,
		TooltipModule,
		MessageModule,
		AdminMovieStatisticsComponent,
	],
	providers: [MessageService],
	templateUrl: './executive-producer-movie-detail.component.html',
	styleUrls: ['./executive-producer-movie-detail.component.scss'],
})
export class ExecutiveProducerMovieDetailComponent
	implements OnInit, OnDestroy
{
	// Injected Services
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private sanitizer = inject(DomSanitizer);
	private messageService = inject(MessageService);
	private executiveProducerDataService = inject(ExecutiveProducerDataService);
	private movieApiDataService = inject(MovieApiDataService);

	// Component State
	loading = false;
	error: string | null = null;
	movie: Movie | null = null;
	movieDashboardData: MovieDashboardData | null = null;

	// UI State
	activeTabIndex = 0;
	showTrailerDialog = false;
	safeTrailerUrl: SafeResourceUrl | null = null;

	// Chart Data
	revenueChartData: any = null;
	occupancyChartData: any = null;
	chartOptions: any = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: true,
				position: 'top',
			},
		},
		scales: {
			y: {
				beginAtZero: true,
			},
		},
	};

	// Lifecycle Management
	private destroy$ = new Subject<void>();

	ngOnInit(): void {
		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			const movieId = Number(params['id']);
			if (movieId) {
				this.loadMovieDetails(movieId);

				this.executiveProducerDataService
					.getLifetimeMovieTrends(movieId)
					.subscribe({
						next: (res) => {
							console.log('LIFE TIME MOVIE TRENDS');
							console.log(res);
						},
					});
			} else {
				this.error = 'Invalid movie ID';
			}
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	// Data Loading Methods
	loadMovieDetails(movieId: number): void {
		this.loading = true;
		this.error = null;

		// Load movie data and analytics simultaneously
		Promise.all([this.loadMovie(movieId), this.loadMovieAnalytics(movieId)])
			.then(() => {
				this.loading = false;
			})
			.catch((error) => {
				this.loading = false;
				this.error = error.message || 'Failed to load movie details';
				this.showError('Failed to load movie details');
			});
	}

	private async loadMovie(movieId: number): Promise<void> {
		try {
			const response = await this.movieApiDataService
				.findMovieById(movieId)
				.toPromise();
			this.movie = response || null;
			console.log(this.movie);
		} catch (error) {
			throw new Error('Failed to load movie information');
		}
	}

	private async loadMovieAnalytics(movieId: number): Promise<void> {
		try {
			const response = await this.executiveProducerDataService
				.getMovieDashboard(movieId)
				.toPromise();

			this.movieDashboardData = response?.data || null;
			if (this.movieDashboardData) {
				this.prepareChartData(this.movieDashboardData);
			}
		} catch (error) {
			// Analytics is optional, don't throw error
			console.warn('Failed to load movie analytics:', error);
		}
	}

	refreshData(): void {
		if (this.movie) {
			this.loadMovieDetails(this.movie.id);
		}
	}

	// Chart Data Preparation
	private prepareChartData(data: MovieDashboardData): void {
		// Prepare basic chart data from revenue trends
		if (data.revenueByDay && data.revenueByDay.length > 0) {
			// Revenue Chart
			this.revenueChartData = {
				labels: data.revenueByDay.map((item) =>
					new Date(item.date).toLocaleDateString()
				),
				datasets: [
					{
						label: 'Revenue',
						data: data.revenueByDay.map((item) => item.revenue),
						borderColor: '#3B82F6',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						tension: 0.4,
						fill: true,
					},
				],
			};
		}

		if (data.occupancyTrend && data.occupancyTrend.length > 0) {
			// Occupancy Chart
			this.occupancyChartData = {
				labels: data.occupancyTrend.map((item) => item.period),
				datasets: [
					{
						label: 'Occupancy Rate (%)',
						data: data.occupancyTrend.map((item) => item.occupancyRate),
						backgroundColor: '#8B5CF6',
						borderColor: '#7C3AED',
						borderWidth: 1,
					},
				],
			};
		}
	}

	// Media Handling
	getFirstPortraitImage(): any {
		if (!this.movie?.media) return null;

		// First try to find a portrait image
		const portraitImage = this.movie.media.find(
			(m) =>
				m.type === 'IMAGE' &&
				m.orientation &&
				(m.orientation.includes('PORTRAIT') ||
					m.orientation.includes('portrait'))
		);

		// If portrait image found, return it
		if (portraitImage) return portraitImage;

		// Otherwise, fall back to the first image of any type
		return this.movie.media.find((m) => m.type === 'IMAGE') || null;
	}

	getMediaUrl(uri: string): string {
		if (uri.startsWith('http')) return uri;
		return `/api${uri}`;
	}

	onImageError(event: any): void {
		const target = event.target as HTMLImageElement;
		// Prevent infinite loop if default image also fails
		if (target && !target.src.includes('default-poster.png')) {
			target.src = '/assets/images/default-poster.png';
		} else if (target) {
			// If even default poster fails, hide the image
			target.style.display = 'none';
		}
	}

	// Trailer Handling
	openTrailer(): void {
		if (this.movie?.trailerURL) {
			this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
				this.getEmbedUrl(this.movie.trailerURL)
			);
			this.showTrailerDialog = true;
		}
	}

	closeTrailer(): void {
		this.showTrailerDialog = false;
		this.safeTrailerUrl = null;
	}

	private getEmbedUrl(url: string): string {
		if (url.includes('youtube.com/watch')) {
			const videoId = url.split('v=')[1]?.split('&')[0];
			return `https://www.youtube.com/embed/${videoId}`;
		}
		if (url.includes('youtu.be/')) {
			const videoId = url.split('youtu.be/')[1]?.split('?')[0];
			return `https://www.youtube.com/embed/${videoId}`;
		}
		return url;
	}

	// Navigation
	goBack(): void {
		this.router.navigate(['/executive-producer/dashboard']);
	}

	// Utility Methods
	formatCurrency(amount: number): string {
		if (amount >= 1000000) {
			return `₹${(amount / 1000000).toFixed(1)}M`;
		} else if (amount >= 1000) {
			return `₹${(amount / 1000).toFixed(1)}K`;
		}
		return `Nu ${amount.toLocaleString()}`;
	}

	formatPercentage(value: number): string {
		return `${value.toFixed(1)}%`;
	}

	formatDuration(minutes: number): string {
		if (!minutes) return 'N/A';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours === 0) return `${mins}min`;
		return `${hours}h ${mins}min`;
	}

	formatDate(dateValue: string | Date | null | undefined): string {
		if (!dateValue) return 'N/A';

		const date =
			typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	getStatusText(status: string | undefined): string {
		switch (status) {
			case 'now_showing':
				return 'Now Showing';
			case 'UPCOMING':
				return 'Coming Soon';
			case 'ENDED':
				return 'Ended';
			default:
				return 'Unknown';
		}
	}

	getStatusSeverity(status: string | undefined): any {
		switch (status) {
			case 'ACTIVE':
				return 'success';
			case 'UPCOMING':
				return 'info';
			case 'ENDED':
				return 'warning';
			case 'CONFIRMED':
				return 'success';
			case 'PENDING':
				return 'warning';
			case 'CANCELLED':
				return 'danger';
			default:
				return 'secondary';
		}
	}

	// Export and Actions
	exportMovieReport(): void {
		if (!this.movie) return;

		try {
			const reportData = {
				movie: this.movie,
				analytics: this.movieDashboardData,
				exportDate: new Date().toISOString(),
			};

			const blob = new Blob([JSON.stringify(reportData, null, 2)], {
				type: 'application/json',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${this.movie.name}-report-${
				new Date().toISOString().split('T')[0]
			}.json`;
			link.click();
			window.URL.revokeObjectURL(url);

			this.showSuccess('Report exported successfully');
		} catch (error) {
			this.showError('Failed to export report');
		}
	}

	// Message Handling
	private showSuccess(message: string): void {
		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: message,
		});
	}

	private showError(message: string): void {
		this.messageService.add({
			severity: 'error',
			summary: 'Error',
			detail: message,
		});
	}
}
