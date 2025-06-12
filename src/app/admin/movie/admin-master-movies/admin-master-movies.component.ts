import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Subject,
	takeUntil,
	debounceTime,
	distinctUntilChanged,
	switchMap,
	of,
} from 'rxjs';

import { PrimeNgModules } from '../../../primeng.modules';
import {
	IMovie,
	MovieGenre,
	MovieStatus,
	MovieLanguage,
	MovieRating,
	MovieUtils,
	MOCK_MOVIES,
} from '../../../core/dataservice/movie';
import {
	TmdbService,
	TMDBMovie,
} from '../../../core/dataservice/movie/tmdb.service';

interface MovieCard extends TMDBMovie {
	isSelected?: boolean;
	status?: MovieStatus;
	isBookingOpen?: boolean;
	format2D?: boolean;
	format3D?: boolean;
	formatIMAX?: boolean;
	runtime?: number;
}

interface FilterOptions {
	status: MovieStatus | 'all';
	genre: MovieGenre | 'all';
	language: MovieLanguage | 'all';
	rating: MovieRating | 'all';
	format: 'all' | '2D' | '3D' | 'IMAX';
	sortBy: 'title' | 'release_date' | 'popularity' | 'vote_average';
	sortOrder: 'asc' | 'desc';
}

@Component({
	selector: 'app-admin-master-movies',
	templateUrl: './admin-master-movies.component.html',
	styleUrls: ['./admin-master-movies.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
})
export class AdminMasterMoviesComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	tabOptions = [
		{ label: 'Screening', value: 'screeningNow', icon: 'fas fa-building' },
		{ label: 'Upcoming', value: 'upcoming', icon: 'fas fa-door-open' },
		{ label: 'Ended', value: 'ended', icon: 'fas fa-door-open' },
	];

	activeTab: any;

	// Data properties
	movies: MovieCard[] = [];
	filteredMovies: MovieCard[] = [];
	selectedMovies: MovieCard[] = [];
	movieCategories: any = null;
	loading = false;
	searchQuery = '';

	// UI State
	viewMode: 'grid' | 'list' | 'table' = 'grid';
	showFilters = true;
	showBulkActions = false;
	showViewModeToggle = true;
	showAddButton = true;
	currentPage = 1;
	totalRecords = 0;
	pageSize = 20;

	// View Options (similar to hall listing)
	viewModeOptions = [
		{ label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
		{ label: 'List', value: 'list', icon: 'pi pi-list' },
		{ label: 'Table', value: 'table', icon: 'pi pi-table' },
	];

	// UI State properties
	showMovieDetail = false;
	selectedMovie: MovieCard | null = null;
	contextMenuItems: any[] = [];

	// Filter options
	filters: FilterOptions = {
		status: 'all',
		genre: 'all',
		language: 'all',
		rating: 'all',
		format: 'all',
		sortBy: 'popularity',
		sortOrder: 'desc',
	};

	// Dropdown options
	statusOptions = [
		{ label: 'All Status', value: 'all' },
		{ label: 'Now Showing', value: MovieStatus.NOW_SHOWING },
		{ label: 'Coming Soon', value: MovieStatus.COMING_SOON },
		{ label: 'Ended', value: MovieStatus.ENDED },
		{ label: 'Cancelled', value: MovieStatus.CANCELLED },
	];

	genreOptions = [
		{ label: 'All Genres', value: 'all' },
		...Object.values(MovieGenre).map((genre) => ({
			label: genre,
			value: genre,
		})),
	];

	languageOptions = [
		{ label: 'All Languages', value: 'all' },
		...Object.values(MovieLanguage).map((lang) => ({
			label: lang,
			value: lang,
		})),
	];

	ratingOptions = [
		{ label: 'All Ratings', value: 'all' },
		...Object.values(MovieRating).map((rating) => ({
			label: rating,
			value: rating,
		})),
	];

	formatOptions = [
		{ label: 'All Formats', value: 'all' },
		{ label: '2D', value: '2D' },
		{ label: '3D', value: '3D' },
		{ label: 'IMAX', value: 'IMAX' },
	];

	sortOptions = [
		{ label: 'Title', value: 'title' },
		{ label: 'Release Date', value: 'release_date' },
		{ label: 'Popularity', value: 'popularity' },
		{ label: 'Rating', value: 'vote_average' },
	];

	sortOrderOptions = [
		{ label: 'Ascending', value: 'asc' },
		{ label: 'Descending', value: 'desc' },
	];

	// Statistics
	stats = {
		total: 0,
		nowShowing: 0,
		comingSoon: 0,
		ended: 0,
		averageRating: 0,
	};

	// Genre mapping for TMDB genre IDs
	private genreMap = new Map([
		[28, 'Action'],
		[12, 'Adventure'],
		[16, 'Animation'],
		[35, 'Comedy'],
		[80, 'Crime'],
		[99, 'Documentary'],
		[18, 'Drama'],
		[10751, 'Family'],
		[14, 'Fantasy'],
		[36, 'History'],
		[27, 'Horror'],
		[10402, 'Music'],
		[9648, 'Mystery'],
		[10749, 'Romance'],
		[878, 'Science Fiction'],
		[10770, 'TV Movie'],
		[53, 'Thriller'],
		[10752, 'War'],
		[37, 'Western'],
	]);

	constructor(private tmdbService: TmdbService) {}

	ngOnInit() {
		this.initializeData();
		this.setupSearch();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeData() {
		this.loading = true;

		this.tmdbService
			.getAllMovieCategories()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (categories) => {
					this.movieCategories = categories;
					this.processMoviesData(categories);
					this.loading = false;
				},
				error: (error) => {
					console.error('Error fetching movies:', error);
					this.loadFallbackData();
					this.loading = false;
				},
			});
	}

	/**
	 * Process movies data from TMDB
	 */
	private processMoviesData(categories: any) {
		// Combine all movies and remove duplicates
		const allMovies: TMDBMovie[] = [
			...categories.popular,
			...categories.nowPlaying,
			...categories.upcoming,
			...categories.topRated,
		];

		// Remove duplicates by ID
		const uniqueMovies = allMovies.filter(
			(movie, index, self) => index === self.findIndex((m) => m.id === movie.id)
		);

		// Convert to MovieCard format with additional properties
		this.movies = uniqueMovies.map((movie) => ({
			...movie,
			isSelected: false,
			status: this.determineMovieStatus(movie),
			isBookingOpen: Math.random() > 0.3, // Random for demo
			format2D: true,
			format3D: Math.random() > 0.6,
			formatIMAX: Math.random() > 0.7,
			runtime: Math.floor(Math.random() * 60) + 90, // Random runtime 90-150 mins
		}));

		this.totalRecords = this.movies.length;
		this.calculateStats();
		this.applyFilters();
	}

	/**
	 * Load fallback data when API fails
	 */
	private loadFallbackData() {
		// Use mock data as fallback
		this.movies = MOCK_MOVIES.map((movie) => ({
			id: parseInt(movie.id),
			title: movie.title,
			original_title: movie.originalTitle || movie.title,
			overview: movie.description,
			poster_path: movie.posterUrl.replace('/assets/movies/', '/'),
			backdrop_path: movie.backdropUrl?.replace('/assets/movies/', '/') || '',
			release_date: movie.releaseDate.toISOString().split('T')[0],
			genre_ids: [],
			adult: false,
			original_language: movie.language.toLowerCase(),
			popularity: Math.random() * 100,
			vote_average: this.convertRatingToTMDB(movie.ratings.averageRating || 0),
			vote_count: movie.ratings.totalReviews || 0,
			video: false,
			isSelected: false,
			status: movie.status,
			isBookingOpen: movie.isBookingOpen,
			format2D: movie.format2D,
			format3D: movie.format3D,
			formatIMAX: movie.formatIMAX,
			runtime: movie.duration || Math.floor(Math.random() * 60) + 90,
		}));

		this.totalRecords = this.movies.length;
		this.calculateStats();
		this.applyFilters();
	}

	/**
	 * Setup search functionality with debounce
	 */
	private setupSearch() {
		this.searchSubject
			.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
			.subscribe((query) => {
				this.searchQuery = query;
				this.applyFilters();
			});
	}

	/**
	 * Handle search input
	 */
	onSearch(event: any) {
		this.searchSubject.next(event.target.value);
	}

	/**
	 * Apply filters and search
	 */
	applyFilters() {
		let filtered = [...this.movies];

		// Search filter
		if (this.searchQuery) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(movie) =>
					movie.title.toLowerCase().includes(query) ||
					movie.overview.toLowerCase().includes(query) ||
					movie.original_title.toLowerCase().includes(query)
			);
		}

		// Status filter
		if (this.filters.status !== 'all') {
			filtered = filtered.filter(
				(movie) => movie.status === this.filters.status
			);
		}

		// Sort
		filtered.sort((a, b) => {
			let comparison = 0;

			switch (this.filters.sortBy) {
				case 'title':
					comparison = a.title.localeCompare(b.title);
					break;
				case 'release_date':
					comparison =
						new Date(a.release_date).getTime() -
						new Date(b.release_date).getTime();
					break;
				case 'popularity':
					comparison = a.popularity - b.popularity;
					break;
				case 'vote_average':
					comparison = a.vote_average - b.vote_average;
					break;
			}

			return this.filters.sortOrder === 'desc' ? -comparison : comparison;
		});

		this.filteredMovies = filtered;
	}

	/**
	 * Calculate statistics
	 */
	private calculateStats() {
		this.stats = {
			total: this.movies.length,
			nowShowing: this.movies.filter(
				(m) => m.status === MovieStatus.NOW_SHOWING
			).length,
			comingSoon: this.movies.filter(
				(m) => m.status === MovieStatus.COMING_SOON
			).length,
			ended: this.movies.filter((m) => m.status === MovieStatus.ENDED).length,
			averageRating:
				this.movies.reduce((sum, m) => sum + m.vote_average, 0) /
				this.movies.length,
		};
	}

	/**
	 * Determine movie status based on release date
	 */
	private determineMovieStatus(movie: TMDBMovie): MovieStatus {
		const releaseDate = new Date(movie.release_date);
		const now = new Date();
		const diffTime = releaseDate.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays > 30) {
			return MovieStatus.COMING_SOON;
		} else if (diffDays >= -90) {
			return MovieStatus.NOW_SHOWING;
		} else {
			return MovieStatus.ENDED;
		}
	}

	/**
	 * Convert 5-star rating to 10-point TMDB scale
	 */
	private convertRatingToTMDB(rating: number): number {
		return rating * 2;
	}

	/**
	 * Toggle filters visibility
	 */
	toggleFilters() {
		this.showFilters = !this.showFilters;
	}

	/**
	 * Get active filters count
	 */
	getActiveFiltersCount(): number {
		let count = 0;
		if (this.filters.status !== 'all') count++;
		if (this.filters.genre !== 'all') count++;
		if (this.filters.language !== 'all') count++;
		if (this.filters.rating !== 'all') count++;
		if (this.filters.format !== 'all') count++;
		return count;
	}

	/**
	 * Clear selection
	 */
	clearSelection() {
		this.selectedMovies = [];
		this.movies.forEach((movie) => (movie.isSelected = false));
		this.showBulkActions = false;
	}

	/**
	 * Toggle movie selection
	 */
	toggleMovieSelection(movieId: number) {
		const movie = this.movies.find((m) => m.id === movieId);
		if (movie) {
			movie.isSelected = !movie.isSelected;
			this.selectedMovies = this.movies.filter((m) => m.isSelected);
			this.showBulkActions = this.selectedMovies.length > 0;
		}
	}

	/**
	 * Show movie context menu
	 */
	showMovieMenu(event: Event, movie: MovieCard) {
		// TODO: Implement context menu
		console.log('Show menu for:', movie.title);
	}

	/**
	 * Bulk update status
	 */
	bulkUpdateStatus(status: string) {
		this.selectedMovies.forEach((movie) => {
			movie.status = status as MovieStatus;
		});
		this.clearSelection();
		console.log('Bulk status update to:', status);
	}

	/**
	 * Bulk delete movies
	 */
	bulkDeleteMovies() {
		if (
			confirm(
				`Are you sure you want to delete ${this.selectedMovies.length} movies?`
			)
		) {
			const selectedIds = this.selectedMovies.map((m) => m.id);
			this.movies = this.movies.filter(
				(movie) => !selectedIds.includes(movie.id)
			);
			this.clearSelection();
			this.applyFilters();
			console.log('Bulk delete completed');
		}
	}

	/**
	 * Handle movie selection change
	 */
	onMovieSelectionChange(movie: MovieCard) {
		this.selectedMovies = this.movies.filter((m) => m.isSelected);
		this.showBulkActions = this.selectedMovies.length > 0;
	}

	/**
	 * Handle view mode change
	 */
	onViewModeChange() {
		// Optional: Save preference to localStorage
		localStorage.setItem('movieViewMode', this.viewMode);
	}

	/**
	 * Clear search
	 */
	clearSearch() {
		this.searchQuery = '';
		this.applyFilters();
	}

	/**
	 * Clear all filters
	 */
	clearFilters() {
		this.filters = {
			status: 'all',
			genre: 'all',
			language: 'all',
			rating: 'all',
			format: 'all',
			sortBy: 'popularity',
			sortOrder: 'desc',
		};
		this.applyFilters();
	}

	/**
	 * View movie details
	 */
	viewMovie(movie: MovieCard) {
		this.selectedMovie = movie;
		this.showMovieDetail = true;
	}

	/**
	 * Close movie detail dialog
	 */
	closeMovieDetail() {
		this.showMovieDetail = false;
		this.selectedMovie = null;
	}

	/**
	 * Edit movie
	 */
	editMovie(movie: MovieCard) {
		// TODO: Implement edit movie dialog/form
		console.log('Edit movie:', movie.title);
	}

	/**
	 * Add new movie
	 */
	addMovie() {
		// TODO: Implement add movie dialog/form
		console.log('Add new movie');
	}

	/**
	 * Duplicate movie
	 */
	duplicateMovie(movie: MovieCard) {
		const duplicatedMovie: MovieCard = {
			...movie,
			id: Math.max(...this.movies.map((m) => m.id)) + 1,
			title: `${movie.title} (Copy)`,
			isSelected: false,
		};

		this.movies.unshift(duplicatedMovie);
		this.calculateStats();
		this.applyFilters();
	}

	/**
	 * Import movies
	 */
	importMovies() {
		// TODO: Implement import functionality
		console.log('Import movies');
	}

	/**
	 * Export movies
	 */
	exportMovies() {
		// TODO: Implement export functionality
		const dataStr = JSON.stringify(this.movies, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'movies-export.json';
		link.click();

		URL.revokeObjectURL(url);
	}

	/**
	 * Bulk edit status
	 */
	bulkEditStatus() {
		// TODO: Implement bulk status edit dialog
		console.log('Bulk edit status for', this.selectedMovies.length, 'movies');
	}

	/**
	 * Bulk duplicate
	 */
	bulkDuplicate() {
		const duplicatedMovies = this.selectedMovies.map((movie) => ({
			...movie,
			id: Math.max(...this.movies.map((m) => m.id)) + Math.random(),
			title: `${movie.title} (Copy)`,
			isSelected: false,
		}));

		this.movies.unshift(...duplicatedMovies);
		this.clearSelection();
		this.calculateStats();
		this.applyFilters();
	}

	/**
	 * Bulk delete
	 */
	bulkDelete() {
		if (
			confirm(
				`Are you sure you want to delete ${this.selectedMovies.length} movies?`
			)
		) {
			const selectedIds = this.selectedMovies.map((m) => m.id);
			this.movies = this.movies.filter((m) => !selectedIds.includes(m.id));
			this.clearSelection();
			this.calculateStats();
			this.applyFilters();
		}
	}

	/**
	 * Individual movie actions - deleteMovie method
	 */
	deleteMovie(movie: MovieCard) {
		const index = this.movies.findIndex((m) => m.id === movie.id);
		if (index > -1) {
			this.movies.splice(index, 1);
			this.calculateStats();
			this.applyFilters();
		}
	}

	toggleMovieStatus(movie: MovieCard) {
		const statuses = Object.values(MovieStatus);
		const currentIndex = statuses.indexOf(movie.status!);
		const nextIndex = (currentIndex + 1) % statuses.length;
		movie.status = statuses[nextIndex];
		this.calculateStats();
	}

	toggleBookingStatus(movie: MovieCard) {
		movie.isBookingOpen = !movie.isBookingOpen;
	}

	/**
	 * Refresh data
	 */
	refreshData() {
		this.initializeData();
	}

	// Template compatibility methods (matching the new template structure)

	/**
	 * Handle search input change
	 */
	onSearchChange() {
		this.applyFilters();
	}

	/**
	 * View movie (alias for viewMovie)
	 */
	onMovieView(movie: MovieCard) {
		this.viewMovie(movie);
	}

	/**
	 * Edit movie (alias for editMovie)
	 */
	onMovieEdit(movie: MovieCard) {
		this.editMovie(movie);
	}

	/**
	 * Delete movie (alias for deleteMovie)
	 */
	onMovieDelete(movie: MovieCard) {
		if (confirm(`Are you sure you want to delete "${movie.title}"?`)) {
			this.deleteMovie(movie);
		}
	}

	/**
	 * Check if movie is selected
	 */
	isSelected(movieId: number): boolean {
		return this.movies.find((m) => m.id === movieId)?.isSelected || false;
	}

	/**
	 * Toggle movie selection
	 */
	toggleSelection(movieId: number) {
		const movie = this.movies.find((m) => m.id === movieId);
		if (movie) {
			movie.isSelected = !movie.isSelected;
			this.selectedMovies = this.movies.filter((m) => m.isSelected);
			this.showBulkActions = this.selectedMovies.length > 0;
		}
	}

	/**
	 * Check if all items are selected
	 */
	areAllItemsSelected(): boolean {
		return (
			this.filteredMovies.length > 0 &&
			this.filteredMovies.every((movie) => movie.isSelected)
		);
	}

	/**
	 * Toggle all selection
	 */
	toggleAllSelection() {
		const allSelected = this.areAllItemsSelected();
		this.filteredMovies.forEach((movie) => {
			movie.isSelected = !allSelected;
		});
		this.selectedMovies = this.movies.filter((m) => m.isSelected);
		this.showBulkActions = this.selectedMovies.length > 0;
	}

	// Helper methods for template

	/**
	 * Get poster URL for TMDB image
	 */
	getPosterUrl(posterPath: string): string {
		return posterPath.startsWith('http')
			? posterPath
			: `https://image.tmdb.org/t/p/w500${posterPath}`;
	}

	/**
	 * Get rating severity for p-tag styling
	 */
	getRatingSeverity(rating: number): string {
		if (rating >= 8) return 'success';
		if (rating >= 7) return 'info';
		if (rating >= 6) return 'warning';
		return 'danger';
	}

	/**
	 * Get genre names from genre IDs
	 */
	getGenreNames(genreIds: number[]): string[] {
		if (!genreIds || genreIds.length === 0) return [];
		return genreIds
			.map((id) => this.genreMap.get(id) || 'Unknown')
			.filter(Boolean);
	}

	/**
	 * Get movie status display string
	 */
	getMovieStatus(movie: MovieCard): string {
		return movie.status || MovieStatus.COMING_SOON;
	}

	/**
	 * Get status severity for p-tag styling
	 */
	getStatusSeverity(status: string): string {
		switch (status) {
			case MovieStatus.NOW_SHOWING:
				return 'success';
			case MovieStatus.COMING_SOON:
				return 'info';
			case MovieStatus.ENDED:
				return 'warning';
			case MovieStatus.CANCELLED:
				return 'danger';
			default:
				return 'secondary';
		}
	}

	/**
	 * TrackBy function for *ngFor performance optimization
	 */
	trackByMovieId(index: number, movie: MovieCard): number {
		return movie.id;
	}
}
