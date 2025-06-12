import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
	IMovie,
	CreateMovieRequest,
	UpdateMovieRequest,
	MovieSearchRequest,
	MovieListResponse,
	MovieStatus,
	MovieGenre,
	MovieLanguage,
} from './movie.dto';
import { MovieUtils } from './movie.utils';

@Injectable({
	providedIn: 'root',
})
export class MovieService {
	private readonly apiUrl = '/api/movies'; // Adjust based on your API
	private moviesSubject = new BehaviorSubject<IMovie[]>([]);
	private loadingSubject = new BehaviorSubject<boolean>(false);

	// Public observables
	public movies$ = this.moviesSubject.asObservable();
	public loading$ = this.loadingSubject.asObservable();

	constructor(private http: HttpClient) {}

	/**
	 * Get all movies with optional filters
	 */
	getMovies(searchRequest?: MovieSearchRequest): Observable<MovieListResponse> {
		this.loadingSubject.next(true);

		let params = new HttpParams();

		if (searchRequest) {
			if (searchRequest.query) {
				params = params.set('query', searchRequest.query);
			}
			if (searchRequest.genres?.length) {
				params = params.set('genres', searchRequest.genres.join(','));
			}
			if (searchRequest.language) {
				params = params.set('language', searchRequest.language);
			}
			if (searchRequest.rating) {
				params = params.set('rating', searchRequest.rating);
			}
			if (searchRequest.status) {
				params = params.set('status', searchRequest.status);
			}
			if (searchRequest.releaseDate?.from) {
				params = params.set(
					'releaseDateFrom',
					searchRequest.releaseDate.from.toISOString()
				);
			}
			if (searchRequest.releaseDate?.to) {
				params = params.set(
					'releaseDateTo',
					searchRequest.releaseDate.to.toISOString()
				);
			}
			if (searchRequest.duration?.min) {
				params = params.set(
					'durationMin',
					searchRequest.duration.min.toString()
				);
			}
			if (searchRequest.duration?.max) {
				params = params.set(
					'durationMax',
					searchRequest.duration.max.toString()
				);
			}
			if (searchRequest.format2D !== undefined) {
				params = params.set('format2D', searchRequest.format2D.toString());
			}
			if (searchRequest.format3D !== undefined) {
				params = params.set('format3D', searchRequest.format3D.toString());
			}
			if (searchRequest.formatIMAX !== undefined) {
				params = params.set('formatIMAX', searchRequest.formatIMAX.toString());
			}
			if (searchRequest.sortBy) {
				params = params.set('sortBy', searchRequest.sortBy);
			}
			if (searchRequest.sortOrder) {
				params = params.set('sortOrder', searchRequest.sortOrder);
			}
			if (searchRequest.page) {
				params = params.set('page', searchRequest.page.toString());
			}
			if (searchRequest.limit) {
				params = params.set('limit', searchRequest.limit.toString());
			}
		}

		return this.http.get<MovieListResponse>(this.apiUrl, { params }).pipe(
			map((response) => {
				this.moviesSubject.next(response.movies);
				this.loadingSubject.next(false);
				return response;
			}),
			catchError((error) => {
				this.loadingSubject.next(false);
				console.error('Error fetching movies:', error);
				throw error;
			})
		);
	}

	/**
	 * Get movie by ID
	 */
	getMovieById(id: string): Observable<IMovie> {
		this.loadingSubject.next(true);

		return this.http.get<IMovie>(`${this.apiUrl}/${id}`).pipe(
			map((movie) => {
				this.loadingSubject.next(false);
				return movie;
			}),
			catchError((error) => {
				this.loadingSubject.next(false);
				console.error('Error fetching movie:', error);
				throw error;
			})
		);
	}

