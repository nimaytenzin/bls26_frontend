import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieService } from '../../core/services/movie.service';
import { Movie } from '../../core/services/movie.interface';

@Component({
	selector: 'app-public-home',
	templateUrl: './public-home.component.html',
	styleUrls: ['./public-home.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		CarouselModule,
		ButtonModule,
		TagModule,
		DialogModule,
	],
})
export class PublicHomeComponent implements OnInit {
	showPreloader: boolean = true;

	// YouTube Modal properties
	showTrailerModal: boolean = false;
	currentTrailerUrl: SafeResourceUrl | null = null;

	movies: Movie[] = [];
	filteredMovies: Movie[] = [];

	responsiveOptions = [
		{
			breakpoint: '1400px',
			numVisible: 1,
			numScroll: 1,
		},
		{
			breakpoint: '1024px',
			numVisible: 1,
			numScroll: 1,
		},
		{
			breakpoint: '768px',
			numVisible: 1,
			numScroll: 1,
		},
		{
			breakpoint: '576px',
			numVisible: 1,
			numScroll: 1,
		},
	];

	movieStatuses: string[] = ['Screening', 'Coming Soon'];
	selectedStatus: string = 'Screening';

	constructor(
		private router: Router,
		private sanitizer: DomSanitizer,
		private movieService: MovieService
	) {}

	ngOnInit() {
		this.loadMovies();
		// Hide preloader after movies load
		setTimeout(() => {
			this.showPreloader = false;
		}, 0);
	}

	private loadMovies() {
		this.movieService.getAllMovies().subscribe((movies) => {
			this.movies = movies;
			this.filterByStatus('Screening');
		});
	}

	buyTickets(movieId: number) {
		// Find the movie to check its status
		const movie =
			this.movies.find((m) => m.id === movieId) ||
			this.filteredMovies.find((m) => m.id === movieId);

		if (movie && (movie.status === 'coming-soon' || movie.status === 'ended')) {
			// Show alert or message that booking is not available
			alert(
				movie.status === 'coming-soon'
					? 'This movie is coming soon. Booking will be available closer to the release date.'
					: 'This movie is no longer screening.'
			);
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
		const statusMapping = {
			Screening: 'screening',
			'Coming Soon': 'coming-soon',
		} as const;

		const movieStatus =
			statusMapping[status as keyof typeof statusMapping] || 'screening';

		this.movieService.getMoviesByStatus(movieStatus).subscribe((movies) => {
			this.filteredMovies = movies;
		});
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
}
