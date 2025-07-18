import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	ApiResponse,
	Booking,
	CounterStaffCreateBookingDto,
	CustomerBookingDto,
	CreateBookingResponse,
	UpdateBookingDto,
	UpdateUserDetailsDto,
} from './booking.interface';
import { PaginatedData } from '../../utility/pagination.interface';

@Injectable({
	providedIn: 'root',
})
export class BookingDataService {
	private readonly apiUrl = `${BASEAPI_URL}/booking`;
	private readonly staffApiUrl = `${BASEAPI_URL}/staff/booking`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all bookings with optional filters
	 */
	findAllBookings(): Observable<Booking[]> {
		return this.http.get<Booking[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching bookings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get booking by ID
	 */
	findBookingById(id: number): Observable<Booking> {
		return this.http.get<Booking>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching booking:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get bookings by screening ID
	 */
	findBookingsByScreeningId(screeningId: number): Observable<Booking[]> {
		return this.http
			.get<Booking[]>(`${this.apiUrl}/screening/${screeningId}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching bookings by screening:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all confirmed bookings by screening ID
	 */
	findAllConfirmedBookingsByScreeningId(
		screeningId: number
	): Observable<Booking[]> {
		return this.http
			.get<Booking[]>(`${this.apiUrl}/screening/${screeningId}/confirmed`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching bookings by screening:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create customer booking (for online bookings)
	 */
	createCustomerBooking(
		bookingData: CustomerBookingDto
	): Observable<ApiResponse<CreateBookingResponse>> {
		return this.http
			.post<ApiResponse<CreateBookingResponse>>(
				`${this.apiUrl}/customer`,
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
	 * Legacy method for compatibility
	 */
	createBooking(
		data: CounterStaffCreateBookingDto
	): Observable<ApiResponse<Booking>> {
		return this.http
			.post<ApiResponse<Booking>>(this.staffApiUrl + '/counter', data)
			.pipe(
				catchError((error) => {
					console.error('Error creating booking:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update booking
	 */
	updateBooking(
		id: number,
		bookingData: UpdateBookingDto
	): Observable<ApiResponse<Booking>> {
		return this.http
			.patch<ApiResponse<Booking>>(`${this.apiUrl}/${id}`, bookingData)
			.pipe(
				catchError((error) => {
					console.error('Error updating booking:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Cancel booking
	 */
	cancelBooking(id: number): Observable<ApiResponse<Booking>> {
		return this.http
			.patch<ApiResponse<Booking>>(`${this.apiUrl}/${id}/cancel`, {})
			.pipe(
				catchError((error) => {
					console.error('Error cancelling booking:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Mark booking as entered
	 */
	markAsEntered(id: number): Observable<ApiResponse<Booking>> {
		return this.http
			.patch<ApiResponse<Booking>>(`${this.apiUrl}/${id}/entered`, {})
			.pipe(
				catchError((error) => {
					console.error('Error marking booking as entered:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete booking (admin only)
	 */
	deleteBooking(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting booking:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update user details in booking using session
	 * Updates customer information for an existing booking in the current session
	 */
	updateUserDetails(
		sessionId: string,
		screeningId: number,
		updateUserDetailsDto: UpdateUserDetailsDto
	): Observable<{
		success: boolean;
		message: string;
	}> {
		return this.http
			.put<{
				success: boolean;
				message: string;
			}>(
				`${BASEAPI_URL}/booking/session/${sessionId}/screening/${screeningId}/update-user-details`,
				updateUserDetailsDto
			)
			.pipe(
				catchError((error) => {
					console.error('Error updating user details:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get booking details by session and screening ID
	 * Used to retrieve current booking state during seat selection and payment flow
	 * Returns only paid bookings, throws error if booking is not confirmed/paid
	 */
	getBookingBySession(
		sessionId: string,
		bookingId: number
	): Observable<Booking> {
		return this.http
			.get<Booking>(
				`${BASEAPI_URL}/booking/session/${sessionId}/screening/${bookingId}`
			)
			.pipe(
				catchError((error) => {
					console.error('Error getting booking by session:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Search bookings by customer phone number or email
	 */
	searchBookings(phoneNumber?: string, email?: string): Observable<Booking[]> {
		let params = new URLSearchParams();
		if (phoneNumber) {
			params.append('phoneNumber', phoneNumber);
		}
		if (email) {
			params.append('email', email);
		}

		return this.http
			.get<Booking[]>(`${this.apiUrl}/search/params?${params.toString()}`)
			.pipe(
				catchError((error) => {
					console.error('Error searching bookings:', error);
					return throwError(() => error);
				})
			);
	}

	//PAGINATED ROUTES BY BOOKING STATUS

	/**
	 * Get movies by screening status paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getConfirmedBookingsPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Booking>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Booking>>(`${this.apiUrl}/confirmed/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching confirmed bookings`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get processing bookings paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getUnderProcessingBookingsPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Booking>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Booking>>(`${this.apiUrl}/under-process/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching under process bookings`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get failed bookings paginated
	 * @param page - Page number
	 * @param pageSize - Number of items per page
	 */
	getFailedBookingsPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<Booking>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<Booking>>(`${this.apiUrl}/failed/paginated`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching failed bookings`, error);
					return throwError(() => error);
				})
			);
	}

	resendEticket(bookingId: number): Observable<{ success: boolean }> {
		return this.http
			.post<{ success: boolean }>(
				`${this.apiUrl}/send-eticket/${bookingId}`,
				{}
			)
			.pipe(
				catchError((error) => {
					console.error(`Error sending eticket`, error);
					return throwError(() => error);
				})
			);
	}

	scanTicket(uuid: string): Observable<Booking> {
		return this.http.get<Booking>(`${this.apiUrl}/scan/ticket/${uuid}`).pipe(
			catchError((error) => {
				console.error(`Error scanning ticket`, error);
				return throwError(() => error);
			})
		);
	}
}
