import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';

// GeoJSON Feature type
export interface GeoJSONFeature {
	type: 'Feature';
	geometry: {
		type: string;
		coordinates: any;
	};
	properties?: any;
}

// Dzongkhag basic info with geometry
export interface DzongkhagInfo {
	id: number;
	name: string;
	code: string;
	geometry: GeoJSONFeature;
}

// Summary statistics
export interface DzongkhagSummary {
	totalGewogs: number;
	totalChiwogs: number;
	totalEAs: number;
	totalHouseholds?: number;
	totalPopulation?: number;
}

// Enumeration Area data
export interface EnumerationAreaData {
	id: number;
	name: string;
	code: string;
	geometry: GeoJSONFeature;
	totalHouseholds?: number;
	totalPopulation?: number;
}

// Chiwog data
export interface ChiwogData {
	id: number;
	name: string;
	code: string;
	geometry?: GeoJSONFeature;
	summary: {
		totalEAs: number;
	};
	enumerationAreas: EnumerationAreaData[];
}

// Gewog data
export interface GewogData {
	id: number;
	name: string;
	code: string;
	geometry: GeoJSONFeature;
	summary: {
		totalChiwogs: number;
		totalEAs: number;
	};
	chiwogs: ChiwogData[];
}

// Main response interface
export interface DzongkhagEASummaryResponse {
	generatedAt: string;
	dzongkhag: DzongkhagInfo;
	summary: DzongkhagSummary;
	gewogs: GewogData[];
}

// Map data response (GeoJSON FeatureCollection)
export interface MapDataResponse {
	type: 'FeatureCollection';
	features: GeoJSONFeature[];
}

@Injectable({
	providedIn: 'root',
})
export class DzongkhagEASummaryDataService {
	private readonly apiUrl = `${BASEAPI_URL}/reports/dzongkhag-ea-summary`;

	constructor(private http: HttpClient) {}

	/**
	 * Get report data as JSON for a specific dzongkhag
	 * @param dzongkhagId - The ID of the dzongkhag
	 * @returns Observable<DzongkhagEASummaryResponse>
	 */
	getReportData(dzongkhagId: number): Observable<DzongkhagEASummaryResponse> {
		return this.http
			.get<DzongkhagEASummaryResponse>(
				`${this.apiUrl}/${dzongkhagId}/data`
			)
			.pipe(
				catchError((error: HttpErrorResponse) => {
					console.error(
						'Error fetching dzongkhag EA summary report:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get map data as GeoJSON FeatureCollection
	 * @param dzongkhagId - The ID of the dzongkhag
	 * @returns Observable<MapDataResponse>
	 */
	getMapData(dzongkhagId: number): Observable<MapDataResponse> {
		return this.http
			.get<MapDataResponse>(`${this.apiUrl}/${dzongkhagId}/map`)
			.pipe(
				catchError((error: HttpErrorResponse) => {
					console.error('Error fetching map data:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download PDF report
	 * @param dzongkhagId - The ID of the dzongkhag
	 * @returns Observable<Blob>
	 */
	downloadPDF(dzongkhagId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/${dzongkhagId}/pdf?download=true`, {
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
	 * @param dzongkhagId - The ID of the dzongkhag
	 * @returns Observable<Blob>
	 */
	downloadExcel(dzongkhagId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/${dzongkhagId}/excel`, {
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

