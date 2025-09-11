import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import { Movie } from '../movie/movie.interface';
import {
	ApiResponse,
	MovieDashboardData,
	DashboardOverview,
	MovieRevenueData,
	RevenueTrendData,
	MovieBookingsData,
	BookingAnalyticsData,
	MoviePerformanceMetrics,
	MovieSummary,
	RevenueTrendParams,
	AnalyticsFilterParams,
} from './executive-producer.interface';

@Injectable({
	providedIn: 'root',
})
export class ExecutiveProducerDataService {
	private readonly baseUrl = `${BASEAPI_URL}/executive-producer`;

	constructor(private http: HttpClient) {}

	// ==================== Movies Management ====================

	/**
	 * Get all movies for the executive producer
	 */
	getAllMovies(): Observable<ApiResponse<Movie[]>> {
		return this.http.get<ApiResponse<Movie[]>>(`${this.baseUrl}/movies`).pipe(
			catchError((error) => {
				console.error('Error fetching executive producer movies:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get specific movie details
	 */
	getMovieById(movieId: number): Observable<ApiResponse<Movie>> {
		return this.http
			.get<ApiResponse<Movie>>(`${this.baseUrl}/movies/${movieId}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie details:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get movie summary with key statistics
	 */
	getMovieSummary(movieId: number): Observable<ApiResponse<MovieSummary>> {
		return this.http
			.get<ApiResponse<MovieSummary>>(
				`${this.baseUrl}/movies/${movieId}/summary`
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie summary:', error);
					return throwError(() => error);
				})
			);
	}

	// ==================== Dashboard Analytics ====================

	/**
	 * Get comprehensive dashboard data for a specific movie
	 */
	getMovieDashboard(
		movieId: number,
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MovieDashboardData>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
			if (filters.theatreId)
				params = params.set('theatreId', filters.theatreId.toString());
		}

		return this.http
			.get<ApiResponse<MovieDashboardData>>(
				`${this.baseUrl}/dashboard/movies/${movieId}`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie dashboard data:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get overall dashboard overview across all movies
	 */
	getDashboardOverview(
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<DashboardOverview>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get<ApiResponse<DashboardOverview>>(
				`${this.baseUrl}/dashboard/overview`,
				{
					params,
				}
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching dashboard overview:', error);
					return throwError(() => error);
				})
			);
	}

	// ==================== Revenue Analytics ====================

	/**
	 * Get detailed revenue breakdown for a specific movie
	 */
	getMovieRevenue(
		movieId: number,
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MovieRevenueData>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
			if (filters.theatreId)
				params = params.set('theatreId', filters.theatreId.toString());
		}

		return this.http
			.get<ApiResponse<MovieRevenueData>>(
				`${this.baseUrl}/revenue/movies/${movieId}`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie revenue data:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get revenue trends with flexible filtering options
	 */
	getRevenueTrends(
		params: RevenueTrendParams
	): Observable<ApiResponse<RevenueTrendData[]>> {
		let httpParams = new HttpParams();

		if (params.period) httpParams = httpParams.set('period', params.period);
		if (params.startDate)
			httpParams = httpParams.set('startDate', params.startDate);
		if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
		if (params.movieId)
			httpParams = httpParams.set('movieId', params.movieId.toString());

		return this.http
			.get<ApiResponse<RevenueTrendData[]>>(
				`${this.baseUrl}/revenue/movie/trend`,
				{ params: httpParams }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching revenue trends:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get overall revenue analytics across all movies
	 */
	getRevenueOverview(
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MovieRevenueData>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get<ApiResponse<MovieRevenueData>>(`${this.baseUrl}/revenue/overview`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching revenue overview:', error);
					return throwError(() => error);
				})
			);
	}

	// ==================== Booking Analytics ====================

	/**
	 * Get comprehensive booking data for a specific movie
	 */
	getMovieBookings(
		movieId: number,
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MovieBookingsData>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
			if (filters.theatreId)
				params = params.set('theatreId', filters.theatreId.toString());
			if (filters.status) params = params.set('status', filters.status);
		}

		return this.http
			.get<ApiResponse<MovieBookingsData>>(
				`${this.baseUrl}/bookings/movies/${movieId}`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie bookings data:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get advanced booking patterns and customer behavior analytics
	 */
	getBookingAnalytics(
		movieId: number,
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<BookingAnalyticsData>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
			if (filters.theatreId)
				params = params.set('theatreId', filters.theatreId.toString());
		}

		return this.http
			.get<ApiResponse<BookingAnalyticsData>>(
				`${this.baseUrl}/bookings/analytics/${movieId}`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching booking analytics:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get overall booking data across all movies
	 */
	getAllBookings(
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MovieBookingsData>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
			if (filters.theatreId)
				params = params.set('theatreId', filters.theatreId.toString());
			if (filters.status) params = params.set('status', filters.status);
		}

		return this.http
			.get<ApiResponse<MovieBookingsData>>(`${this.baseUrl}/bookings`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching all bookings data:', error);
					return throwError(() => error);
				})
			);
	}

	// ==================== Performance Metrics ====================

	/**
	 * Get comprehensive performance metrics and KPIs for a movie
	 */
	getMoviePerformanceMetrics(
		movieId: number,
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MoviePerformanceMetrics>> {
		let params = new HttpParams();

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get<ApiResponse<MoviePerformanceMetrics>>(
				`${this.baseUrl}/performance/movies/${movieId}/metrics`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching movie performance metrics:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get performance comparison across multiple movies
	 */
	getPerformanceComparison(
		movieIds: number[],
		filters?: AnalyticsFilterParams
	): Observable<ApiResponse<MoviePerformanceMetrics[]>> {
		let params = new HttpParams();
		params = params.set('movieIds', movieIds.join(','));

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get<ApiResponse<MoviePerformanceMetrics[]>>(
				`${this.baseUrl}/performance/comparison`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching performance comparison:', error);
					return throwError(() => error);
				})
			);
	}

	// ==================== Export Functions ====================

	/**
	 * Export revenue report for a specific movie
	 */
	exportRevenueReport(
		movieId: number,
		format: 'pdf' | 'excel' | 'csv' = 'pdf',
		filters?: AnalyticsFilterParams
	): Observable<Blob> {
		let params = new HttpParams();
		params = params.set('format', format);

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get(`${this.baseUrl}/revenue/movies/${movieId}/export`, {
				params,
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error('Error exporting revenue report:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Export performance report for a specific movie
	 */
	exportPerformanceReport(
		movieId: number,
		format: 'pdf' | 'excel' | 'csv' = 'pdf',
		filters?: AnalyticsFilterParams
	): Observable<Blob> {
		let params = new HttpParams();
		params = params.set('format', format);

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get(`${this.baseUrl}/performance/movies/${movieId}/export`, {
				params,
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error('Error exporting performance report:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Export dashboard report for a specific movie
	 */
	exportDashboardReport(
		movieId: number,
		format: 'pdf' | 'excel' | 'csv' = 'pdf',
		filters?: AnalyticsFilterParams
	): Observable<Blob> {
		let params = new HttpParams();
		params = params.set('format', format);

		if (filters) {
			if (filters.startDate)
				params = params.set('startDate', filters.startDate);
			if (filters.endDate) params = params.set('endDate', filters.endDate);
		}

		return this.http
			.get(`${this.baseUrl}/dashboard/movies/${movieId}/export`, {
				params,
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error('Error exporting dashboard report:', error);
					return throwError(() => error);
				})
			);
	}

	// ==================== Utility Functions ====================

	/**
	 * Download blob as file
	 */
	downloadFile(blob: Blob, filename: string): void {
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	}

	/**
	 * Get file extension based on format
	 */
	getFileExtension(format: 'pdf' | 'excel' | 'csv'): string {
		switch (format) {
			case 'pdf':
				return '.pdf';
			case 'excel':
				return '.xlsx';
			case 'csv':
				return '.csv';
			default:
				return '.pdf';
		}
	}
}
