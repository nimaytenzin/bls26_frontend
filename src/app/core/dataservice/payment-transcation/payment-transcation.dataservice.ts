import { Injectable } from '@angular/core';
import { PaymentTransaction } from '../payment-settlement/payment-settlement.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedData } from '../../utility/pagination.interface';
import { catchError, Observable, throwError } from 'rxjs';
import { BASEAPI_URL } from '../../constants/constants';
import { PaymentTransactionStatistics } from './payment-transcation.interface';

@Injectable({
	providedIn: 'root',
})
export class PaymentTranscationDataService {
	private readonly apiUrl = `${BASEAPI_URL}/payment-transaction`;
	constructor(private http: HttpClient) {}

	/**
	 * Get todays payment transcations paginnated
	 */
	getTodaysPaymentTransactionPaginated(
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<PaymentTransaction>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<PaymentTransaction>>(
				`${this.apiUrl}/today/paginated`,
				{
					params,
				}
			)
			.pipe(
				catchError((error) => {
					console.error("Error fetching today's payment transactions:", error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get  payment transcations paginnated by date
	 */
	getPaymentTransactionPaginatedByDate(
		date: string,
		page: number = 1,
		pageSize: number = 10
	): Observable<PaginatedData<PaymentTransaction>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		return this.http
			.get<PaginatedData<PaymentTransaction>>(
				`${this.apiUrl}/date/${date}/paginated`,
				{
					params,
				}
			)
			.pipe(
				catchError((error) => {
					console.error('Error fetching payment transactions by date:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get transaction statistics by date
	 */
	getTransactionStatisticsByDate(date: string) {
		return this.http
			.get<PaymentTransactionStatistics>(`${this.apiUrl}/statistics/${date}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching transaction statistics:', error);
					return throwError(() => error);
				})
			);
	}
}
