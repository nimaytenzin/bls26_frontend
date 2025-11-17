import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	TotalCountsResponse,
	DzongkhagCountsResponse,
} from './statistics.interface';

@Injectable({
	providedIn: 'root',
})
export class StatisticsDataService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/statistics`;

	constructor(private http: HttpClient) {}

	/**
	 * Get total counts of all location entities
	 * @returns Observable<TotalCountsResponse>
	 */
	getTotalCounts(): Observable<TotalCountsResponse> {
		return this.http.get<TotalCountsResponse>(`${this.baseUrl}/total-counts`);
	}

	/**
	 * Get counts by dzongkhag
	 * @returns Observable<DzongkhagCountsResponse[]>
	 */
	getCountsByDzongkhag(): Observable<DzongkhagCountsResponse[]> {
		return this.http.get<DzongkhagCountsResponse[]>(
			`${this.baseUrl}/counts-by-dzongkhag`
		);
	}
}
