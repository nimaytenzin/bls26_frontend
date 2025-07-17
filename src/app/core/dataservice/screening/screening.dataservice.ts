import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	Screening,
	CreateScreeningDto,
	CreateScreeningWithPricesDto,
	UpdateScreeningDto,
	ScreeningFilter,
	ApiResponse,
	SeatAvailabilityByScreeningDto,
} from './screening.interface';
import { SeatCategory } from '../seat-category/seat-category.interface';
import {
	PaginatedData,
	PaginationParams,
	PaginatedScreeningFilter,
	createPaginationParams,
} from '../../utility/pagination.interface';

@Injectable({
	providedIn: 'root',
})
export class ScreeningDataService {
	private readonly apiUrl = `${BASEAPI_URL}/screening`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all screenings with optional filters
	 */
	findAllScreenings(filter?: ScreeningFilter): Observable<Screening[]> {
		let params = new HttpParams();

		if (filter?.movieId) {
			params = params.set('movieId', filter.movieId.toString());
		}
		if (filter?.hallId) {
			params = params.set('hallId', filter.hallId.toString());
		}
		if (filter?.date) {
			params = params.set('date', filter.date);
		}
		if (filter?.theatreId) {
			params = params.set('theatreId', filter.theatreId.toString());
		}

		return this.http.get<Screening[]>(this.apiUrl, { params }).pipe(
			catchError((error) => {
				console.error('Error fetching screenings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get screening by ID
	 */
	findScreeningById(id: number): Observable<Screening> {
		return this.http.get<Screening>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching screening:', error);
				return throwError(() => error);
			})
		);
	}
	/**
	 * Get Valid Screening by MovieId
	 */
	findAllValidScreeningByMovieId(id: number): Observable<Screening[]> {
		return this.http.get<Screening[]>(`${this.apiUrl}/movie/${id}/valid`).pipe(
			catchError((error) => {
				console.error('Error fetching valid screenings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get available seat counts by screening ID
	 */
	findSeatsAvailableByScreening(
		screeningId: number
	): Observable<SeatAvailabilityByScreeningDto> {
		return this.http
			.get<SeatAvailabilityByScreeningDto>(
				`${this.apiUrl}/seats-available/${screeningId}`
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching seat availability:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get screenings by movie ID PUBLIC..
	 */
	findScreeningsByMovieId(movieId: number): Observable<Screening[]> {
		return this.http.get<Screening[]>(`${this.apiUrl}/movie/${movieId}`).pipe(
			catchError((error) => {
				console.error('Error fetching screenings by movie:', error);
				return throwError(() => error);
			})
		);
	}

	findScreeningsByMovieIdDetailed(movieId: number): Observable<Screening[]> {
		return this.http
			.get<Screening[]>(`${this.apiUrl}/movie/${movieId}/detailed`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching detailed screenings by movie:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get screenings by hall ID
	 */
	findScreeningsByHallId(hallId: number): Observable<Screening[]> {
		return this.http.get<Screening[]>(`${this.apiUrl}/hall/${hallId}`).pipe(
			catchError((error) => {
				console.error('Error fetching screenings by hall:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get screenings by date
	 */
	findScreeningsByDate(date: string): Observable<Screening[]> {
		return this.http.get<Screening[]>(`${this.apiUrl}/date/${date}`).pipe(
			catchError((error) => {
				console.error('Error fetching screenings by date:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get latest/upcoming screenings
	 */
	findLatestScreenings(): Observable<Screening[]> {
		return this.http.get<Screening[]>(`${this.apiUrl}/latest`).pipe(
			catchError((error) => {
				console.error('Error fetching latest screenings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get seat categories for a hall
	 */
	getHallSeatCategories(hallId: number): Observable<SeatCategory[]> {
		return this.http
			.get<SeatCategory[]>(`${this.apiUrl}/hall/${hallId}/seat-categories`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching hall seat categories:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create basic screening (legacy)
	 */
	createScreening(
		screeningData: CreateScreeningDto
	): Observable<ApiResponse<Screening>> {
		return this.http
			.post<ApiResponse<Screening>>(this.apiUrl, screeningData)
			.pipe(
				catchError((error) => {
					console.error('Error creating screening:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create screening with seat prices (recommended)
	 */
	createScreeningWithPrices(
		screeningData: CreateScreeningWithPricesDto
	): Observable<ApiResponse<Screening>> {
		return this.http
			.post<ApiResponse<Screening>>(`${this.apiUrl}/with-prices`, screeningData)
			.pipe(
				catchError((error) => {
					console.error('Error creating screening with prices:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing screening
	 */
	updateScreening(
		id: number,
		screeningData: UpdateScreeningDto
	): Observable<ApiResponse<Screening>> {
		return this.http
			.patch<ApiResponse<Screening>>(`${this.apiUrl}/${id}`, screeningData)
			.pipe(
				catchError((error) => {
					console.error('Error updating screening:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete screening
	 */
	deleteScreening(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting screening:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Check for time conflicts
	 */
	checkTimeConflicts(
		hallId: number,
		date: string,
		startTime: string,
		endTime: string,
		excludeScreeningId?: number
	): Observable<boolean> {
		let params = new HttpParams()
			.set('hallId', hallId.toString())
			.set('date', date)
			.set('startTime', startTime)
			.set('endTime', endTime);

		if (excludeScreeningId) {
			params = params.set('excludeScreeningId', excludeScreeningId.toString());
		}

		return this.http
			.get<boolean>(`${this.apiUrl}/check-conflicts`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error checking time conflicts:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get current and upcoming screenings with pagination
	 */
	getCurrentScreeningsPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Screening>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Screening>>(`${this.apiUrl}/current/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching current screenings:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get past screenings with pagination
	 */
	getPastScreeningsPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Screening>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Screening>>(`${this.apiUrl}/past/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching past screenings:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get screenings by theatre ID with pagination
	 */
	getScreeningsByTheatrePaginated(
		theatreId: number,
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Screening>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Screening>>(
				`${this.apiUrl}/theatre/${theatreId}/paginated`,
				{
					params,
				}
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching screenings by theatre:', error);
					return throwError(() => error);
				})
			);
	}
}
