import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChipModule } from 'primeng/chip';
import { ImageModule } from 'primeng/image';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface SeatType {
	name: string;
	price: number;
}

interface ShowTime {
	screeningId: number;
	time: string;
	theatre: string;
	hall: string;
	availableSeats: number;
	totalSeats: number;
	seatTypes: SeatType[];
}

@Component({
	selector: 'app-public-select-movie-schedule',
	templateUrl: './public-select-movie-schedule.component.html',
	styleUrls: ['./public-select-movie-schedule.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ButtonModule,
		CalendarModule,
		ChipModule,
		ImageModule,
		DialogModule,
		TagModule,
	],
})
export class PublicSelectMovieScheduleComponent implements OnInit {
	// loading = true;
	// error: string | null = null;

	// movie: Movie | null = null;
	// availableDates: Date[] = [];
	// selectedDate: Date = new Date();
	// cinemaLocations: Theatre[] = [];
	// selectedLocation: Theatre | null = null;
	// showtimes: ShowTime[] = [];
	// selectedShowtime: ShowTime | null = null;

	// // Trailer properties
	// showTrailerDialog = false;
	// safeTrailerUrl: SafeResourceUrl | null = null;

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		// this.route.params.subscribe((params) => {
		// 	const movieId = +params['id'];
		// 	if (movieId) {
		// 		this.loadMovieData(movieId);
		// 	} else {
		// 		this.error = 'Movie not found';
		// 		this.loading = false;
		// 	}
		// });
	}

	// private loadMovieData(movieId: number) {
	// 	this.loading = true;
	// 	this.error = null;

	// 	// Load movie details
	// 	// this.movieService.getMovieById(movieId).subscribe({
	// 	// 	next: (movie) => {
	// 	// 		if (movie) {
	// 	// 			this.movie = movie;
	// 	// 			this.loadAvailableDates();
	// 	// 			this.loadCinemaLocations(movieId);
	// 	// 		} else {
	// 	// 			this.error = 'Movie not found';
	// 	// 			this.loading = false;
	// 	// 		}
	// 	// 	},
	// 	// 	error: (err) => {
	// 	// 		this.error = 'Failed to load movie details';
	// 	// 		this.loading = false;
	// 	// 	},
	// 	// });
	// }

	// private loadAvailableDates() {}

	// private loadCinemaLocations(movieId: number) {}

	// private loadShowtimes() {}

	// selectLocation(location: Theatre) {
	// 	this.selectedLocation = location;
	// 	this.selectedShowtime = null; // Reset showtime selection
	// 	this.loadShowtimes();
	// }

	// selectShowtime(showtime: ShowTime) {
	// 	this.selectedShowtime = showtime;
	// }

	// onDateChange() {
	// 	this.selectedShowtime = null; // Reset showtime selection
	// 	this.loadShowtimes();
	// }

	// formatDate(date: Date): string {
	// 	const today = new Date();
	// 	const tomorrow = new Date(today);
	// 	tomorrow.setDate(today.getDate() + 1);

	// 	if (date.toDateString() === today.toDateString()) {
	// 		return 'Today';
	// 	} else if (date.toDateString() === tomorrow.toDateString()) {
	// 		return 'Tomorrow';
	// 	} else {
	// 		return date.toLocaleDateString('en-US', {
	// 			weekday: 'short',
	// 			month: 'short',
	// 			day: 'numeric',
	// 		});
	// 	}
	// }

	// formatPrice(amount: number): string {
	// 	return `Nu. ${amount}`;
	// }

	// openTrailer() {
	// 	if (this.movie?.trailerUrl) {
	// 		const embedUrl = this.convertToEmbedUrl(this.movie.trailerUrl);
	// 		this.safeTrailerUrl =
	// 			this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
	// 		this.showTrailerDialog = true;
	// 	}
	// }

	// closeTrailer() {
	// 	this.showTrailerDialog = false;
	// 	this.safeTrailerUrl = null;
	// }

	// proceedToBooking() {
	// 	if (this.selectedShowtime && this.movie) {
	// 		this.router.navigate([
	// 			'/select-seats',
	// 			this.selectedShowtime.screeningId,
	// 		]);
	// 	}
	// }

	// private convertToEmbedUrl(youtubeUrl: string): string {
	// 	const regExp =
	// 		/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	// 	const match = youtubeUrl.match(regExp);
	// 	const videoId = match && match[7].length === 11 ? match[7] : null;

	// 	if (videoId) {
	// 		return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
	// 	}
	// 	return youtubeUrl;
	// }
}
