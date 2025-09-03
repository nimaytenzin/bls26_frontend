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
import { Router } from '@angular/router';

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

	constructor(
		private publicDataService: PublicDataService,
		private router: Router
	) {}

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
				return 'bg-green-500/90 border-green-400/50 text-white';
			case ScreeningStatusEnum.UPCOMING:
				return 'bg-blue-500/90 border-blue-400/50 text-white';
			case ScreeningStatusEnum.ENDED:
				return 'bg-gray-500/90 border-gray-400/50 text-white';
			case ScreeningStatusEnum.CANCELLED:
				return 'bg-red-500/90 border-red-400/50 text-white';
			default:
				return 'bg-gray-500/90 border-gray-400/50 text-white';
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
				return 'w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group';
			case ScreeningStatusEnum.UPCOMING:
				return 'w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-medium rounded-lg cursor-not-allowed opacity-75 flex items-center justify-center gap-2';
			default:
				return 'w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-400 font-medium rounded-lg cursor-not-allowed opacity-50 flex items-center justify-center gap-2';
		}
	}

	// Track by function for better performance
	trackByMovieId(index: number, movie: Movie): any {
		return movie.id || index;
	}

	// Watch trailer functionality
	watchTrailer(trailerURL: string): void {
		if (trailerURL) {
			window.open(trailerURL, '_blank');
		}
	}

	// Handle movie actions (booking, etc.)
	onMovieAction(movie: Movie): void {
		if (this.isMovieBookable(movie.screeningStatus)) {
			// Navigate to movie details or booking page
			this.router.navigate(['/movie', movie.id]);
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
