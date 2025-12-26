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

	/**
	 * NATIONAL VIEWER CSV DOWNLOADS
	 * All endpoints are publicly accessible (no authentication required)
	 * Designed specifically for the national data viewer
	 */

	/**
	 * Download all Dzongkhags with basic statistics as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadNationalViewerDzongkhags(year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/national-viewer/dzongkhags/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading national viewer dzongkhags CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Dzongkhag with Gewog/Thromde breakdown as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadNationalViewerDzongkhagGewogThromde(year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/national-viewer/dzongkhag-gewog-thromde/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading national viewer dzongkhag-gewog-thromde CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Dzongkhag with Chiwog/LAP breakdown as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadNationalViewerDzongkhagChiwogLap(year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/national-viewer/dzongkhag-chiwog-lap/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading national viewer dzongkhag-chiwog-lap CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download full hierarchy (Dzongkhag → Gewog/Thromde → Chiwog/LAP → EA) as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadNationalViewerFullHierarchy(year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/national-viewer/full-hierarchy/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading national viewer full hierarchy CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download rural full hierarchy (Dzongkhag → Gewog → Chiwog → EA) as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadRuralFullHierarchyForNationalViewer(year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/national-viewer/rural-full-hierarchy/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading rural full hierarchy CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download urban full hierarchy (Dzongkhag → Thromde → LAP → EA) as CSV
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadUrbanFullHierarchyForNationalViewer(year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/national-viewer/urban-full-hierarchy/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading urban full hierarchy CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * DZONGKHAG VIEWER CSV DOWNLOADS
	 * All endpoints are publicly accessible (no authentication required)
	 * Designed specifically for the dzongkhag data viewer
	 */

	/**
	 * Download Dzongkhag Sampling Frame (Overall) as CSV
	 * Returns: Dzongkhag → AZ → SAZ → EA (both rural and urban)
	 * @param dzongkhagId - Dzongkhag ID
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadDzongkhagSamplingFrame(dzongkhagId: number, year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/sampling-frame/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading dzongkhag ${dzongkhagId} sampling frame CSV:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Dzongkhag Rural Sampling Frame as CSV
	 * Returns: Dzongkhag → Gewog → Chiwog → EA (rural only)
	 * @param dzongkhagId - Dzongkhag ID
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadDzongkhagRuralSamplingFrame(dzongkhagId: number, year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/rural-sampling-frame/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading dzongkhag ${dzongkhagId} rural sampling frame CSV:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Dzongkhag Urban Sampling Frame as CSV
	 * Returns: Dzongkhag → Thromde → LAP → EA (urban only)
	 * @param dzongkhagId - Dzongkhag ID
	 * @param year - Optional year (defaults to latest available year)
	 * @returns Observable of CSV string
	 * @public - No authentication required
	 */
	downloadDzongkhagUrbanSamplingFrame(dzongkhagId: number, year?: number): Observable<string> {
		const params: any = {};
		if (year) {
			params.year = year.toString();
		}

		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/urban-sampling-frame/csv`, {
				params,
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading dzongkhag ${dzongkhagId} urban sampling frame CSV:`, error);
					return throwError(() => error);
				})
			);
	}
}

