import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	MovieStatisticsResponse,
	CountResponse,
	RevenueResponse,
	OccupancyResponse,
} from './statistics.interface';

@Injectable({
	providedIn: 'root',
})
export class StatisticsDataService {
	private readonly apiUrl = `${BASEAPI_URL}/statistics`;

	constructor(private http: HttpClient) {}

	/**
	 * Get comprehensive movie statistics
	 */
	getMovieStatistics(movieId: number): Observable<MovieStatisticsResponse> {
		return this.http
			.get<MovieStatisticsResponse>(`${this.apiUrl}/movie/${movieId}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie statistics:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get total screenings count for a movie
	 */
	getTotalScreenings(movieId: number): Observable<CountResponse> {
		return this.http
			.get<CountResponse>(`${this.apiUrl}/${movieId}/movie/screenings/count`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching total screenings:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get total tickets sold for a movie
	 */
	getTotalTicketsSold(movieId: number): Observable<CountResponse> {
		return this.http
			.get<CountResponse>(`${this.apiUrl}/${movieId}/tickets/count`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching total tickets sold:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get total revenue for a movie
	 */
	getTotalRevenue(movieId: number): Observable<RevenueResponse> {
		return this.http
			.get<RevenueResponse>(`${this.apiUrl}/movie/${movieId}/revenue`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching total revenue:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get average occupancy rate for a movie
	 */
	getAverageOccupancyRate(movieId: number): Observable<OccupancyResponse> {
		return this.http
			.get<OccupancyResponse>(`${this.apiUrl}/movie/${movieId}/occupancy-rate`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching occupancy rate:', error);
					return throwError(() => error);
				})
			);
	}
}
