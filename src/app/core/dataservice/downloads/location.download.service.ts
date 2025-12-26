import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';

/**
 * Location Download Service
 * Handles downloading location data (Enumeration Areas, Administrative Zones, Sub-Administrative Zones)
 * in various formats (GeoJSON, KML) at different hierarchy levels (National, Dzongkhag, Administrative Zone, Sub-Administrative Zone)
 */
@Injectable({
	providedIn: 'root',
})
export class LocationDownloadService {
	private apiUrl = `${BASEAPI_URL}/location/download`;

	constructor(private http: HttpClient) {}

	/**
	 * Get HTTP headers with authentication token
	 */
	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('access_token');
		return new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * NATIONAL DATA DOWNLOADS
	 * All endpoints are publicly accessible (no authentication required)
	 */

	/**
	 * Download all Dzongkhags as GeoJSON
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadAllDzongkhagsAsGeoJson(): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/national/dzongkhags/geojson`)
			.pipe(
				catchError((error) => {
					console.error('Error downloading all Dzongkhags as GeoJSON:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Dzongkhags as KML
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadAllDzongkhagsAsKml(): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/national/dzongkhags/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading all Dzongkhags as KML:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Enumeration Areas as GeoJSON
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadAllEAsAsGeoJson(): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/national/enumeration-areas/geojson`)
			.pipe(
				catchError((error) => {
					console.error('Error downloading all EAs as GeoJSON:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Enumeration Areas as KML
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadAllEAsAsKml(): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/national/enumeration-areas/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading all EAs as KML:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Sub-Administrative Zones (Chiwogs/LAP) as GeoJSON
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadAllSAZsAsGeoJson(): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/national/sub-administrative-zones/geojson`)
			.pipe(
				catchError((error) => {
					console.error('Error downloading all SAZs as GeoJSON:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Sub-Administrative Zones (Chiwogs/LAP) as KML
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadAllSAZsAsKml(): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/national/sub-administrative-zones/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading all SAZs as KML:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Administrative Zones (Gewogs/Thromde) as GeoJSON
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadAllAZsAsGeoJson(): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/national/administrative-zones/geojson`)
			.pipe(
				catchError((error) => {
					console.error('Error downloading all AZs as GeoJSON:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all Administrative Zones (Gewogs/Thromde) as KML
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadAllAZsAsKml(): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/national/administrative-zones/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading all AZs as KML:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * DZONGKHAG DATA DOWNLOADS
	 */

	/**
	 * Download Enumeration Areas by Dzongkhag as GeoJSON
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of GeoJSON object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadEAsByDzongkhagAsGeoJson(dzongkhagId: number): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/dzongkhag/${dzongkhagId}/enumeration-areas/geojson`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading EAs for dzongkhag ${dzongkhagId} as GeoJSON:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Enumeration Areas by Dzongkhag as KML
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of KML string
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadEAsByDzongkhagAsKml(dzongkhagId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/enumeration-areas/kml`, {
				headers: this.getAuthHeaders(),
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading EAs for dzongkhag ${dzongkhagId} as KML:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Administrative Zones by Dzongkhag as GeoJSON
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of GeoJSON object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadAZsByDzongkhagAsGeoJson(dzongkhagId: number): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/dzongkhag/${dzongkhagId}/administrative-zones/geojson`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading AZs for dzongkhag ${dzongkhagId} as GeoJSON:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Administrative Zones by Dzongkhag as KML
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of KML string
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadAZsByDzongkhagAsKml(dzongkhagId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/administrative-zones/kml`, {
				headers: this.getAuthHeaders(),
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading AZs for dzongkhag ${dzongkhagId} as KML:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Sub-Administrative Zones by Dzongkhag as GeoJSON
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of GeoJSON object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadSAZsByDzongkhagAsGeoJson(dzongkhagId: number): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/dzongkhag/${dzongkhagId}/sub-administrative-zones/geojson`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading SAZs for dzongkhag ${dzongkhagId} as GeoJSON:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Sub-Administrative Zones by Dzongkhag as KML
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of KML string
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadSAZsByDzongkhagAsKml(dzongkhagId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/sub-administrative-zones/kml`, {
				headers: this.getAuthHeaders(),
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading SAZs for dzongkhag ${dzongkhagId} as KML:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * ADMINISTRATIVE ZONE DATA DOWNLOADS
	 */

