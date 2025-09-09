import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
	Movie,
	ScreeningStatusEnum,
} from '../../../core/dataservice/movie/movie.interface';
import { PublicDataService } from '../../../core/dataservice/public/public.dataservice';
import { BASEAPI_URL } from '../../../core/constants/constants';
import { HeroCarouselComponent } from './hero-carousel/hero-carousel.component';
import { MovieCardComponent } from './movie-card/movie-card.component';

@Component({
	selector: 'app-public-home',
	templateUrl: './public-home.component.html',
	styleUrls: ['./public-home.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		TagModule,
		DialogModule,
		ProgressSpinnerModule,
		HeroCarouselComponent,
		MovieCardComponent,
	],
})
export class PublicHomeComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	movieScreeningStatus = ScreeningStatusEnum;
	showPreloader: boolean = true;
	isLoading: boolean = false;
	error: string | null = null;

	// YouTube Modal properties
	showTrailerModal: boolean = false;
	currentTrailerUrl: SafeResourceUrl | null = null;

	movies: Movie[] = [];
	filteredMovies: Movie[] = [];

	movieStatuses: string[] = ['Screening', 'Coming Soon'];
	selectedStatus: string = 'Screening';

	constructor(
		private router: Router,
		private sanitizer: DomSanitizer,
		private publicDataService: PublicDataService
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
					console.log('Loaded movies:', movies);
					this.movies = movies;
					this.filterByStatus(this.selectedStatus); // Apply initial filter
					this.isLoading = false;
					// Hide preloader after movies load
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

	buyTickets(movieId: number) {
		// Find the movie to check its status
		const movie =
			this.movies.find((m) => m.id === movieId) ||
			this.filteredMovies.find((m) => m.id === movieId);

		if (
			movie &&
			(movie.screeningStatus === ScreeningStatusEnum.UPCOMING ||
				movie.screeningStatus === ScreeningStatusEnum.ENDED ||
				movie.screeningStatus === ScreeningStatusEnum.CANCELLED)
		) {
			// Show alert or message that booking is not available
			let message = 'Booking is not available for this movie.';

			if (movie.screeningStatus === ScreeningStatusEnum.UPCOMING) {
				message =
					'This movie is coming soon. Booking will be available closer to the release date.';
			} else if (movie.screeningStatus === ScreeningStatusEnum.ENDED) {
				message = 'This movie is no longer screening.';
			} else if (movie.screeningStatus === ScreeningStatusEnum.CANCELLED) {
				message = 'This movie has been cancelled.';
			}

			alert(message);
			return;
		}

		this.router.navigate(['/select-schedule', movieId]);
	}

	watchTrailer(trailerUrl: string) {
		// Convert YouTube watch URL to embed URL with autoplay
		const embedUrl = this.convertToEmbedUrl(trailerUrl);
		this.currentTrailerUrl =
			this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
		this.showTrailerModal = true;
	}

	closeTrailerModal() {
		this.showTrailerModal = false;
		this.currentTrailerUrl = null;
	}

	filterByStatus(status: string) {
		this.selectedStatus = status;

		if (status === 'Screening') {
			this.filteredMovies = this.movies.filter(
				(movie) => movie.screeningStatus === ScreeningStatusEnum.NOW_SHOWING
			);
		} else if (status === 'Coming Soon') {
			this.filteredMovies = this.movies.filter(
				(movie) => movie.screeningStatus === ScreeningStatusEnum.UPCOMING
			);
		} else {
			this.filteredMovies = [...this.movies];
		}

		console.log(`Filtered movies for ${status}:`, this.filteredMovies);
	}

	private convertToEmbedUrl(youtubeUrl: string): string {
		// Extract video ID from various YouTube URL formats
		const regExp =
			/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
		const match = youtubeUrl.match(regExp);
		const videoId = match && match[7].length === 11 ? match[7] : null;

		if (videoId) {
			// Return embed URL with autoplay, muted (required for autoplay), and other parameters
			return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
		}

		return youtubeUrl;
	}

	// Helper methods for template
	getFirstLandscapePosterImage(movie: Movie): any {
		return movie?.media?.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'LANDSCAPE'
		);
	}

	getFirstPortraitImage(movie: Movie): any {
		return movie?.media?.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	getMovieLandscapeImage(movie: Movie): string {
		// Get the first landscape image from media array, fallback to any image, or default
		const landscapeImage = this.getFirstLandscapePosterImage(movie);

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

	getMoviePotraitImage(movie: Movie): string {
		// Get the first landscape image from media array, fallback to any image, or default
		const portaitImage = this.getFirstPortraitImage(movie);

		if (portaitImage) {
			return this.getMediaUrl(portaitImage.uri);
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
				return 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white border-green-400/50 animate-pulse';
			case ScreeningStatusEnum.UPCOMING:
				return 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white border-blue-400/50';
			case ScreeningStatusEnum.ENDED:
				return 'bg-gradient-to-r from-gray-500/90 to-gray-600/90 text-white border-gray-400/50';
			case ScreeningStatusEnum.CANCELLED:
				return 'bg-gradient-to-r from-red-500/90 to-red-600/90 text-white border-red-400/50';
			default:
				return 'bg-gradient-to-r from-gray-500/90 to-gray-600/90 text-white border-gray-400/50';
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
