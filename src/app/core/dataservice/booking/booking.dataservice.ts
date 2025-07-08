import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
	OccupiedSeatResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
	BookingSeat,
	MockPaymentDto,
	PaymentMode,
	PaymentSuccessResponse,
} from './booking.interface';
import { Seat } from '../seat/seat.interface';

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
	 * Create counter staff booking (for admin/counter bookings)
	 */
	createCounterStaffBooking(
		bookingData: CounterStaffCreateBookingDto
	): Observable<CreateBookingResponse> {
		return this.http
			.post<CreateBookingResponse>(
				`${this.apiUrl}/counter/confirm`,
				bookingData
			)
			.pipe(
				catchError((error) => {
					console.error('Error creating counter staff booking:', error);
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
	 * Get seat availability for a screening
	 */
	// getSeatAvailability(screeningId: number): Observable<{
	// 	totalSeats: number;
	// 	bookedSeats: number;
	// 	availableSeats: number;
	// 	seatStatus: { [seatId: string]: 'available' | 'booked' | 'selected' };
	// }> {
	// 	return this.http
	// 		.get<{
	// 			totalSeats: number;
	// 			bookedSeats: number;
	// 			availableSeats: number;
	// 			seatStatus: { [seatId: string]: 'available' | 'booked' | 'selected' };
	// 		}>(`${this.apiUrl}/screening/${screeningId}/seat-availability`)
	// 		.pipe(
	// 			catchError((error) => {
	// 				console.error('Error fetching seat availability:', error);
	// 				return throwError(() => error);
	// 			})
	// 		);
	// }

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

	//NEW SESSION-BASED BOOKING METHODS

	/**
	 * Initialize session for seat selection and get occupied seats
	 * This should be called when user enters the seat selection page
	 */
	initializeSessionSeats(
		screeningId: number,
		sessionId: string
	): Observable<OccupiedSeatResponse> {
		return this.http
			.post<OccupiedSeatResponse>(
				`${BASEAPI_URL}/booking/session/${sessionId}/initialize`,
				{ screeningId }
			)
			.pipe(
				catchError((error) => {
					console.error('Error initializing session seats:', error);
					return throwError(() => error);
				})
			);
	}

	findSeatsByHallId(hallId: number): Observable<Seat[]> {
		return this.http.get<Seat[]>(`${BASEAPI_URL}/seat/hall/${hallId}`).pipe(
			catchError((error) => {
				console.error('Error fetching seats by hall:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all occupied seats for a screening with session context
	 * Returns both confirmed bookings and temporary session selections
	 */
	getOccupiedSeatsBySession(
		screeningId: number,
		sessionId: string
	): Observable<OccupiedSeatResponse> {
		return this.http
			.get<OccupiedSeatResponse>(
				`${BASEAPI_URL}/booking/screening/${screeningId}/occupied-seats/${sessionId}`
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching occupied seats by session:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Select a seat for the current session
	 */
	selectSeatBySession(
		sessionId: string,
		seatSelectionDto: SeatSelectionDto
	): Observable<SeatSelectionResponse> {
		return this.http
			.post<SeatSelectionResponse>(
				`${BASEAPI_URL}/booking/select-seat/${sessionId}`,
				seatSelectionDto
			)
			.pipe(
				catchError((error) => {
					console.error('Error selecting seat by session:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Deselect a seat for the current session
	 */
	deselectSeatBySession(
		sessionId: string,
		seatSelectionDto: SeatSelectionDto
	): Observable<SeatSelectionResponse> {
		return this.http
			.post<SeatSelectionResponse>(
				`${BASEAPI_URL}/booking/deselect-seat/${sessionId}`,
				seatSelectionDto
			)
			.pipe(
				catchError((error) => {
					console.error('Error deselecting seat by session:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Clear all selected seats for the current session
	 */
	clearSessionSeats(sessionId: string): Observable<{
		success: boolean;
		message: string;
		clearedCount: number;
	}> {
		return this.http
			.post<{
				success: boolean;
				message: string;
				clearedCount: number;
			}>(`${BASEAPI_URL}/booking/session/${sessionId}/clear-seats`, {})
			.pipe(
				catchError((error) => {
					console.error('Error clearing session seats:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Refresh session timeout for selected seats
	 */
	refreshSessionTimeout(sessionId: string): Observable<{
		success: boolean;
		expiresAt: string;
		timeoutSeconds: number;
	}> {
		return this.http
			.post<{
				success: boolean;
				expiresAt: string;
				timeoutSeconds: number;
			}>(`${BASEAPI_URL}/booking/session/${sessionId}/refresh-timeout`, {})
			.pipe(
				catchError((error) => {
					console.error('Error refreshing session timeout:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * End session and cleanup selected seats
	 */
	endSession(sessionId: string): Observable<{
		success: boolean;
		message: string;
	}> {
		return this.http
			.post<{
				success: boolean;
				message: string;
			}>(`${BASEAPI_URL}/booking/session/${sessionId}/end`, {})
			.pipe(
				catchError((error) => {
					console.error('Error ending session:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Proceed to payment - Update booking status to PAYMENT_PENDING and extend timeout
	 * Extends expiration time to 15 minutes for payment completion
	 */
	proceedToPayment(
		sessionId: string,
		screeningId: number
	): Observable<{
		success: boolean;
		expiresAt: string;
		timeoutSeconds: number;
		booking: any;
	}> {
		return this.http
			.post<{
				success: boolean;
				expiresAt: string;
				timeoutSeconds: number;
				booking: any;
			}>(
				`${BASEAPI_URL}/booking/session/${sessionId}/screening/${screeningId}/proceed-to-payment`,
				{}
			)
			.pipe(
				catchError((error) => {
					console.error('Error proceeding to payment:', error);
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
	 * Mock payment success - Simulate successful payment processing
	 * This is for testing purposes to confirm booking without actual payment gateway
	 */
	mockPaymentSuccess(
		sessionId: string,
		screeningId: number,
		mockPaymentDto: MockPaymentDto
	): Observable<PaymentSuccessResponse> {
		// Set default values if not provided
		const paymentData: MockPaymentDto = {
			sessionId,
			screeningId,
			paymentMode: mockPaymentDto.paymentMode || PaymentMode.ZPSS,
			gatewayTransactionId:
				mockPaymentDto.gatewayTransactionId || `MOCK_TXN_${Date.now()}`,
			paymentInstructionNumber:
				mockPaymentDto.paymentInstructionNumber || `MOCK_PIN_${Date.now()}`,
			bfsTransactionId:
				mockPaymentDto.bfsTransactionId || `MOCK_BFS_${Date.now()}`,
			notes: mockPaymentDto.notes || 'Mock successful payment for testing',
		};

		return this.http
			.post<PaymentSuccessResponse>(
				`${BASEAPI_URL}/booking/session/${sessionId}/screening/${screeningId}/mock-payment-success`,
				paymentData
			)
			.pipe(
				catchError((error) => {
					console.error('Error processing mock payment:', error);
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
}