	/**
	 * Create new movie
	 */
	createMovie(movieData: CreateMovieRequest): Observable<IMovie> {
		this.loadingSubject.next(true);

		return this.http.post<IMovie>(this.apiUrl, movieData).pipe(
			map((movie) => {
				this.loadingSubject.next(false);
				// Update local movies list
				const currentMovies = this.moviesSubject.value;
				this.moviesSubject.next([...currentMovies, movie]);
				return movie;
			}),
			catchError((error) => {
				this.loadingSubject.next(false);
				console.error('Error creating movie:', error);
				throw error;
			})
		);
	}

	/**
	 * Update existing movie
	 */
	updateMovie(movieData: UpdateMovieRequest): Observable<IMovie> {
		this.loadingSubject.next(true);

		return this.http
			.put<IMovie>(`${this.apiUrl}/${movieData.id}`, movieData)
			.pipe(
				map((updatedMovie) => {
					this.loadingSubject.next(false);
					// Update local movies list
					const currentMovies = this.moviesSubject.value;
					const updatedMovies = currentMovies.map((movie) =>
						movie.id === updatedMovie.id ? updatedMovie : movie
					);
					this.moviesSubject.next(updatedMovies);
					return updatedMovie;
				}),
				catchError((error) => {
					this.loadingSubject.next(false);
					console.error('Error updating movie:', error);
					throw error;
				})
			);
	}

