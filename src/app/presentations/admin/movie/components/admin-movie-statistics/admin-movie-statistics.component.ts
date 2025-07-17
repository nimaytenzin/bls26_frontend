import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { StatisticsDataService } from '../../../../../core/dataservice/statistics/statistics.dataservice';
import { MovieStatistics } from '../../../../../core/dataservice/statistics/statistics.interface';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { Screening } from '../../../../../core/dataservice/screening/screening.interface';
import { BASEAPI_URL } from '../../../../../core/constants/constants';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminScreeningDetailedViewComponent } from '../../../screening/components/admin-screening-detailed-view/admin-screening-detailed-view.component';

@Component({
	selector: 'app-admin-movie-statistics',
	templateUrl: './admin-movie-statistics.component.html',
	styleUrls: ['./admin-movie-statistics.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [DialogService],
})
export class AdminMovieStatisticsComponent implements OnInit {
	@Input() movie: Movie | null = null;
	ref: DynamicDialogRef | null = null;

	movieStatisticsSummary: MovieStatistics | null = null;
	screenings: Screening[] = [];
	loading = false;
	error: string | null = null;

	// View management
	activeTabIndex = 0;

	constructor(
		private router: Router,
		private screeningService: ScreeningDataService,
		private dialogService: DialogService
	) {}

	ngOnInit(): void {
		if (this.movie?.id) {
			this.loadScreenings();
		}
	}

	/**
	 * Load screenings for the movie
	 */
	loadScreenings(): void {
		if (!this.movie?.id) return;

		this.screeningService
			.findScreeningsByMovieIdDetailed(this.movie.id)
			.subscribe({
				next: (screenings) => {
					console.log('Loaded screenings for movie:', screenings);
					this.screenings = screenings;
				},
				error: (error) => {
					console.error('Error loading screenings:', error);
				},
			});
	}

	/**
	 * Get the first portrait image from the movie's media
	 */
	getFirstPortraitImage(): any {
		if (!this.movie?.media || !Array.isArray(this.movie.media)) {
			return null;
		}

		return this.movie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
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
	 * Get calculated statistics from screenings
	 */
	getCalculatedStatistics() {
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

		return time;
	}

	/**
	 * Format date
	 */
	formatDate(date: Date | string): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
		});
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

	openDetailDialog(screening: Screening): void {
		const ref = this.dialogService.open(AdminScreeningDetailedViewComponent, {
			header: `${screening.movie.name} - Screening Details`,
			data: { screening },
			maximizable: true,
			modal: true,
			closable: true,
			styleClass: '!rounded-2xl !border-none !shadow-2xl',
		});
	}
}
