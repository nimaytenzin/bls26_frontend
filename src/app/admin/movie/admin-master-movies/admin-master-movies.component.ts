import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../primeng.modules';
import { MovieApiDataService } from '../../../core/dataservice/movie/movie-api.dataservice';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminMasterMovieCreateComponent } from '../components/admin-master-movie-create/admin-master-movie-create.component';
import { AdminMasterMovieUpdateComponent } from '../components/admin-master-movie-update/admin-master-movie-update.component';
import { AdminMovieMediaUploadComponent } from '../components/admin-movie-media-upload/admin-movie-media-upload.component';
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../core/constants/constants';

@Component({
	selector: 'app-admin-master-movies',
	templateUrl: './admin-master-movies.component.html',
	styleUrls: ['./admin-master-movies.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [DialogService],
})
export class AdminMasterMoviesComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	ref: DynamicDialogRef = new DynamicDialogRef();
	// Data properties
	movies: Movie[] = [];
	loading = false;
	error: string | null = null;

	// UI State
	viewMode: 'grid' | 'list' | 'table' = 'table';

	// Update dialog properties
	showUpdateDialog = false;
	selectedMovieForUpdate: Movie | null = null;

	// View Options
	viewModeOptions = [
		{ label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
		{ label: 'List', value: 'list', icon: 'pi pi-list' },
		{ label: 'Table', value: 'table', icon: 'pi pi-table' },
	];

	constructor(
		private movieApiService: MovieApiDataService,
		private dialogService: DialogService,
		private router: Router
	) {}

	ngOnInit() {
		this.fetchMovies();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	getMediaUrl(uri: string) {
		return `${BASEAPI_URL}/${uri}`;
	}

	/**
	 * Fetch movies from API
	 */
	fetchMovies() {
		this.loading = true;
		this.error = null;

		this.movieApiService
			.findAllMovies()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: any) => {
					console.log('Movies fetched successfully:', response);
					// Handle API response structure
					this.movies = response.data || response || [];
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error fetching movies:', error);
					this.error = 'Failed to load movies. Please try again.';
					this.movies = [];
					this.loading = false;
				},
			});
	}

	/**
	 * Refresh movie list
	 */
	refreshMovies() {
		this.fetchMovies();
	}

	/**
	 * Handle view mode change
	 */
	onViewModeChange() {
		// Optional: Save preference to localStorage
		localStorage.setItem('movieViewMode', this.viewMode);
	}

	/**
	 * Edit movie
	 */
	editMovie(movie: Movie) {
		console.log('Edit movie:', movie.name);
		this.selectedMovieForUpdate = movie;
		this.ref = this.dialogService.open(AdminMasterMovieUpdateComponent, {
			header: `Edit Movie: ${movie.name}`,
			data: { movie },
			dismissableMask: true,
			closable: true,
		});

		this.ref.onClose.subscribe((updatedMovie: Movie) => {
			if (updatedMovie) {
				this.fetchMovies();
			}
		});
	}

	/**
	 * Handle movie update dialog visibility change
	 */
	onUpdateDialogVisibilityChange(visible: boolean) {
		this.showUpdateDialog = visible;
		if (!visible) {
			this.selectedMovieForUpdate = null;
		}
	}

	/**
	 * Handle movie updated event
	 */
	onMovieUpdated(updatedMovie: Movie) {
		// Update the movie in the list
		const index = this.movies.findIndex((m) => m.id === updatedMovie.id);
		if (index !== -1) {
			this.movies[index] = updatedMovie;
		}
		// Optionally refresh the entire list
		this.fetchMovies();
	}

	/**
	 * Delete movie
	 */
	deleteMovie(movie: Movie) {
		if (confirm(`Are you sure you want to delete "${movie.name}"?`)) {
			this.loading = true;
			this.movieApiService
				.deleteMovie(movie.id)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response: any) => {
						console.log('Movie deleted successfully:', response);
						this.fetchMovies(); // Refresh the list
					},
					error: (error: any) => {
						console.error('Error deleting movie:', error);
						this.loading = false;
						alert('Failed to delete movie. Please try again.');
					},
				});
		}
	}

	/**
	 * Add new movie
	 */
	addMovie() {
		console.log('Add new movie');
		this.ref = this.dialogService.open(AdminMasterMovieCreateComponent, {
			header: 'Add Movie',
			dismissableMask: true,
			closable: true,
			width: '90vw',
			height: '90vh',
			styleClass: 'dynamic-dialog',
		});

		// Handle dialog result
		this.ref.onClose.subscribe((newMovie: Movie) => {
			if (newMovie) {
				// Refresh the movies list to include the new movie
				this.fetchMovies();
			}
		});
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

	/**
	 * Format duration
	 */
	formatDuration(minutes: number): string {
		if (!minutes) return 'N/A';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
	}

	/**
	 * Format date
	 */
	formatDate(date: Date | string): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get movie poster URL (first image from media)
	 */
	getMoviePosterUrl(movie: Movie): string | null {
		if (movie.media && movie.media.length > 0) {
			// Find first image media
			const imageMedia = movie.media.find(
				(m: { type: string }) => m.type === 'IMAGE'
			);
			return imageMedia ? this.getMediaUrl(imageMedia.uri) : null;
		}
		return null;
	}

	/**
	 * Check if movie has poster
	 */
	hasMoviePoster(movie: Movie): boolean {
		return this.getMoviePosterUrl(movie) !== null;
	}

	/**
	 * Open media upload dialog
	 */
	openMediaUpload(movie: Movie) {
		console.log('Open media upload for movie:', movie.name);
		this.ref = this.dialogService.open(AdminMovieMediaUploadComponent, {
			header: `Upload Media - ${movie.name}`,
			data: { movie },
			dismissableMask: true,
			closable: true,
			width: '500px',
		});

		this.ref.onClose.subscribe((result) => {
			if (result && result.refresh) {
				// Refresh movies to show updated media
				this.fetchMovies();
			}
		});
	}

	/**
	 * View movie details
	 */
	viewMovieDetails(movie: Movie) {
		console.log('View movie details:', movie.name);
		this.router.navigate(['/admin/master-movies', movie.id]);
	}

	/**
	 * Handle image load error
	 */
	onImageError(event: any) {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}
}
