import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	Movie,
	ApiResponse,
	CreateMovieDto,
	UpdateMovieDto,
	MovieMediaUploadResponse,
	CreateMovieMediaDto,
	ScreeningStatusEnum,
} from './movie.interface';
import { PaginatedData } from '../../utility/pagination.interface';

@Injectable({
	providedIn: 'root',
})
export class MovieApiDataService {
	private readonly apiUrl = `${BASEAPI_URL}/movies`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all movies
	 */
	findAllMovies(): Observable<Movie[]> {
		return this.http.get<ApiResponse<Movie[]>>(this.apiUrl).pipe(
			map((response) => response.data),
			catchError((error) => {
				console.error('Error fetching movies:', error);
				return throwError(() => error);
			})
		);
	}

	// Get All Now Showing Movies

	findAllMoviesScreeningNow(): Observable<Movie[]> {
		return this.http.get<Movie[]>(`${this.apiUrl}/screening/now`).pipe(
			map((response) => response),
			catchError((error) => {
				console.error('Error fetching now showing movies:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get movie by ID
	 */
	findMovieById(id: number): Observable<Movie> {
		return this.http.get<ApiResponse<Movie>>(`${this.apiUrl}/${id}`).pipe(
			map((response) => response.data),
			catchError((error) => {
				console.error('Error fetching movie:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new movie
	 */
	createMovie(movieData: CreateMovieDto): Observable<ApiResponse<Movie>> {
		return this.http.post<ApiResponse<Movie>>(this.apiUrl, movieData).pipe(
			catchError((error) => {
				console.error('Error creating movie:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update existing movie
	 */
	updateMovie(
		id: number,
		movieData: UpdateMovieDto
	): Observable<ApiResponse<Movie>> {
		return this.http
			.patch<ApiResponse<Movie>>(`${this.apiUrl}/${id}`, movieData)
			.pipe(
				catchError((error) => {
					console.error('Error updating movie:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete movie
	 */
	deleteMovie(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting movie:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Upload movie media (poster, images, videos)
	 * @param file - File to upload
	 * @param movieId - Movie ID
	 * @param name - Media name/title
	 * @param orientation - Media orientation (LANDSCAPE | PORTRAIT)
	 * @param type - Media type (IMAGE | VIDEO)
	 */
	uploadMovieMedia(
		file: File,
		movieId: number,
		name: string,
		orientation: 'LANDSCAPE' | 'PORTRAIT',
		type: 'IMAGE' | 'VIDEO'
	): Observable<ApiResponse<MovieMediaUploadResponse>> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('movieId', movieId.toString());
		formData.append('name', name);
		formData.append('orientation', orientation);
		formData.append('type', type);

		return this.http
			.post<ApiResponse<MovieMediaUploadResponse>>(
				`${BASEAPI_URL}/movie-media/upload`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading movie media:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all movie media by movie ID
	 * @param movieId - Movie ID
	 */
	getMovieMedia(movieId: number): Observable<MovieMediaUploadResponse[]> {
		return this.http
			.get<ApiResponse<MovieMediaUploadResponse[]>>(
				`${BASEAPI_URL}/movie-media`,
				{
					params: { movieId: movieId.toString() },
				}
			)
			.pipe(
				map((response) => response.data),
				catchError((error) => {
					console.error('Error fetching movie media:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get movie media by type
	 * @param movieId - Movie ID
	 * @param type - Media type (IMAGE | VIDEO)
	 */
	getMovieMediaByType(
		movieId: number,
		type: 'IMAGE' | 'VIDEO'
	): Observable<MovieMediaUploadResponse[]> {
		return this.http
			.get<ApiResponse<MovieMediaUploadResponse[]>>(
				`${BASEAPI_URL}/movie-media`,
				{
					params: {
						movieId: movieId.toString(),
						type: type,
					},
				}
			)
			.pipe(
				map((response) => response.data),
				catchError((error) => {
					console.error('Error fetching movie media by type:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete movie media
	 * @param mediaId - Media ID to delete
	 */
	deleteMovieMedia(mediaId: number): Observable<ApiResponse<any>> {
		return this.http
			.delete<ApiResponse<any>>(`${BASEAPI_URL}/movie-media/${mediaId}`)
			.pipe(
				catchError((error) => {
					console.error('Error deleting movie media:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update movie media
	 * @param mediaId - Media ID to update
	 * @param updateData - Update data
	 */
	updateMovieMedia(
		mediaId: number,
		updateData: Partial<CreateMovieMediaDto>
	): Observable<ApiResponse<MovieMediaUploadResponse>> {
		return this.http
			.patch<ApiResponse<MovieMediaUploadResponse>>(
				`${BASEAPI_URL}/movie-media/${mediaId}`,
				updateData
			)
			.pipe(
				catchError((error) => {
					console.error('Error updating movie media:', error);
					return throwError(() => error);
				})
			);
	}

	// Paginated routes for movie by screening status

	/**
	 * Get upcoming movies paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getUpcomingMoviesPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Movie>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Movie>>(`${this.apiUrl}/upcoming/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching upcoming movies:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get Movies Screening now paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getMoviesScreeningNowPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Movie>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Movie>>(`${this.apiUrl}/now-showing/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching movies showing now:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get ended movies paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getEndedMoviesPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Movie>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Movie>>(`${this.apiUrl}/ended/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching ended movies:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get cancelled movies paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getCancelledMoviesPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Movie>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Movie>>(`${this.apiUrl}/cancelled/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching cancelled movies:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get movies by screening status paginated
	 * @param status - Screening status (UPCOMING, NOW_SHOWING, ENDED, CANCELLED)
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getMoviesByStatusPaginated(
		status: ScreeningStatusEnum,
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Movie>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Movie>>(`${this.apiUrl}/status/${status}/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching movies with status ${status}:`, error);
					return throwError(() => error);
				})
			);
	}
}
