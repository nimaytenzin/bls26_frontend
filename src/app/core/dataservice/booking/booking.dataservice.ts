import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	ApiResponse,
	Booking,
	CounterStaffCreateBookingDto,
} from './booking.interface';

@Injectable({
	providedIn: 'root',
})
export class CounterstaffBookingDataService {
	private readonly apiUrl = `${BASEAPI_URL}/staff/booking`;

	constructor(private http: HttpClient) {}

	/**
	 * Create new dzongkhag
	 */
	createBooking(
		data: CounterStaffCreateBookingDto
	): Observable<ApiResponse<Booking>> {
		return this.http
			.post<ApiResponse<Booking>>(this.apiUrl + '/counter', data)
			.pipe(
				catchError((error) => {
					console.error('Error creating booking:', error);
					return throwError(() => error);
				})
			);
	}
}
