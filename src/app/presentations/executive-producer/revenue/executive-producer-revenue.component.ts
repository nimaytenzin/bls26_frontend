import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { PrimeNgModules } from '../../../primeng.modules';
import { BookingDataService } from '../../../core/dataservice/booking/booking.dataservice';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import { MessageService } from 'primeng/api';

interface RevenueStats {
	totalRevenue: number;
	totalBookings: number;
	averageTicketPrice: number;
	occupancyRate: number;
}

interface MovieRevenue {
	movieId: number;
	movieName: string;
	totalRevenue: number;
	totalBookings: number;
	averageRating: number;
	screenings: number;
}

interface ChartData {
	labels: string[];
	datasets: any[];
}

@Component({
	selector: 'app-executive-producer-revenue',
	templateUrl: './executive-producer-revenue.component.html',
	styleUrls: ['./executive-producer-revenue.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [MessageService],
})
export class ExecutiveProducerRevenueComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	movies: Movie[] = [];
	selectedMovieId: number | null = null;
	selectedMovie: Movie | null = null;

	// Revenue Data
	revenueStats: RevenueStats = {
		totalRevenue: 0,
		totalBookings: 0,
		averageTicketPrice: 0,
		occupancyRate: 0,
	};

	movieRevenues: MovieRevenue[] = [];

	// UI State
	loading = false;
	error: string | null = null;

	// Calculated metrics (to prevent ExpressionChangedAfterItHasBeenCheckedError)
	revenueGrowth = 0;
	bookingGrowth = 0;
	averageRevenue = 0;
	topPerformingMovie: MovieRevenue | null = null;

	// Date Range
	selectedDateRange: Date[] = [];
	dateRangeOptions = [
		{ label: 'Last 7 Days', value: 7 },
		{ label: 'Last 30 Days', value: 30 },
		{ label: 'Last 3 Months', value: 90 },
		{ label: 'Last Year', value: 365 },
	];

	// Chart Data
	revenueChartData: ChartData = {
		labels: [],
		datasets: [],
	};

	movieComparisonChartData: ChartData = {
		labels: [],
		datasets: [],
	};

	occupancyChartData: ChartData = {
		labels: [],
		datasets: [],
	};

	chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const,
			},
		},
		scales: {
			y: {
				beginAtZero: true,
			},
		},
	};

	pieChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'right' as const,
			},
		},
	};

	constructor(
		private route: ActivatedRoute,
		private bookingDataService: BookingDataService,
		private movieService: MovieApiDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		// Check if movieId is provided in route
		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			if (params['movieId']) {
				this.selectedMovieId = +params['movieId'];
			}
		});

		this.loadInitialData();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadInitialData(): void {
		this.loading = true;
		this.error = null;

		// Load movies
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

					// Load revenue data
					this.loadRevenueData();
				},
				error: (error: any) => {
					console.error('Error loading movies:', error);
					this.error = 'Failed to load data. Please refresh the page.';
					this.loading = false;
				},
			});
	}

	loadRevenueData(): void {
		this.loading = true;

		// Simulate API calls for revenue data
		// In a real app, these would be actual API calls
		setTimeout(() => {
			this.generateMockRevenueData();
			this.generateChartData();
			this.loading = false;
		}, 1500);
	}

	generateMockRevenueData(): void {
		// Generate mock revenue statistics
		this.revenueStats = {
			totalRevenue: Math.floor(Math.random() * 5000000) + 1000000,
			totalBookings: Math.floor(Math.random() * 10000) + 2000,
			averageTicketPrice: Math.floor(Math.random() * 300) + 200,
			occupancyRate: Math.floor(Math.random() * 40) + 60,
		};

		// Generate mock movie revenue data
		this.movieRevenues = this.movies.slice(0, 8).map((movie, index) => ({
			movieId: movie.id,
			movieName: movie.name,
			totalRevenue: Math.floor(Math.random() * 2000000) + 500000,
			totalBookings: Math.floor(Math.random() * 5000) + 1000,
			averageRating: Math.floor(Math.random() * 20) / 10 + 3,
			screenings: Math.floor(Math.random() * 50) + 20,
		}));

		// Sort by revenue
		this.movieRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue);

		// Calculate derived metrics once to prevent expression change errors
		this.calculateDerivedMetrics();
	}

	calculateDerivedMetrics(): void {
		// Calculate revenue growth (mock data)
		this.revenueGrowth = Math.floor(Math.random() * 30) + 5;

		// Calculate booking growth (mock data)
		this.bookingGrowth = Math.floor(Math.random() * 25) + 3;

		// Calculate average revenue
		if (this.movieRevenues.length > 0) {
			const total = this.movieRevenues.reduce(
				(sum, movie) => sum + movie.totalRevenue,
				0
			);
			this.averageRevenue = total / this.movieRevenues.length;
		} else {
			this.averageRevenue = 0;
		}

		// Set top performing movie
		this.topPerformingMovie =
			this.movieRevenues.length > 0 ? this.movieRevenues[0] : null;
	}

	generateChartData(): void {
		// Revenue trend chart (last 30 days)
		const labels = [];
		const revenueData = [];
		const today = new Date();

		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			labels.push(
				date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
			);
			revenueData.push(Math.floor(Math.random() * 100000) + 50000);
		}

		this.revenueChartData = {
			labels,
			datasets: [
				{
					label: 'Daily Revenue (BTN)',
					data: revenueData,
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
					borderColor: 'rgba(59, 130, 246, 1)',
					borderWidth: 2,
					fill: true,
					tension: 0.4,
				},
			],
		};

		// Movie comparison chart
		this.movieComparisonChartData = {
			labels: this.movieRevenues.slice(0, 6).map((m) => m.movieName),
			datasets: [
				{
					label: 'Revenue (BTN)',
					data: this.movieRevenues.slice(0, 6).map((m) => m.totalRevenue),
					backgroundColor: [
						'#3B82F6',
						'#10B981',
						'#F59E0B',
						'#EF4444',
						'#8B5CF6',
						'#06B6D4',
					],
				},
			],
		};

		// Occupancy rate chart
		const occupancyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		const occupancyData = occupancyLabels.map(
			() => Math.floor(Math.random() * 40) + 60
		);

		this.occupancyChartData = {
			labels: occupancyLabels,
			datasets: [
				{
					label: 'Occupancy Rate (%)',
					data: occupancyData,
					backgroundColor: 'rgba(16, 185, 129, 0.2)',
					borderColor: 'rgba(16, 185, 129, 1)',
					borderWidth: 2,
				},
			],
		};
	}

	onMovieChange(movieId: number | null): void {
		this.selectedMovieId = movieId;
		this.selectedMovie = this.movies.find((m) => m.id === movieId) || null;
		this.loadRevenueData();
	}

	onDateRangeChange(): void {
		this.loadRevenueData();
	}

	onQuickDateRange(days: number): void {
		const today = new Date();
		const startDate = new Date(today);
		startDate.setDate(startDate.getDate() - days);

		this.selectedDateRange = [startDate, today];
		this.loadRevenueData();
	}

	exportReport(): void {
		this.messageService.add({
			severity: 'info',
			summary: 'Export Started',
			detail: 'Revenue report export has been initiated.',
		});
	}

	refreshData(): void {
		this.loadRevenueData();
	}

	// Helper methods
	formatCurrency(amount: number): string {
		return `BTN ${amount?.toLocaleString() || '0'}`;
	}

	formatPercentage(value: number): string {
		return `${value?.toFixed(1) || '0'}%`;
	}

	formatDate(date: Date | string): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	trackByMovieId = (index: number, item: MovieRevenue) => item.movieId;
}
