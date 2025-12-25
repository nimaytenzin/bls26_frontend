import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';

/**
 * Annual Statistics Download Service
 * Handles downloading annual statistics data as CSV at different hierarchy levels
 * (National, Dzongkhag, Administrative Zone, Sub-Administrative Zone)
 * @access Public, Admin, Supervisor
 */
@Injectable({
	providedIn: 'root',
})
export class AnnualStatisticsDownloadService {
	private apiUrl = `${BASEAPI_URL}/annual-statistics-download`;

	constructor(private http: HttpClient) {}

	/**
	 * Download national statistics (all Dzongkhags) as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @param includeAZ - Optional flag to include Administrative Zone breakdown (default: false)
	 * @param includeSAZ - Optional flag to include Sub-Administrative Zone breakdown (default: false, requires includeAZ=true)
	 * @returns Observable of CSV string
	 * @access Public, Admin, Supervisor
	 */
	downloadNationalStats(
		year?: number,
		includeAZ?: boolean,
		includeSAZ?: boolean
	): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}
		if (includeAZ !== undefined && includeAZ) {
			params.includeAZ = 'true';
		}
		if (includeSAZ !== undefined && includeSAZ && includeAZ) {
			params.includeSAZ = 'true';
		}

		return this.http
			.get(`${this.apiUrl}/national/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading national statistics CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download statistics by Dzongkhag as CSV
	 * @param dzongkhagId - Dzongkhag ID
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @access Public, Admin, Supervisor
	 */
	downloadDzongkhagStats(
		dzongkhagId: number,
		year?: number
	): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading dzongkhag ${dzongkhagId} statistics CSV:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download statistics by Administrative Zone as CSV
	 * @param administrativeZoneId - Administrative Zone ID
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @access Public, Admin, Supervisor
	 */
	downloadAdministrativeZoneStats(
		administrativeZoneId: number,
		year?: number
	): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/administrative-zone/${administrativeZoneId}/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading administrative zone ${administrativeZoneId} statistics CSV:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download statistics by Sub-Administrative Zone as CSV
	 * @param subAdministrativeZoneId - Sub-Administrative Zone ID
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @access Public, Admin, Supervisor
	 */
	downloadSubAdministrativeZoneStats(
		subAdministrativeZoneId: number,
		year?: number
	): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(
				`${this.apiUrl}/sub-administrative-zone/${subAdministrativeZoneId}/csv`,
				{
					params,
					responseType: 'text',
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading sub-administrative zone ${subAdministrativeZoneId} statistics CSV:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
}

