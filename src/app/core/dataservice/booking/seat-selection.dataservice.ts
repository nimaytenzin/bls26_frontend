import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	Booking,
	UpdateUserDetailsDto,
	SessionSeatOccupancyResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
	CounterStaffCreateBookingDto,
	CreateBookingResponse,
} from './booking.interface';

@Injectable({
	providedIn: 'root',
})
export class SeatSelectionDataService {
	private readonly apiUrl = `${BASEAPI_URL}/seat-selection`;

	constructor(private http: HttpClient) {}

	/**
	 * Initialize session for seat selection and get occupied seats
	 * This should be called when user enters the seat selection page
	 */
	initializeSessionSeats(
		screeningId: number,
		sessionId: string
	): Observable<SessionSeatOccupancyResponse> {
		return this.http
			.post<SessionSeatOccupancyResponse>(
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

	/**
	 * Get all occupied seats for a screening with session context
	 * Returns both confirmed bookings and temporary session selections
	 */
	getSeatOccupancyStatusBySession(
		screeningId: number,
		sessionId: string
	): Observable<SessionSeatOccupancyResponse> {
		return this.http
			.get<SessionSeatOccupancyResponse>(
				`${this.apiUrl}/occupied-seats/${screeningId}/${sessionId}`
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
				`${this.apiUrl}/select/${sessionId}`,
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
				`${this.apiUrl}/deselect/${sessionId}`,
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
				`${this.apiUrl}/session/${sessionId}/screening/${screeningId}/proceed-to-payment`,
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
	 * Create counter staff booking (for admin/counter bookings)
	 */
	counterStaffConfirmBooking(
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
}
