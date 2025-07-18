import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../primeng.modules';
import { SeatSelectionComponent } from '../../../shared/components/seat-selection';
import { ScreeningDataService } from '../../../../core/dataservice/screening/screening.dataservice';
import { MovieApiDataService } from '../../../../core/dataservice/movie/movie-api.dataservice';
import { SessionService } from '../../../../core/dataservice/session.service';

import { Screening } from '../../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { GETMEDIAURL } from '../../../../core/utility/utility.service';

@Component({
	selector: 'app-counter-staff-sell-tickets',
	templateUrl: './counter-staff-sell-tickets.component.html',
	styleUrls: ['./counter-staff-sell-tickets.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules, SeatSelectionComponent],
	providers: [MessageService],
})
export class CounterStaffSellTicketsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	movies: Movie[] = [];
	selectedMovie: Movie | null = null;
	screenings: Screening[] = [];
	selectedScreening: Screening | null = null;

	// UI State
	loading = false;
	loadingSchedules = false;
	currentStep: 'movie-selection' | 'screening-selection' | 'booking' =
		'movie-selection';

	// Search and filters
	movieSearchTerm = '';
	filteredMovies: Movie[] = [];

	constructor(
		private screeningService: ScreeningDataService,
		private movieService: MovieApiDataService,
		private sessionService: SessionService,
		private messageService: MessageService,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		this.loadMovies();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		this.sessionService.endSession();
	}

	private loadMovies(): void {
		this.loading = true;
		this.movieService
			.findAllMoviesScreeningNow()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (res: Movie[]) => {
					this.movies = res;
					this.filteredMovies = [...this.movies];
					this.loading = false;
					console.log('Movies loaded:', this.movies.length);
				},
				error: (error: any) => {
					console.error('❌ Error loading movies:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load movies. Please try again.',
					});
				},
			});
	}

	selectMovie(movie: Movie): void {
		this.selectedMovie = movie;
		this.loadSchedulesForMovie(movie.id);
		this.currentStep = 'screening-selection';
	}

	private loadSchedulesForMovie(movieId: number): void {
		this.loadingSchedules = true;

		this.screeningService
			.findAllValidScreeningByMovieId(movieId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: Screening[]) => {
					this.screenings = response;
					this.loadingSchedules = false;
					console.log('Schedules loaded:', this.screenings.length);
				},
				error: (error: any) => {
					console.error('❌ Error loading schedules:', error);
					this.loadingSchedules = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load schedules. Please try again.',
					});
				},
			});
	}

	selectScreening(screening: Screening): void {
		this.selectedScreening = screening;
		this.currentStep = 'booking';
	}

	/**
	 * Go back to movie selection
	 */
	backToMovieSelection(): void {
		this.selectedMovie = null;
		this.screenings = [];
		this.selectedScreening = null;
		this.currentStep = 'movie-selection';
	}

	/**
	 * Go back to screening selection
	 */
	backToScreeningSelection(): void {
		this.selectedScreening = null;
		this.currentStep = 'screening-selection';
	}

	/**
	 * Start a new booking flow
	 */
	startNewBooking(): void {
		this.selectedMovie = null;
		this.screenings = [];
		this.selectedScreening = null;
		this.currentStep = 'movie-selection';
	}

	/**
	 * Filter movies based on search term
	 */
	filterMovies(): void {
		if (!this.movieSearchTerm.trim()) {
			this.filteredMovies = [...this.movies];
		} else {
			const searchTerm = this.movieSearchTerm.toLowerCase();
			this.filteredMovies = this.movies.filter(
				(movie) =>
					movie.name.toLowerCase().includes(searchTerm) ||
					movie.genres?.some((g: any) =>
						g.name.toLowerCase().includes(searchTerm)
					)
			);
		}
	}

	/**
	 * Get poster URL for movie
	 */
	getPosterUrl(movie: Movie): string {
		if (movie.media && movie.media.length > 0) {
			const poster = movie.media.find(
				(media: any) =>
					media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
			);
			if (poster) {
				return GETMEDIAURL(poster.uri);
			}
		}
		return 'assets/images/default-poster.jpg';
	}

	/**
	 * Format screening time for display
	 */
	formatScreeningTime(screening: Screening): string {
		return `${screening.startTime} - ${screening.endTime}`;
	}

	/**
	 * Format screening date for display
	 */
	formatScreeningDate(screening: Screening): string {
		return new Date(screening.date).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	/**
	 * Get genre names as comma-separated string
	 */
	getGenreNames(movie: Movie): string {
		if (movie.genres && movie.genres.length > 0) {
			return movie.genres.map((g: any) => g.name).join(', ');
		}
		return '';
	}

	/**
	 * Get theatre name from screening
	 */
	getTheatreName(screening: Screening): string {
		return screening.hall?.theatre?.name || 'N/A';
	}

	/**
	 * Get hall name from screening
	 */
	getHallName(screening: Screening): string {
		return screening.hall?.name || 'N/A';
	}

	/**
	 * Get audio language name
	 */
	getAudioLanguageName(screening: Screening): string {
		return screening.audioLanguage?.name || '';
	}

	/**
	 * Get subtitle language name
	 */
	getSubtitleLanguageName(screening: Screening): string {
		return screening.subtitleLanguage?.name || '';
	}
}
