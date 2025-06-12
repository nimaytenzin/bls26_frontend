import {
	IMovie,
	MovieGenre,
	MovieRating,
	MovieStatus,
	MovieLanguage,
} from './movie.dto';

// Movie utility functions
export class MovieUtils {
	/**
	 * Format movie duration from minutes to hours and minutes
	 * @param minutes - Duration in minutes
	 * @returns Formatted duration string (e.g., "2h 30min")
	 */
	static formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours === 0) {
			return `${minutes}min`;
		}

		if (remainingMinutes === 0) {
			return `${hours}h`;
		}

		return `${hours}h ${remainingMinutes}min`;
	}

	/**
	 * Get movie status color for UI
	 * @param status - Movie status
	 * @returns CSS color class or hex color
	 */
	static getStatusColor(status: MovieStatus): string {
		switch (status) {
			case MovieStatus.NOW_SHOWING:
				return '#10B981'; // Green
			case MovieStatus.COMING_SOON:
				return '#F59E0B'; // Amber
			case MovieStatus.ENDED:
				return '#6B7280'; // Gray
			case MovieStatus.CANCELLED:
				return '#EF4444'; // Red
			default:
				return '#6B7280';
		}
	}

	/**
	 * Get rating color based on score
	 * @param rating - Rating score (0-10 or 0-100)
	 * @param scale - Rating scale ('10' for IMDB, '100' for RT)
	 * @returns CSS color
	 */
	static getRatingColor(rating: number, scale: '10' | '100' = '10'): string {
		const normalizedRating = scale === '100' ? rating / 10 : rating;

		if (normalizedRating >= 8) return '#10B981'; // Green - Excellent
		if (normalizedRating >= 7) return '#84CC16'; // Lime - Very Good
		if (normalizedRating >= 6) return '#F59E0B'; // Amber - Good
		if (normalizedRating >= 5) return '#F97316'; // Orange - Average
		return '#EF4444'; // Red - Poor
	}

	/**
	 * Check if movie is currently showing
	 * @param movie - Movie object
	 * @returns True if movie is currently showing
	 */
	static isCurrentlyShowing(movie: IMovie): boolean {
		const now = new Date();
		const releaseDate = new Date(movie.releaseDate);
		const endDate = movie.endDate ? new Date(movie.endDate) : null;

		return (
			movie.status === MovieStatus.NOW_SHOWING &&
			releaseDate <= now &&
			(!endDate || endDate >= now)
		);
	}

	/**
	 * Check if movie booking is available
	 * @param movie - Movie object
	 * @returns True if booking is available
	 */
	static isBookingAvailable(movie: IMovie): boolean {
		return (
			movie.isBookingOpen &&
			movie.status === MovieStatus.NOW_SHOWING &&
			this.isCurrentlyShowing(movie)
		);
	}

	/**
	 * Get movie formats as array
	 * @param movie - Movie object
	 * @returns Array of available formats
	 */
	static getAvailableFormats(movie: IMovie): string[] {
		const formats: string[] = [];
		if (movie.format2D) formats.push('2D');
		if (movie.format3D) formats.push('3D');
		if (movie.formatIMAX) formats.push('IMAX');
		if (movie.formatDolbyAtmos) formats.push('Dolby Atmos');
		return formats;
	}

	/**
	 * Calculate average rating from all sources
	 * @param ratings - Movie ratings object
	 * @returns Average rating on 10-point scale
	 */
	static calculateAverageRating(ratings: IMovie['ratings']): number {
		const scores: number[] = [];

		if (ratings.imdb && ratings.imdb > 0) {
			scores.push(ratings.imdb);
		}

		if (ratings.rottenTomatoes && ratings.rottenTomatoes > 0) {
			scores.push(ratings.rottenTomatoes / 10); // Convert to 10-point scale
		}

		if (ratings.metacritic && ratings.metacritic > 0) {
			scores.push(ratings.metacritic / 10); // Convert to 10-point scale
		}

		if (ratings.averageRating && ratings.averageRating > 0) {
			scores.push(ratings.averageRating * 2); // Convert 5-point to 10-point scale
		}

		return scores.length > 0
			? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
					10
			: 0;
	}

	/**
	 * Get primary genre from genres array
	 * @param genres - Array of movie genres
	 * @returns Primary genre or first genre
	 */
	static getPrimaryGenre(genres: MovieGenre[]): MovieGenre | null {
		return genres.length > 0 ? genres[0] : null;
	}

	/**
	 * Filter movies by criteria
	 * @param movies - Array of movies
	 * @param filters - Filter criteria
	 * @returns Filtered movies
	 */
	static filterMovies(
		movies: IMovie[],
		filters: {
			status?: MovieStatus;
			genre?: MovieGenre;
			language?: MovieLanguage;
			rating?: MovieRating;
			searchQuery?: string;
		}
	): IMovie[] {
		return movies.filter((movie) => {
			// Status filter
			if (filters.status && movie.status !== filters.status) {
				return false;
			}

			// Genre filter
			if (filters.genre && !movie.genres.includes(filters.genre)) {
				return false;
			}

			// Language filter
			if (filters.language && movie.language !== filters.language) {
				return false;
			}

			// Rating filter
			if (filters.rating && movie.rating !== filters.rating) {
				return false;
			}

			// Search query filter
			if (filters.searchQuery) {
				const query = filters.searchQuery.toLowerCase();
				const searchableText = [
					movie.title,
					movie.description,
					movie.director.join(' '),
					movie.cast.map((c) => c.name).join(' '),
					movie.genres.join(' '),
				]
					.join(' ')
					.toLowerCase();

				if (!searchableText.includes(query)) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Sort movies by criteria
	 * @param movies - Array of movies
	 * @param sortBy - Sort criteria
	 * @param order - Sort order
	 * @returns Sorted movies
	 */
	static sortMovies(
		movies: IMovie[],
		sortBy: 'title' | 'releaseDate' | 'rating' | 'popularity' = 'title',
		order: 'asc' | 'desc' = 'asc'
	): IMovie[] {
		return [...movies].sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case 'title':
					comparison = a.title.localeCompare(b.title);
					break;
				case 'releaseDate':
					comparison =
						new Date(a.releaseDate).getTime() -
						new Date(b.releaseDate).getTime();
					break;
				case 'rating':
					const ratingA = this.calculateAverageRating(a.ratings);
					const ratingB = this.calculateAverageRating(b.ratings);
					comparison = ratingA - ratingB;
					break;
				case 'popularity':
					// Use total reviews as popularity metric
					const popularityA = a.ratings.totalReviews || 0;
					const popularityB = b.ratings.totalReviews || 0;
					comparison = popularityA - popularityB;
					break;
			}

			return order === 'desc' ? -comparison : comparison;
		});
	}

	/**
	 * Get movie age restriction text
	 * @param rating - Movie rating
	 * @returns Age restriction description
	 */
	static getAgeRestrictionText(rating: MovieRating): string {
		switch (rating) {
			case MovieRating.G:
				return 'All ages';
			case MovieRating.PG:
				return 'Parental guidance suggested';
			case MovieRating.PG_13:
				return '13+ with parental guidance';
			case MovieRating.R:
				return '17+ restricted';
			case MovieRating.NC_17:
				return '18+ adults only';
			case MovieRating.U:
				return 'Universal - suitable for all';
			case MovieRating.UA:
				return '12+ with parental guidance';
			case MovieRating.A:
				return '18+ adults only';
			default:
				return 'Not rated';
		}
	}

	/**
	 * Generate movie SEO keywords
	 * @param movie - Movie object
	 * @returns Array of SEO keywords
	 */
	static generateSEOKeywords(movie: IMovie): string[] {
		const keywords = [
			movie.title,
			...movie.genres,
			...movie.director,
			...movie.cast.slice(0, 5).map((c) => c.name), // Top 5 cast members
			movie.language,
			movie.country,
			...movie.productionCompany,
			`${new Date(movie.releaseDate).getFullYear()} movie`,
			'movie tickets',
			'book tickets',
			'cinema',
		];

		return [...new Set(keywords)]; // Remove duplicates
	}
}

