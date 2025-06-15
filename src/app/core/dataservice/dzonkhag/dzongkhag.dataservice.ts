import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	ApiResponse,
	CreateDzongkhagDto,
	Dzongkhag,
	UpdateDzongkhagDto,
} from './dzongkhag.interface';

@Injectable({
	providedIn: 'root',
})
export class DzongkhagDataService {
	private readonly apiUrl = `${BASEAPI_URL}/dzongkhag`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all dzongkhags
	 */
	findAllDzongkhags(): Observable<Dzongkhag[]> {
		return this.http.get<Dzongkhag[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching dzonghkags:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new dzongkhag
	 */
	createDzongkhag(
		data: CreateDzongkhagDto
	): Observable<ApiResponse<Dzongkhag>> {
		return this.http.post<ApiResponse<Dzongkhag>>(this.apiUrl, data).pipe(
			catchError((error) => {
				console.error('Error creating dzongkhag:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update existing dzongkhag
	 */
	updateDzongkhag(
		id: number,
		data: UpdateDzongkhagDto
	): Observable<ApiResponse<Dzongkhag>> {
		return this.http
			.patch<ApiResponse<Dzongkhag>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating dzlongkhag:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete language
	 */
	deleteDzongkhag(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting dzongkhag:', error);
				return throwError(() => error);
			})
		);
	}
}
