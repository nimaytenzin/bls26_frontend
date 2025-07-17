import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
	Theatre,
	CreateTheatreDto,
	CreateTheatreWithImageDto,
	UpdateTheatreDto,
	ApiResponse,
} from './theatre.interface';
import { BASEAPI_URL } from '../../constants/constants';

@Injectable({
	providedIn: 'root',
})
export class TheatreDataService {
	private readonly apiUrl = `${BASEAPI_URL}/theatre`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all theatres
	 */
	findAllTheatres(): Observable<Theatre[]> {
		return this.http.get<Theatre[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching theatres:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get theatre by ID
	 */
	findTheatreById(id: string): Observable<Theatre> {
		return this.http.get<Theatre>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching theatre:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new theatre with image
	 */
	createTheatreWithImage(
		imageFile: File,
		theatreData: CreateTheatreWithImageDto
	): Observable<ApiResponse<Theatre>> {
		const formData = new FormData();
		formData.append('image', imageFile);

		// Append theatre data
		Object.keys(theatreData).forEach((key) => {
			const value = (theatreData as any)[key];
			if (value !== null && value !== undefined) {
				formData.append(key, value.toString());
			}
		});

		return this.http
			.post<ApiResponse<Theatre>>(`${this.apiUrl}/with-image`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error creating theatre with image:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing theatre
	 */
	updateTheatre(
		id: string,
		theatreData: UpdateTheatreDto
	): Observable<ApiResponse<Theatre>> {
		return this.http
			.patch<ApiResponse<Theatre>>(`${this.apiUrl}/${id}`, theatreData)
			.pipe(
				catchError((error) => {
					console.error('Error updating theatre:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update theatre image
	 */
	updateTheatreImage(
		id: string,
		imageFile: File,
		theatreData?: UpdateTheatreDto
	): Observable<ApiResponse<Theatre>> {
		const formData = new FormData();
		formData.append('image', imageFile);

		// Append theatre data if provided
		if (theatreData) {
			Object.keys(theatreData).forEach((key) => {
				const value = (theatreData as any)[key];
				if (value !== null && value !== undefined) {
					formData.append(key, value.toString());
				}
			});
		}

		return this.http
			.patch<ApiResponse<Theatre>>(`${this.apiUrl}/${id}/image`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error updating theatre image:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete theatre
	 */
	deleteTheatre(id: string): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting theatre:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Bulk update theatre status
	 */
	bulkUpdateTheatreStatus(
		ids: string[],
		status: string
	): Observable<ApiResponse<any>> {
		return this.http
			.patch<ApiResponse<any>>(`${this.apiUrl}/bulk/status`, { ids, status })
			.pipe(
				catchError((error) => {
					console.error('Error bulk updating theatre status:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk delete theatres
	 */
	bulkDeleteTheatres(ids: string[]): Observable<ApiResponse<any>> {
		return this.http
			.delete<ApiResponse<any>>(`${this.apiUrl}/bulk`, {
				body: { ids },
			})
			.pipe(
				catchError((error) => {
					console.error('Error bulk deleting theatres:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get theatre image URL
	 */
	getTheatreImageUrl(imageUrl: string): string {
		if (!imageUrl) return '';

		// If it's already a full URL, return as is
		if (imageUrl.startsWith('http')) {
			return imageUrl;
		}

		// Otherwise, prepend base API URL
		return `${BASEAPI_URL}${imageUrl}`;
	}

	/**
	 * Get theatre image URL or default
	 */
	getTheatreImageUrlOrDefault(theatre: Theatre): string {
		if (theatre.imageUrl) {
			return this.getTheatreImageUrl(theatre.imageUrl);
		}
		// Return default theatre image
		return '/assets/images/theatres/lugartheatre.jpg';
	}

	/**
	 * Create new theatre without image
	 */
	createTheatre(
		theatreData: CreateTheatreDto
	): Observable<ApiResponse<Theatre>> {
		return this.http.post<ApiResponse<Theatre>>(this.apiUrl, theatreData).pipe(
			catchError((error) => {
				console.error('Error creating theatre:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all dzongkhags
	 */
	getAllDzongkhags(): Observable<any[]> {
		return this.http.get<any[]>(`${BASEAPI_URL}/dzongkhags`).pipe(
			catchError((error) => {
				console.error('Error fetching dzongkhags:', error);
				return throwError(() => error);
			})
		);
	}
}