	/**
	 * Download Sub-Administrative Zones by Administrative Zone as GeoJSON
	 * @param administrativeZoneId - Administrative Zone ID
	 * @returns Observable of GeoJSON object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadSAZsByAdministrativeZoneAsGeoJson(administrativeZoneId: number): Observable<any> {
		return this.http
			.get<any>(
				`${this.apiUrl}/administrative-zone/${administrativeZoneId}/sub-administrative-zones/geojson`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading SAZs for administrative zone ${administrativeZoneId} as GeoJSON:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Sub-Administrative Zones by Administrative Zone as KML
	 * @param administrativeZoneId - Administrative Zone ID
	 * @returns Observable of KML string
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadSAZsByAdministrativeZoneAsKml(administrativeZoneId: number): Observable<string> {
		return this.http
			.get(
				`${this.apiUrl}/administrative-zone/${administrativeZoneId}/sub-administrative-zones/kml`,
				{
					headers: this.getAuthHeaders(),
					responseType: 'text',
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading SAZs for administrative zone ${administrativeZoneId} as KML:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Enumeration Areas by Administrative Zone as GeoJSON
	 * @param administrativeZoneId - Administrative Zone ID
	 * @returns Observable of GeoJSON object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadEAsByAdministrativeZoneAsGeoJson(administrativeZoneId: number): Observable<any> {
		return this.http
			.get<any>(
				`${this.apiUrl}/administrative-zone/${administrativeZoneId}/enumeration-areas/geojson`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading EAs for administrative zone ${administrativeZoneId} as GeoJSON:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Enumeration Areas by Administrative Zone as KML
	 * @param administrativeZoneId - Administrative Zone ID
	 * @returns Observable of KML string
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadEAsByAdministrativeZoneAsKml(administrativeZoneId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/administrative-zone/${administrativeZoneId}/enumeration-areas/kml`, {
				headers: this.getAuthHeaders(),
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading EAs for administrative zone ${administrativeZoneId} as KML:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * SUB-ADMINISTRATIVE ZONE DATA DOWNLOADS
	 */

	/**
	 * Download Enumeration Areas by Sub-Administrative Zone as GeoJSON
	 * @param subAdministrativeZoneId - Sub-Administrative Zone ID
	 * @returns Observable of GeoJSON object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadEAsBySubAdministrativeZoneAsGeoJson(subAdministrativeZoneId: number): Observable<any> {
		return this.http
			.get<any>(
				`${this.apiUrl}/sub-administrative-zone/${subAdministrativeZoneId}/enumeration-areas/geojson`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading EAs for sub-administrative zone ${subAdministrativeZoneId} as GeoJSON:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Enumeration Areas by Sub-Administrative Zone as KML
	 * @param subAdministrativeZoneId - Sub-Administrative Zone ID
	 * @returns Observable of KML string
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadEAsBySubAdministrativeZoneAsKml(subAdministrativeZoneId: number): Observable<string> {
		return this.http
			.get(
				`${this.apiUrl}/sub-administrative-zone/${subAdministrativeZoneId}/enumeration-areas/kml`,
				{
					headers: this.getAuthHeaders(),
					responseType: 'text',
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading EAs for sub-administrative zone ${subAdministrativeZoneId} as KML:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * DZONGKHAG VIEWER PUBLIC DOWNLOADS
	 * All endpoints are publicly accessible (no authentication required)
	 * Designed specifically for the dzongkhag data viewer
	 */

	/**
	 * Download Gewog/Thromde (Administrative Zones) by Dzongkhag as GeoJSON
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadGewogThromdeByDzongkhagAsGeoJson(dzongkhagId: number): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/dzongkhag/${dzongkhagId}/gewog-thromde/geojson`)
			.pipe(
				catchError((error) => {
					console.error(`Error downloading gewog/thromde for dzongkhag ${dzongkhagId} as GeoJSON:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Gewog/Thromde (Administrative Zones) by Dzongkhag as KML
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadGewogThromdeByDzongkhagAsKml(dzongkhagId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/gewog-thromde/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading gewog/thromde for dzongkhag ${dzongkhagId} as KML:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Chiwog/LAP (Sub-Administrative Zones) by Dzongkhag as GeoJSON
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadChiwogLapByDzongkhagAsGeoJson(dzongkhagId: number): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/dzongkhag/${dzongkhagId}/chiwog-lap/geojson`)
			.pipe(
				catchError((error) => {
					console.error(`Error downloading chiwog/lap for dzongkhag ${dzongkhagId} as GeoJSON:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Chiwog/LAP (Sub-Administrative Zones) by Dzongkhag as KML
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadChiwogLapByDzongkhagAsKml(dzongkhagId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/chiwog-lap/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading chiwog/lap for dzongkhag ${dzongkhagId} as KML:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Enumeration Areas by Dzongkhag as GeoJSON (Public)
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of GeoJSON object
	 * @public - No authentication required
	 */
	downloadEAsByDzongkhagAsGeoJsonPublic(dzongkhagId: number): Observable<any> {
		return this.http
			.get<any>(`${this.apiUrl}/dzongkhag/${dzongkhagId}/enumeration-areas/geojson`)
			.pipe(
				catchError((error) => {
					console.error(`Error downloading EAs for dzongkhag ${dzongkhagId} as GeoJSON (public):`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Enumeration Areas by Dzongkhag as KML (Public)
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable of KML string
	 * @public - No authentication required
	 */
	downloadEAsByDzongkhagAsKmlPublic(dzongkhagId: number): Observable<string> {
		return this.http
			.get(`${this.apiUrl}/dzongkhag/${dzongkhagId}/enumeration-areas/kml`, {
				responseType: 'text',
			})
			.pipe(
				catchError((error) => {
					console.error(`Error downloading EAs for dzongkhag ${dzongkhagId} as KML (public):`, error);
					return throwError(() => error);
				})
			);
	}
}

