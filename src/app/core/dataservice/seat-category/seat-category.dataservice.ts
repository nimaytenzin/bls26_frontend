import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	SeatCategory,
	CreateSeatCategoryDto,
	UpdateSeatCategoryDto,
} from './seat-category.interface';
import { ApiResponse } from '../theatre/theatre.interface';

@Injectable({
	providedIn: 'root',
})
export class SeatCategoryDataService {
	private readonly apiUrl = `${BASEAPI_URL}/seat-category`;

	constructor(private http: HttpClient) {}

	/**
	 * Create new seat category
	 */
	createSeatCategory(
		seatCategoryData: CreateSeatCategoryDto
	): Observable<ApiResponse<SeatCategory>> {
		return this.http
			.post<ApiResponse<SeatCategory>>(this.apiUrl, seatCategoryData)
			.pipe(
				catchError((error) => {
					console.error('Error creating seat category:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing seat category
	 */
	updateSeatCategory(
		id: number,
		seatCategoryData: UpdateSeatCategoryDto
	): Observable<ApiResponse<SeatCategory>> {
		return this.http
			.patch<ApiResponse<SeatCategory>>(
				`${this.apiUrl}/${id}`,
				seatCategoryData
			)
			.pipe(
				catchError((error) => {
					console.error('Error updating seat category:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete seat category
	 */
	deleteSeatCategory(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting seat category:', error);
				return throwError(() => error);
			})
		);
	}
}
