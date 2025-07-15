import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import { ApiResponse, Movie } from '../movie/movie.interface';
import { Screening } from '../screening/screening.interface';
import { Seat } from '../seat/seat.interface';
import {
	Booking,
	CustomerBookingDto,
	CreateBookingResponse,
	BookedSeatDto,
	SessionSeatOccupancyResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
} from '../booking/booking.interface';

@Injectable({
	providedIn: 'root',
})
export class PublicDataService {
	constructor(private http: HttpClient) {}

	/**
	 * Get all movies
	 */
	findAllMovies(): Observable<Movie[]> {
		return this.http.get<ApiResponse<Movie[]>>(`${BASEAPI_URL}/movies`).pipe(
			map((response) => response.data),
			catchError((error) => {
				console.error('Error fetching movies:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get movie by ID
	 */
	findMovieById(id: number): Observable<Movie> {
		return this.http
			.get<ApiResponse<Movie>>(`${BASEAPI_URL}/movies/${id}`)
			.pipe(
				map((response) => response.data),
				catchError((error) => {
					console.error('Error fetching movie:', error);
					return throwError(() => error);
				})
			);
	}

	findScreeningsByMovieId(movieId: number): Observable<Screening[]> {
		return this.http
			.get<ApiResponse<Screening[]>>(
				`${BASEAPI_URL}/screening/movie/${movieId}`
			)
			.pipe(
				map((response) => response.data),
				catchError((error) => {
					console.error('Error fetching screenings for movie:', error);
					return throwError(() => error);
				})
			);
	}

	findScrenningsByMovieAndDate(
		movieId: number,
		date: string
	): Observable<Screening[]> {
		return this.http
			.get<Screening[]>(
				`${BASEAPI_URL}/screening/movie/${movieId}/date/${date}`
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching screenings for movie:', error);
					return throwError(() => error);
				})
			);
	}

	findScreeningById(id: number): Observable<Screening> {
		return this.http.get<Screening>(`${BASEAPI_URL}/screening/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching screening:', error);
				return throwError(() => error);
			})
		);
	}

	findBookingsByScreeningId(screeningId: number): Observable<Booking[]> {
		return this.http
			.get<Booking[]>(`${BASEAPI_URL}/booking/screening/${screeningId}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching bookings by screening:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create customer booking (for public booking)
	 */
	createCustomerBooking(
		bookingData: CustomerBookingDto
	): Observable<ApiResponse<Booking>> {
		return this.http
			.post<ApiResponse<Booking>>(
				`${BASEAPI_URL}/public/booking/customer`,
				bookingData
			)
			.pipe(
				catchError((error) => {
					console.error('Error creating customer booking:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all occupied seats for a screening (CONFIRMED + active PENDING)
	 * Used when user enters screening page to render seat map
	 */
	getOccupiedSeats(
		screeningId: number
	): Observable<SessionSeatOccupancyResponse[]> {
		return this.http
			.get<SessionSeatOccupancyResponse[]>(
				`${BASEAPI_URL}/booking/screening/${screeningId}/occupied-seats`
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching occupied seats:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Handle seat selection with session management
	 * Used when user selects a seat
	 */
	selectSeat(seatSelectionDto: SeatSelectionDto) {
		// return this.http
		// 	.post<SeatSelectionResponse>(
		// 		`${BASEAPI_URL}/booking/select-seat/${seatSelectionDto.sessionId}`,
		// 		seatSelectionDto
		// 	)
		// 	.pipe(
		// 		catchError((error) => {
		// 			console.error('Error selecting seats:', error);
		// 			return throwError(() => error);
		// 		})
		// 	);
	}

	/**
	 * Handle seat deselection with session management
	 * Used when user deselects a specific seat
	 */
	deselectSeat(seatSelectionDto: SeatSelectionDto) {
		// return this.http
		// 	.post<SeatSelectionResponse>(
		// 		`${BASEAPI_URL}/booking/deselect-seat/${seatSelectionDto.sessionId}`,
		// 		seatSelectionDto
		// 	)
		// 	.pipe(
		// 		catchError((error) => {
		// 			console.error('Error deselecting seat:', error);
		// 			return throwError(() => error);
		// 		})
		// 	);
	}
}
