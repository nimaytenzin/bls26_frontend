import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { PrimeNgModules } from '../../../../primeng.modules';
import { MovieApiDataService } from '../../../../core/dataservice/movie/movie-api.dataservice';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { BASEAPI_URL } from '../../../../core/constants/constants';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminMovieDetailsMediaTabComponent } from '../components/admin-movie-details-media-tab/admin-movie-details-media-tab.component';
import { AdminMovieStatisticsComponent } from '../components/admin-movie-statistics/admin-movie-statistics.component';
import { MovieStatistics } from '../../../../core/dataservice/statistics/statistics.interface';
import { StatisticsDataService } from '../../../../core/dataservice/statistics/statistics.dataservice';

@Component({
	selector: 'app-admin-movie-detail',
	templateUrl: './admin-movie-detail.component.html',
	styleUrls: ['./admin-movie-detail.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		PrimeNgModules,
		AdminMovieDetailsMediaTabComponent,
		AdminMovieStatisticsComponent,
	],
})
export class AdminMovieDetailComponent implements OnInit {
	// Data properties
	movie: Movie | null = null;
	loading = false;
	error: string | null = null;

	// Trailer properties
	showTrailerDialog = false;
	safeTrailerUrl: SafeResourceUrl | null = null;

	// Tab properties
	activeTabIndex = 0;
	// Edit mode
	showEditDialog = false;
	editMovie: Movie | null = null;

	// Media upload
	isUploadingMedia = false;
	selectedMediaFiles: File[] = [];
	mediaUploadProgress = 0;

	// Screening properties (for second tab)
	screenings: any[] = [];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private movieApiService: MovieApiDataService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		// Get movie ID from route
		const movieId = this.route.snapshot.paramMap.get('id');

		// Check for route data to determine initial mode
		const routeData = this.route.snapshot.data;
		if (routeData['editMode']) {
			// Will open edit dialog after movie loads
		} else if (routeData['mediaMode']) {
			this.activeTabIndex = 2; // Media upload tab
		}

