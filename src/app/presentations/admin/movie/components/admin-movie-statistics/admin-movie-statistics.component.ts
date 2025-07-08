import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { StatisticsDataService } from '../../../../../core/dataservice/statistics/statistics.dataservice';
import { MovieStatistics } from '../../../../../core/dataservice/statistics/statistics.interface';

@Component({
	selector: 'app-admin-movie-statistics',
	templateUrl: './admin-movie-statistics.component.html',
	styleUrls: ['./admin-movie-statistics.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class AdminMovieStatisticsComponent implements OnInit {
	@Input() movie: Movie | null = null;
	@Input() screenings: any[] = [];
	@Input() screeningStats = {
		total: 0,
		upcoming: 0,
		ongoing: 0,
		completed: 0,
	};

	movieStatisticsSummary: MovieStatistics = {
		movieId: 0,
		movieTitle: '',
		totalScreenings: 0,
		totalTicketsSold: 0,
		totalRevenue: 0,
		averageOccupancyRate: 0,
	};
	constructor(
		private router: Router,
		private statisticsDataService: StatisticsDataService
	) {}
	ngOnInit(): void {
		this.statisticsDataService.getMovieStatistics(this.movie!.id).subscribe({
			next: (res) => {
				this.movieStatisticsSummary = res.statistics;
			},
		});
	}

	/**
	 * Navigate to screenings management
	 */
	navigateToScreenings() {
		// TODO: Navigate to screenings management page
		// this.router.navigate(['/admin/screenings', this.movie?.id]);
		console.log('Navigate to screenings for movie:', this.movie?.id);
	}

	/**
	 * Format date
	 */
	formatDate(date: Date | string): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString();
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
}
