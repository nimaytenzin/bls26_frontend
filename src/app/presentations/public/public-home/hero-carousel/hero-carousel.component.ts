import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../../core/constants/constants';

@Component({
	selector: 'app-hero-carousel',
	templateUrl: './hero-carousel.component.html',
	styleUrls: ['./hero-carousel.component.scss'],
	standalone: true,
	imports: [CommonModule, CarouselModule],
})
export class HeroCarouselComponent {
	@Input() movies: Movie[] = [];
	@Input() isLoading: boolean = false;

	@Output() buyTicketsClicked = new EventEmitter<number>();
	@Output() watchTrailerClicked = new EventEmitter<string>();

	// Helper methods copied from the parent component
	getCarouselImage(movie: Movie): string {
		// Use portrait image for small screens, landscape for larger screens
		if (window.innerWidth < 768) {
			// Mobile and tablet
			return this.getMoviePotraitImage(movie);
		} else {
			// Desktop
			return this.getMovieLandscapeImage(movie);
		}
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
		// Get the first portrait image from media array, fallback to any image, or default
		const portraitImage = this.getFirstPortraitImage(movie);

		if (portraitImage) {
			return this.getMediaUrl(portraitImage.uri);
		}

		// Fallback to first image
		const firstImage = movie.media?.find((m) => m.type === 'IMAGE');
		if (firstImage) {
			return this.getMediaUrl(firstImage.uri);
		}

		// Default fallback image
		return 'assets/images/default-movie-poster.jpg';
	}

	private getFirstLandscapePosterImage(movie: Movie) {
		return movie.media?.find(
			(m) => m.type === 'IMAGE' && m.orientation === 'LANDSCAPE'
		);
	}

	private getFirstPortraitImage(movie: Movie) {
		return movie.media?.find(
			(m) => m.type === 'IMAGE' && m.orientation === 'PORTRAIT'
		);
	}

	private getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
	}

	getGenresText(movie: Movie): string {
		if (!movie.genres || movie.genres.length === 0) return 'N/A';
		return movie.genres.map((genre) => genre.name).join(', ');
	}

	isMovieBookable(status: string): boolean {
		return status === 'now_showing' || status === 'Screening Now';
	}

	getMovieButtonText(status: string): string {
		console.log(status);
		switch (status) {
			case 'now_showing':
				return 'Buy Tickets';
			case 'Screening Now':
				return 'Buy Tickets';
			case 'Coming Soon':
				return 'Coming Soon';
			case 'Ended':
				return 'Ended';
			default:
				return 'Unavailable';
		}
	}

	onBuyTickets(movieId: number): void {
		this.buyTicketsClicked.emit(movieId);
	}

	onWatchTrailer(trailerURL: string): void {
		this.watchTrailerClicked.emit(trailerURL);
	}
}
