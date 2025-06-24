import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	ClientInitiatePaymentDTO,
	PaymentInitiationResponseDTO,
	AERequestDTO,
	ClientECMessage,
	DRRequestDTO,
	ClientDebitSuccessDTO,
	ErrorResponse,
	ClientInitiatePaymentUseSessionDTO,
} from './payment-settlement.interface';

@Injectable({
	providedIn: 'root',
})
export class PaymentSettlementDataService {
	private readonly apiUrl = `${BASEAPI_URL}/payment-settlement`;

	constructor(private http: HttpClient) {}

	/**
	 * Initiate payment process
	 * This starts the payment flow and returns bank list and transaction details
	 */
	initiatePayment(
		paymentData: ClientInitiatePaymentDTO
	): Observable<PaymentInitiationResponseDTO | ErrorResponse> {
		return this.http
			.post<PaymentInitiationResponseDTO | ErrorResponse>(
				`${this.apiUrl}/initiate-payment`,
				paymentData
			)
			.pipe(
				catchError((error) => {
					console.error('Error initiating payment:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Initiate payment process - use session
	 * This starts the payment flow and returns bank list and transaction details
	 */
	initiatePaymentUsingSessionScreening(
		paymentData: ClientInitiatePaymentUseSessionDTO
	): Observable<PaymentInitiationResponseDTO | ErrorResponse> {
		return this.http
			.post<PaymentInitiationResponseDTO | ErrorResponse>(
				`${this.apiUrl}/initiate-payment/session`,
				paymentData
			)
			.pipe(
				catchError((error) => {
					console.error('Error initiating payment:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Send Account Enquiry (AE) Request
	 * This validates the account number and bank details
	 */
	sendAERequest(
		aeData: AERequestDTO
	): Observable<ClientECMessage | ErrorResponse> {
		return this.http
			.post<ClientECMessage | ErrorResponse>(
				`${this.apiUrl}/ae-request`,
				aeData
			)
			.pipe(
				catchError((error) => {
					console.error('Error sending AE request:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Send Debit Request (DR) with OTP
	 * This processes the final payment with OTP validation
	 */
	sendDRRequest(
		drData: DRRequestDTO
	): Observable<ClientDebitSuccessDTO | ErrorResponse> {
		return this.http
			.post<ClientDebitSuccessDTO | ErrorResponse>(
				`${this.apiUrl}/dr-request`,
				drData
			)
			.pipe(
				catchError((error) => {
					console.error('Error sending DR request:', error);
					return throwError(() => error);
				})
			);
	}
}
