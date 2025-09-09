import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../../core/constants/constants';

@Component({
	selector: 'app-movie-card',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './movie-card.component.html',
	styleUrls: ['./movie-card.component.scss'],
})
export class MovieCardComponent {
	@Input() movie!: Movie;
	@Output() buyTicketsClicked = new EventEmitter<number>();
	@Output() watchTrailerClicked = new EventEmitter<string>();

	onBuyTickets() {
		this.buyTicketsClicked.emit(this.movie.id);
	}

	onWatchTrailer() {
		if (this.movie.trailerURL) {
			this.watchTrailerClicked.emit(this.movie.trailerURL);
		}
	}

	// Mobile card click handler
	onMobileCardClick(event: Event) {
		// Check if we're on mobile (screen width < 640px)
		if (window.innerWidth < 640) {
			// Prevent event if clicking on action buttons
			const target = event.target as HTMLElement;
			if (target.closest('button')) {
				return;
			}
			// Default action on mobile: buy tickets
			this.onBuyTickets();
		}
	}

	getMoviePotraitImage(movie: Movie): string {
		// Look for portrait image first
		const portraitImage = movie.media?.find(
			(media) => media.orientation === 'PORTRAIT' && media.type === 'IMAGE'
		);
		if (portraitImage) {
			return `${BASEAPI_URL}${portraitImage.uri}`;
		}

		// Fallback to landscape image
		const landscapeImage = movie.media?.find(
			(media) => media.orientation === 'LANDSCAPE' && media.type === 'IMAGE'
		);
		if (landscapeImage) {
			return `${BASEAPI_URL}${landscapeImage.uri}`;
		}

		// Default fallback
		return '/assets/images/default-avatar.jpg';
	}

	getMovieStatusClass(status: string): string {
		switch (status) {
			case 'now_showing':
				return 'bg-green-600/90 border-green-500/50 text-green-100';
			case 'Coming Soon':
				return 'bg-blue-600/90 border-blue-500/50 text-blue-100';
			case 'Ended':
				return 'bg-gray-600/90 border-gray-500/50 text-gray-100';
			case 'Cancelled':
				return 'bg-red-600/90 border-red-500/50 text-red-100';
			default:
				return 'bg-gray-600/90 border-gray-500/50 text-gray-100';
		}
	}

	getMovieStatusIcon(status: string): string {
		switch (status) {
			case 'now_showing':
				return 'pi pi-play-circle';
			case 'Coming Soon':
				return 'pi pi-clock';
			case 'Ended':
				return 'pi pi-stop-circle';
			case 'Cancelled':
				return 'pi pi-times-circle';
			default:
				return 'pi pi-info-circle';
		}
	}

	getMovieStatusText(status: string): string {
		switch (status) {
			case 'now_showing':
				return 'Now';
			case 'Coming Soon':
				return 'Soon';
			case 'Ended':
				return 'Ended';
			case 'Cancelled':
				return 'Cancelled';
			default:
				return status;
		}
	}

	isMovieBookable(status: string): boolean {
		return status === 'now_showing' || status === 'Coming Soon';
	}

	getMovieButtonText(status: string): string {
		switch (status) {
			case 'Screening':
				return 'Book';
			case 'Coming Soon':
				return 'Soon';
			default:
				return 'Unavailable';
		}
	}

	formatDuration(minutes?: number): string {
		if (!minutes) return 'N/A';
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return hours > 0
			? `${hours}h ${remainingMinutes}m`
			: `${remainingMinutes}m`;
	}
}
