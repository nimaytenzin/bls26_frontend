import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	Seat,
	CreateSeatDto,
	UpdateSeatDto,
	BulkCreateSeatsDto,
} from './seat.interface';
import { ApiResponse } from '../theatre/theatre.interface';

@Injectable({
	providedIn: 'root',
})
export class SeatDataService {
	private readonly apiUrl = `${BASEAPI_URL}/seat`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all seats
	 */
	findAllSeats(): Observable<Seat[]> {
		return this.http.get<Seat[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching seats:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get seat by ID
	 */
	findSeatById(id: number): Observable<Seat> {
		return this.http.get<Seat>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching seat:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get seats by hall ID
	 */
	findSeatsByHallId(hallId: number): Observable<Seat[]> {
		return this.http.get<Seat[]>(`${this.apiUrl}/hall/${hallId}`).pipe(
			catchError((error) => {
				console.error('Error fetching seats by hall:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new seat
	 */
	createSeat(seatData: CreateSeatDto): Observable<ApiResponse<Seat>> {
		return this.http.post<ApiResponse<Seat>>(this.apiUrl, seatData).pipe(
			catchError((error) => {
				console.error('Error creating seat:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create multiple seats at once
	 */
	createMultipleSeats(
		seatsData: CreateSeatDto[]
	): Observable<ApiResponse<Seat[]>> {
		return this.http
			.post<ApiResponse<Seat[]>>(`${this.apiUrl}/bulk`, seatsData)
			.pipe(
				catchError((error) => {
					console.error('Error creating multiple seats:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing seat
	 */
	updateSeat(
		id: number,
		seatData: UpdateSeatDto
	): Observable<ApiResponse<Seat>> {
		return this.http
			.patch<ApiResponse<Seat>>(`${this.apiUrl}/${id}`, seatData)
			.pipe(
				catchError((error) => {
					console.error('Error updating seat:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete seat
	 */
	deleteSeat(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting seat:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Delete multiple seats
	 */
	deleteMultipleSeats(ids: number[]): Observable<ApiResponse<any>> {
		return this.http
			.delete<ApiResponse<any>>(`${this.apiUrl}/bulk`, { body: { ids } })
			.pipe(
				catchError((error) => {
					console.error('Error deleting multiple seats:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get seat layout for a hall
	 */
	getHallSeatLayout(hallId: number): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/hall/${hallId}/layout`).pipe(
			catchError((error) => {
				console.error('Error fetching hall seat layout:', error);
				return throwError(() => error);
			})
		);
	}
}
