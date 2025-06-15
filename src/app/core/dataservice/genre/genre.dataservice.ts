import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
	ApiResponse,
	CreateGenreDto,
	Genre,
	UpdateGenreDto,
} from './genre.interface';
import { BASEAPI_URL } from '../../constants/constants';

@Injectable({
	providedIn: 'root',
})
export class GenreDataService {
	private readonly apiUrl = `${BASEAPI_URL}/genres`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all genres
	 */
	findAllGenres(): Observable<Genre[]> {
		return this.http.get<Genre[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching genres:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new genre
	 */
	createGenre(genreData: CreateGenreDto): Observable<ApiResponse<Genre>> {
		return this.http.post<ApiResponse<Genre>>(this.apiUrl, genreData).pipe(
			catchError((error) => {
				console.error('Error creating genre:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update existing genre
	 */
	updateGenre(
		id: number,
		genreData: UpdateGenreDto
	): Observable<ApiResponse<Genre>> {
		return this.http
			.patch<ApiResponse<Genre>>(`${this.apiUrl}/${id}`, genreData)
			.pipe(
				catchError((error) => {
					console.error('Error updating genre:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete genre
	 */
	deleteGenre(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting genre:', error);
				return throwError(() => error);
			})
		);
	}
}