// Constants for movie-related operations
export const MOVIE_CONSTANTS = {
	MAX_TITLE_LENGTH: 200,
	MAX_DESCRIPTION_LENGTH: 2000,
	MAX_SYNOPSIS_LENGTH: 1000,
	MAX_TAGLINE_LENGTH: 100,
	MIN_DURATION: 30, // 30 minutes
	MAX_DURATION: 300, // 5 hours
	MAX_CAST_MEMBERS: 50,
	MAX_CREW_MEMBERS: 100,
	MAX_GENRES: 5,
	MAX_GALLERY_IMAGES: 20,
	MAX_TRAILERS: 10,
	DEFAULT_POSTER_URL: '/assets/images/default-movie-poster.jpg',
	DEFAULT_BACKDROP_URL: '/assets/images/default-movie-backdrop.jpg',
};

// Validation utilities
export class MovieValidationUtils {
	/**
	 * Validate movie title
	 */
	static validateTitle(title: string): string[] {
		const errors: string[] = [];

		if (!title || title.trim().length === 0) {
			errors.push('Title is required');
		} else if (title.length > MOVIE_CONSTANTS.MAX_TITLE_LENGTH) {
			errors.push(
				`Title must be less than ${MOVIE_CONSTANTS.MAX_TITLE_LENGTH} characters`
			);
		}

		return errors;
	}

	/**
	 * Validate movie duration
	 */
	static validateDuration(duration: number): string[] {
		const errors: string[] = [];

		if (!duration || duration < MOVIE_CONSTANTS.MIN_DURATION) {
			errors.push(
				`Duration must be at least ${MOVIE_CONSTANTS.MIN_DURATION} minutes`
			);
		} else if (duration > MOVIE_CONSTANTS.MAX_DURATION) {
			errors.push(
				`Duration cannot exceed ${MOVIE_CONSTANTS.MAX_DURATION} minutes`
			);
		}

		return errors;
	}

	/**
	 * Validate movie genres
	 */
	static validateGenres(genres: MovieGenre[]): string[] {
		const errors: string[] = [];

		if (!genres || genres.length === 0) {
			errors.push('At least one genre is required');
		} else if (genres.length > MOVIE_CONSTANTS.MAX_GENRES) {
			errors.push(`Cannot have more than ${MOVIE_CONSTANTS.MAX_GENRES} genres`);
		}

		return errors;
	}

	/**
	 * Validate complete movie object
	 */
	static validateMovie(movie: Partial<IMovie>): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Validate required fields
		if (movie.title) {
			errors.push(...this.validateTitle(movie.title));
		} else {
			errors.push('Title is required');
		}

		if (movie.duration) {
			errors.push(...this.validateDuration(movie.duration));
		} else {
			errors.push('Duration is required');
		}

		if (movie.genres) {
			errors.push(...this.validateGenres(movie.genres));
		} else {
			errors.push('Genres are required');
		}

		// Validate other fields
		if (!movie.description || movie.description.trim().length === 0) {
			errors.push('Description is required');
		}

		if (!movie.releaseDate) {
			errors.push('Release date is required');
		}

		if (!movie.director || movie.director.length === 0) {
			errors.push('At least one director is required');
		}

		if (!movie.posterUrl || movie.posterUrl.trim().length === 0) {
			errors.push('Poster URL is required');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
