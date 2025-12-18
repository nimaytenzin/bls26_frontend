import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';

export interface GeographicStatisticalCodeResponse {
	generatedAt: string;
	totalDzongkhags: number;
	totalEAs: number;
	totalUrbanEAs: number;
	totalRuralEAs: number;
	dzongkhags: DzongkhagReportData[];
}

export interface DzongkhagReportData {
	id: number;
	name: string;
	code: string;
	summary: DzongkhagSummary;
	urbanEAs: EnumerationAreaReportRow[];
	ruralEAs: EnumerationAreaReportRow[];
}

export interface DzongkhagSummary {
	totalGewogs: number;
	totalThromdes: number;
	totalChiwogs: number;
	totalLaps: number;
	totalEAs: number;
	urbanEAs: number;
	ruralEAs: number;
}

export interface EnumerationAreaReportRow {
	eaId: number;
	eaName: string;
	eaCode: string;
	administrativeZone: {
		id: number;
		name: string;
		code: string;
		type: 'Gewog' | 'Thromde';
	};
	subAdministrativeZone: {
		id: number;
		name: string;
		code: string;
		type: 'chiwog' | 'lap';
	};
}

@Injectable({
	providedIn: 'root',
})
export class GeographicStatisticalCodeDataService {
	private readonly apiUrl = `${BASEAPI_URL}/reports/geographic-statistical-code`;

	constructor(private http: HttpClient) {}

	/**
	 * Get report data as JSON
	 * @returns Observable<GeographicStatisticalCodeResponse>
	 */
	getReportData(): Observable<GeographicStatisticalCodeResponse> {
		return this.http
			.get<GeographicStatisticalCodeResponse>(`${this.apiUrl}/data`)
			.pipe(
				catchError((error: HttpErrorResponse) => {
					console.error('Error fetching geographic statistical code report:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download PDF report
	 * @returns Observable<Blob>
	 */
	downloadPDF(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/pdf?download=true`, {
				responseType: 'blob',
			})
			.pipe(
				catchError((error: HttpErrorResponse) => {
					console.error('Error downloading PDF report:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Excel report
	 * @returns Observable<Blob>
	 */
	downloadExcel(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/excel`, {
				responseType: 'blob',
			})
			.pipe(
				catchError((error: HttpErrorResponse) => {
					console.error('Error downloading Excel report:', error);
					return throwError(() => error);
				})
			);
	}
}