		if (movieId) {
			this.loadMovieDetails(parseInt(movieId));
		} else {
			this.error = 'Movie ID not found';
		}
	}

	/**
	 * Load movie details by ID
	 */
	loadMovieDetails(movieId: number) {
		this.loading = true;
		this.error = null;

		this.movieApiService.findMovieById(movieId).subscribe({
			next: (response: any) => {
				console.log('Movie details loaded:', response);
				this.movie = response.data || response;
				this.loading = false;
			},
			error: (error: any) => {
				console.error('Error loading movie details:', error);
				this.error = 'Failed to load movie details. Please try again.';
				this.loading = false;
			},
		});
	}

	/**
	 * Get media URL
	 */
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Open trailer dialog
	 */
	openTrailer() {
		if (this.movie?.trailerURL) {
			// Convert YouTube URL to embed format
			let embedUrl = this.movie.trailerURL;
			if (embedUrl.includes('youtube.com/watch?v=')) {
				const videoId = embedUrl.split('v=')[1].split('&')[0];
				embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
			} else if (embedUrl.includes('youtu.be/')) {
				const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
				embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
			}

			this.safeTrailerUrl =
				this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
			this.showTrailerDialog = true;
		}
	}

	/**
	 * Close trailer dialog
	 */
	closeTrailer() {
		this.showTrailerDialog = false;
		this.safeTrailerUrl = null;
	}

	/**
	 * Navigate back to movies list
	 */
	goBack() {
		this.router.navigate(['/admin/master-movies']);
	}

	/**
	 * Get media type display text
	 */
	getMediaTypeText(type: string): string {
		switch (type) {
			case 'IMAGE':
				return 'Image';
			case 'VIDEO':
				return 'Video';
			default:
				return type;
		}
	}

	/**
	 * Get media type icon
	 */
	getMediaTypeIcon(type: string): string {
		switch (type) {
			case 'IMAGE':
				return 'pi pi-image';
			case 'VIDEO':
				return 'pi pi-video';
			default:
				return 'pi pi-file';
		}
	}

	/**
	 * Get orientation display text
	 */
	getOrientationText(orientation: string): string {
		switch (orientation) {
			case 'LANDSCAPE':
				return 'Landscape';
			case 'PORTRAIT':
				return 'Portrait';
			default:
				return orientation;
		}
	}

	/**
	 * Get orientation icon
	 */
	getOrientationIcon(orientation: string): string {
		switch (orientation) {
			case 'LANDSCAPE':
				return 'pi pi-arrow-right';
			case 'PORTRAIT':
				return 'pi pi-arrow-down';
			default:
				return 'pi pi-arrows-alt';
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
		return new Date(date).toLocaleDateString();
	}

	/**
	 * Format date for media posts (Instagram-style)
	 */
	formatMediaDate(date: Date | string): string {
		if (!date) return 'Recently';

		const now = new Date();
		const mediaDate = new Date(date);
		const diffTime = Math.abs(now.getTime() - mediaDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 1) return '1 day ago';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;

		return `${Math.ceil(diffDays / 365)} years ago`;
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
	 * Handle image load error
	 */
	onImageError(event: any) {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	/**
	 * Handle video load error
	 */
	onVideoError(event: any) {
		const videoElement = event.target as HTMLVideoElement;
		if (videoElement) {
			videoElement.style.display = 'none';

			// Create a fallback element
			const fallback = document.createElement('div');
			fallback.className =
				'w-full h-full bg-gray-200 flex items-center justify-center';
			fallback.innerHTML =
				'<i class="pi pi-video text-2xl text-gray-500"></i><span class="ml-2 text-gray-500">Video unavailable</span>';

			// Replace the video with the fallback
			if (videoElement.parentNode) {
				videoElement.parentNode.insertBefore(fallback, videoElement);
			}
		}
	}

	/**
	 * Get random number for Instagram-style likes/views
	 */
	getRandomNumber(base: number, range: number): number {
		return base + Math.floor(Math.random() * range);
	}

	/**
	 * Create new Date for template use
	 */
	getCurrentDate(): Date {
		return new Date();
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
	 * Toggle edit mode
	 */
	toggleEditMode(): void {
		if (this.movie) {
			// Create a copy for editing
			this.editMovie = { ...this.movie };
			this.showEditDialog = true;
		}
	}

	/**
	 * Cancel editing
	 */
	cancelEdit(): void {
		this.showEditDialog = false;
		this.editMovie = null;
	}

	/**
	 * Save movie changes
	 */
	saveMovie(): void {
		if (!this.editMovie) return;

		this.loading = true;

		// Convert Movie to UpdateMovieDto
		const updateData: any = {
			name: this.editMovie.name,
			description: this.editMovie.description,
			pgRating: this.editMovie.pgRating,
			durationMin: this.editMovie.durationMin,
			releaseDate: this.editMovie.releaseDate
				? this.editMovie.releaseDate instanceof Date
					? this.editMovie.releaseDate.toISOString().split('T')[0]
					: this.editMovie.releaseDate
				: undefined,
			trailerURL: this.editMovie.trailerURL,
			productionHouse: this.editMovie.productionHouse,
			screeningStatus: this.editMovie.screeningStatus,
			genreIds: this.editMovie.genres?.map((g) => g.id) || [],
			languageIds: this.editMovie.languages?.map((l) => l.id) || [],
			subtitleLanguageIds:
				this.editMovie.subtitleLanguages?.map((s) => s.id) || [],
		};

		this.movieApiService.updateMovie(this.editMovie.id, updateData).subscribe({
			next: (response: any) => {
				this.movie = response.data || response;
				this.showEditDialog = false;
				this.editMovie = null;
				this.loading = false;
				// Show success message
			},
			error: (error: any) => {
				console.error('Error updating movie:', error);
				this.error = 'Failed to update movie. Please try again.';
				this.loading = false;
			},
		});
	}

	/**
	 * Handle media file selection
	 */
	onMediaFilesSelected(event: any): void {
		const files = Array.from(event.target.files) as File[];
		this.selectedMediaFiles = files;
	}

	/**
	 * Upload selected media files
	 */
	uploadMedia(): void {
		if (!this.movie || this.selectedMediaFiles.length === 0) return;

		this.isUploadingMedia = true;
		this.mediaUploadProgress = 0;

		// Simulate upload progress (replace with actual upload logic)
		const progressInterval = setInterval(() => {
			this.mediaUploadProgress += 10;
			if (this.mediaUploadProgress >= 100) {
				clearInterval(progressInterval);
				this.isUploadingMedia = false;
				this.selectedMediaFiles = [];
				this.mediaUploadProgress = 0;
				// Reload movie details to get updated media
				this.loadMovieDetails(this.movie!.id);
			}
		}, 500);
	}

	/**
	 * Remove selected media file
	 */
	removeSelectedFile(index: number): void {
		this.selectedMediaFiles.splice(index, 1);
	}

	/**
	 * Navigate to movie edit page
	 */
	editMovieDetails(): void {
		this.router.navigate(['/admin/master-movies', this.movie?.id, 'edit']);
	}

	/**
	 * Navigate to media management page
	 */
	manageMedia(): void {
		this.router.navigate(['/admin/master-movies', this.movie?.id, 'media']);
	}

	/**
	 * Navigate to screenings page
	 */
	viewScreenings(): void {
		this.router.navigate(['/admin/master-screenings'], {
			queryParams: { movieId: this.movie?.id },
		});
	}

	/**
	 * Navigate to bookings page
	 */
	viewBookings(): void {
		this.router.navigate(['/admin/master-bookings'], {
			queryParams: { movieId: this.movie?.id },
		});
	}
}
