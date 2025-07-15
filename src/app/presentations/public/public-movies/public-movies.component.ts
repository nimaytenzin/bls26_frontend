import { Component, OnDestroy, OnInit } from '@angular/core';
import {
	Movie,
	ScreeningStatusEnum,
} from '../../../core/dataservice/movie/movie.interface';
import { PublicDataService } from '../../../core/dataservice/public/public.dataservice';
import { Subject, takeUntil } from 'rxjs';
import { BASEAPI_URL } from '../../../core/constants/constants';
import { PrimeNgModules } from '../../../primeng.modules';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-public-movies',
	templateUrl: './public-movies.component.html',
	styleUrls: ['./public-movies.component.scss'],
	imports: [PrimeNgModules, CommonModule],
})
export class PublicMoviesComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	isLoading = false;
	showPreloader: boolean = true;
	error: string | null = null;

	movies: Movie[] = [];
	filteredMovies: Movie[] = [];
	constructor(private publicDataService: PublicDataService) {}

	ngOnInit() {
		this.loadMovies();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadMovies() {
		this.isLoading = true;
		this.error = null;

		this.publicDataService
			.findAllMovies()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (movies) => {
					this.movies = movies;
					this.filteredMovies = this.movies;
					this.isLoading = false;
					setTimeout(() => {
						this.showPreloader = false;
					}, 500);
				},
				error: (error) => {
					console.error('Error loading movies:', error);
					this.error = 'Failed to load movies. Please try again later.';
					this.isLoading = false;
					this.showPreloader = false;
				},
			});
	}

	getFirstPortraitImage(movie: Movie): any {
		return movie?.media?.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	getMovieImage(movie: Movie): string {
		// Get the first landscape image from media array, fallback to any image, or default
		const landscapeImage = this.getFirstPortraitImage(movie);

		if (landscapeImage) {
			return this.getMediaUrl(landscapeImage.uri);
		}

		// Fallback to first image
		const firstImage = movie.media?.find((m) => m.type === 'IMAGE');
		if (firstImage) {
			return this.getMediaUrl(firstImage.uri);
		}

		// Default fallback image
		return 'assets/images/default-movie-poster.jpg';
	}

	getMovieStatusText(status: ScreeningStatusEnum): string {
		switch (status) {
			case ScreeningStatusEnum.NOW_SHOWING:
				return 'Screening Now';
			case ScreeningStatusEnum.UPCOMING:
				return 'Coming Soon';
			case ScreeningStatusEnum.ENDED:
				return 'Ended';
			case ScreeningStatusEnum.CANCELLED:
				return 'Cancelled';
			default:
				return 'Unknown';
		}
	}

	getMovieStatusClass(status: ScreeningStatusEnum): string {
		switch (status) {
			case ScreeningStatusEnum.NOW_SHOWING:
				return 'bg-green-500 text-white animate-pulse';
			case ScreeningStatusEnum.UPCOMING:
				return 'bg-blue-500 text-white';
			case ScreeningStatusEnum.ENDED:
				return 'bg-gray-500 text-white';
			case ScreeningStatusEnum.CANCELLED:
				return 'bg-red-500 text-white';
			default:
				return 'bg-gray-500 text-white';
		}
	}

	getMovieStatusIcon(status: ScreeningStatusEnum): string {
		switch (status) {
			case ScreeningStatusEnum.NOW_SHOWING:
				return 'pi-play-circle';
			case ScreeningStatusEnum.UPCOMING:
				return 'pi-clock';
			case ScreeningStatusEnum.ENDED:
				return 'pi-stop-circle';
			case ScreeningStatusEnum.CANCELLED:
				return 'pi-times-circle';
			default:
				return 'pi-question-circle';
		}
	}

	getMovieButtonText(status: ScreeningStatusEnum): string {
		switch (status) {
			case ScreeningStatusEnum.NOW_SHOWING:
				return 'Buy Tickets';
			case ScreeningStatusEnum.UPCOMING:
				return 'Coming Soon';
			case ScreeningStatusEnum.ENDED:
				return 'Ended';
			case ScreeningStatusEnum.CANCELLED:
				return 'Cancelled';
			default:
				return 'Unavailable';
		}
	}

	getMovieButtonIcon(status: ScreeningStatusEnum): string {
		switch (status) {
			case ScreeningStatusEnum.NOW_SHOWING:
				return 'pi-ticket';
			case ScreeningStatusEnum.UPCOMING:
				return 'pi-clock';
			default:
				return 'pi-ban';
		}
	}

	getMovieButtonClass(status: ScreeningStatusEnum): string {
		switch (status) {
			case ScreeningStatusEnum.NOW_SHOWING:
				return 'p-button-lg bg-blue-600 hover:bg-blue-700';
			case ScreeningStatusEnum.UPCOMING:
				return 'p-button-lg p-button-secondary opacity-75 cursor-not-allowed';
			default:
				return 'p-button-lg p-button-secondary opacity-50 cursor-not-allowed';
		}
	}

	isMovieBookable(status: ScreeningStatusEnum): boolean {
		return status === ScreeningStatusEnum.NOW_SHOWING;
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
}
