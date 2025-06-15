import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import { Hall, CreateHallDto, UpdateHallDto } from './hall.interface';
import { ApiResponse } from '../theatre/theatre.interface';

@Injectable({
	providedIn: 'root',
})
export class HallDataService {
	private readonly apiUrl = `${BASEAPI_URL}/hall`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all halls
	 */
	findAllHalls(): Observable<Hall[]> {
		return this.http.get<Hall[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching halls:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get hall by ID
	 */
	findHallById(id: number): Observable<Hall> {
		return this.http.get<Hall>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching hall:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get halls by theatre ID
	 */
	findHallsByTheatreId(theatreId: number): Observable<Hall[]> {
		return this.http.get<Hall[]>(`${this.apiUrl}/theatre/${theatreId}`).pipe(
			catchError((error) => {
				console.error('Error fetching halls for theatre:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new hall
	 */
	createHall(hallData: CreateHallDto): Observable<ApiResponse<Hall>> {
		return this.http.post<ApiResponse<Hall>>(this.apiUrl, hallData).pipe(
			catchError((error) => {
				console.error('Error creating hall:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update existing hall
	 */
	updateHall(
		id: number,
		hallData: UpdateHallDto
	): Observable<ApiResponse<Hall>> {
		return this.http
			.patch<ApiResponse<Hall>>(`${this.apiUrl}/${id}`, hallData)
			.pipe(
				catchError((error) => {
					console.error('Error updating hall:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete hall
	 */
	deleteHall(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting hall:', error);
				return throwError(() => error);
			})
		);
	}
}