	/**
	 * Delete movie
	 */
	deleteMovie(id: string): Observable<boolean> {
		this.loadingSubject.next(true);

		return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
			map(() => {
				this.loadingSubject.next(false);
				// Remove from local movies list
				const currentMovies = this.moviesSubject.value;
				const filteredMovies = currentMovies.filter((movie) => movie.id !== id);
				this.moviesSubject.next(filteredMovies);
				return true;
			}),
			catchError((error) => {
				this.loadingSubject.next(false);
				console.error('Error deleting movie:', error);
				throw error;
			})
		);
	}

	/**
	 * Get now showing movies
	 */
	getNowShowingMovies(): Observable<IMovie[]> {
		return this.getMovies({ status: MovieStatus.NOW_SHOWING }).pipe(
			map((response) =>
				response.movies.filter((movie) => MovieUtils.isCurrentlyShowing(movie))
			)
		);
	}

	/**
	 * Get coming soon movies
	 */
	getComingSoonMovies(): Observable<IMovie[]> {
		return this.getMovies({ status: MovieStatus.COMING_SOON }).pipe(
			map((response) => response.movies)
		);
	}

	/**
	 * Get movies by genre
	 */
	getMoviesByGenre(genre: MovieGenre): Observable<IMovie[]> {
		return this.getMovies({ genres: [genre] }).pipe(
			map((response) => response.movies)
		);
	}

	/**
	 * Get popular movies (based on ratings and reviews)
	 */
	getPopularMovies(limit: number = 10): Observable<IMovie[]> {
		return this.getMovies({
			sortBy: 'popularity',
			sortOrder: 'desc',
			limit,
		}).pipe(map((response) => response.movies));
	}

	/**
	 * Search movies by query
	 */
	searchMovies(
		query: string,
		filters?: Partial<MovieSearchRequest>
	): Observable<IMovie[]> {
		const searchRequest: MovieSearchRequest = {
			query,
			...filters,
		};

		return this.getMovies(searchRequest).pipe(
			map((response) => response.movies)
		);
	}

	/**
	 * Get movie schedules
	 */
	getMovieSchedules(movieId: string): Observable<IMovie['schedules']> {
		return this.http
			.get<IMovie['schedules']>(`${this.apiUrl}/${movieId}/schedules`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie schedules:', error);
					throw error;
				})
			);
	}

	/**
	 * Get movie reviews
	 */
	getMovieReviews(
		movieId: string,
		page: number = 1,
		limit: number = 10
	): Observable<IMovie['reviews']> {
		const params = new HttpParams()
			.set('page', page.toString())
			.set('limit', limit.toString());

		return this.http
			.get<IMovie['reviews']>(`${this.apiUrl}/${movieId}/reviews`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie reviews:', error);
					throw error;
				})
			);
	}

	/**
	 * Add movie review
	 */
	addMovieReview(
		movieId: string,
		review: {
			rating: number;
			comment: string;
		}
	): Observable<any> {
		return this.http.post(`${this.apiUrl}/${movieId}/reviews`, review).pipe(
			catchError((error) => {
				console.error('Error adding movie review:', error);
				throw error;
			})
		);
	}

	/**
	 * Upload movie poster
	 */
	uploadMoviePoster(
		movieId: string,
		file: File
	): Observable<{ posterUrl: string }> {
		const formData = new FormData();
		formData.append('poster', file);

		return this.http
			.post<{ posterUrl: string }>(`${this.apiUrl}/${movieId}/poster`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error uploading movie poster:', error);
					throw error;
				})
			);
	}

	/**
	 * Upload movie gallery images
	 */
	uploadMovieGallery(
		movieId: string,
		files: File[]
	): Observable<{ galleryImages: string[] }> {
		const formData = new FormData();
		files.forEach((file, index) => {
			formData.append(`gallery_${index}`, file);
		});

		return this.http
			.post<{ galleryImages: string[] }>(
				`${this.apiUrl}/${movieId}/gallery`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading movie gallery:', error);
					throw error;
				})
			);
	}

	/**
	 * Get movie statistics for admin dashboard
	 */
	getMovieStatistics(): Observable<{
		totalMovies: number;
		nowShowing: number;
		comingSoon: number;
		totalBookings: number;
		averageRating: number;
		genreDistribution: { genre: MovieGenre; count: number }[];
		languageDistribution: { language: MovieLanguage; count: number }[];
		monthlyReleases: { month: string; count: number }[];
	}> {
		return this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
			catchError((error) => {
				console.error('Error fetching movie statistics:', error);
				throw error;
			})
		);
	}

	/**
	 * Toggle movie status
	 */
	toggleMovieStatus(movieId: string, status: MovieStatus): Observable<IMovie> {
		return this.http
			.patch<IMovie>(`${this.apiUrl}/${movieId}/status`, { status })
			.pipe(
				map((updatedMovie) => {
					// Update local movies list
					const currentMovies = this.moviesSubject.value;
					const updatedMovies = currentMovies.map((movie) =>
						movie.id === updatedMovie.id ? updatedMovie : movie
					);
					this.moviesSubject.next(updatedMovies);
					return updatedMovie;
				}),
				catchError((error) => {
					console.error('Error updating movie status:', error);
					throw error;
				})
			);
	}

	/**
	 * Get movies for admin dashboard with summary stats
	 */
	getAdminMoviesSummary(): Observable<{
		movies: IMovie[];
		stats: {
			total: number;
			nowShowing: number;
			comingSoon: number;
			ended: number;
		};
	}> {
		return this.http.get<any>(`${this.apiUrl}/admin/summary`).pipe(
			catchError((error) => {
				console.error('Error fetching admin movies summary:', error);
				// Return mock data for development
				return of({
					movies: [],
					stats: {
						total: 0,
						nowShowing: 0,
						comingSoon: 0,
						ended: 0,
					},
				});
			})
		);
	}

	/**
	 * Bulk update movies
	 */
	bulkUpdateMovies(
		updates: { id: string; data: Partial<IMovie> }[]
	): Observable<IMovie[]> {
		return this.http
			.patch<IMovie[]>(`${this.apiUrl}/bulk-update`, { updates })
			.pipe(
				map((updatedMovies) => {
					// Update local movies list
					const currentMovies = this.moviesSubject.value;
					const updatedMoviesMap = new Map(
						updatedMovies.map((movie) => [movie.id, movie])
					);

					const newMovies = currentMovies.map(
						(movie) => updatedMoviesMap.get(movie.id) || movie
					);

					this.moviesSubject.next(newMovies);
					return updatedMovies;
				}),
				catchError((error) => {
					console.error('Error bulk updating movies:', error);
					throw error;
				})
			);
	}

	/**
	 * Clear movies cache
	 */
	clearCache(): void {
		this.moviesSubject.next([]);
	}
}
