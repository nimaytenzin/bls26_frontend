import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	BulkUploadResponse,
	CreateEnumerationAreaDto,
	CreateTwoSazsWithEaRequest,
	CreateTwoSazsWithEaResponse,
	EnumerationArea,
	EnumerationAreaGeoJSON,
	UpdateEnumerationAreaDto,
} from './enumeration-area.dto';

@Injectable({
	providedIn: 'root',
})
export class EnumerationAreaDataService {
	private readonly apiUrl = `${BASEAPI_URL}/enumeration-area`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all enumeration areas
	 * @param withGeom - Include geometry (default: false)
	 * @param subAdministrativeZoneId - Filter by SAZ ID
	 * @param includeSubAdminZone - Include linked SAZs (default: false)
	 */
	findAllEnumerationAreas(
		withGeom: boolean = false,
		subAdministrativeZoneId?: number,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (subAdministrativeZoneId !== undefined)
			params = params.set('subAdministrativeZoneId', subAdministrativeZoneId.toString());
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http.get<EnumerationArea[]>(this.apiUrl, { params }).pipe(
			catchError((error) => {
				console.error('Error fetching enumeration areas:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all enumeration areas by sub-administrative zone ID
	 * Uses query parameter instead of path parameter per new API
	 */
	findEnumerationAreasBySubAdministrativeZone(
		subAdministrativeZoneId: number,
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		params = params.set('subAdministrativeZoneId', subAdministrativeZoneId.toString());
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http
			.get<EnumerationArea[]>(this.apiUrl, { params })
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration areas by sub-administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumeration areas by administrative zone ID
	 * @param administrativeZoneId - Administrative zone ID
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include sub-administrative zone data (default: false)
	 * @returns Observable<EnumerationArea[]> - Array of enumeration areas
	 */
	findByAdministrativeZone(
		administrativeZoneId: number,
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http
			.get<EnumerationArea[]>(
				`${this.apiUrl}/by-administrative-zone/${administrativeZoneId}`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration areas by administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumeration areas as GeoJSON
	 */
	getAllEnumerationAreaGeojson(): Observable<EnumerationAreaGeoJSON> {
		return this.http
			.get<EnumerationAreaGeoJSON>(`${this.apiUrl}/geojson/all`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching enumeration area geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get single enumeration area as GeoJSON
	 * @param id - Enumeration Area ID
	 * @returns GeoJSON Feature
	 */
	findOneAsGeoJson(id: number): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/geojson/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching enumeration area as GeoJSON:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all enumeration areas by sub-administrative zone ID as GeoJSON
	 */
	getEnumerationAreaGeojsonBySubAdministrativeZone(
		subAdministrativeZoneId: number
	): Observable<EnumerationAreaGeoJSON> {
		return this.http
			.get<EnumerationAreaGeoJSON>(
				`${this.apiUrl}/geojson/by-sub-administrative-zone/${subAdministrativeZoneId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration area geojson by sub-administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumeration areas by administrative zone ID as GeoJSON
	 * @param administrativeZoneId - Administrative zone ID
	 * @returns Observable<EnumerationAreaGeoJSON> - GeoJSON FeatureCollection
	 */
	findAllAsGeoJsonByAdministrativeZone(
		administrativeZoneId: number
	): Observable<EnumerationAreaGeoJSON> {
		return this.http
			.get<EnumerationAreaGeoJSON>(
				`${this.apiUrl}/geojson/by-administrative-zone/${administrativeZoneId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration area geojson by administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get enumeration area by ID
	 * @param id - Enumeration Area ID
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include linked SAZs (default: false)
	 */
	findEnumerationAreaById(
		id: number,
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http.get<EnumerationArea>(`${this.apiUrl}/${id}`, { params }).pipe(
			catchError((error) => {
				console.error('Error fetching enumeration area:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new enumeration area
	 */
	createEnumerationArea(
		data: CreateEnumerationAreaDto
	): Observable<ApiResponse<EnumerationArea>> {
		return this.http.post<ApiResponse<EnumerationArea>>(this.apiUrl, data).pipe(
			catchError((error) => {
				console.error('Error creating enumeration area:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update existing enumeration area
	 */
	updateEnumerationArea(
		id: number,
		data: UpdateEnumerationAreaDto
	): Observable<ApiResponse<EnumerationArea>> {
		return this.http
			.patch<ApiResponse<EnumerationArea>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating enumeration area:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete enumeration area
	 */
	deleteEnumerationArea(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting enumeration area:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Upload GeoJSON file for enumeration area
	 */
	uploadGeojsonByEnumerationArea(
		enumerationAreaId: number,
		file: File
	): Observable<ApiResponse<EnumerationArea>> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<ApiResponse<EnumerationArea>>(
				`${this.apiUrl}/upload-geojson/${enumerationAreaId}`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk upload GeoJSON file to create multiple enumeration areas
	 * @param file GeoJSON FeatureCollection file containing multiple enumeration areas
	 * @returns Observable with bulk upload results including success count, skipped items, and errors
	 */
	bulkUploadGeojson(file: File): Observable<BulkUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload-geojson`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error bulk uploading geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create two SAZs from GeoJSON files and a single EA that links to both
	 * @param saz1File - GeoJSON file for SAZ1
	 * @param saz2File - GeoJSON file for SAZ2
	 * @param saz1Data - SAZ1 metadata
	 * @param saz2Data - SAZ2 metadata
	 * @returns Observable with created SAZs and EA
	 */
	createTwoSazsWithEa(
		saz1File: File,
		saz2File: File,
		saz1Data: CreateTwoSazsWithEaRequest['saz1Data'],
		saz2Data: CreateTwoSazsWithEaRequest['saz2Data']
	): Observable<CreateTwoSazsWithEaResponse> {
		const formData = new FormData();

		// Add files (order matters - first file is SAZ1, second is SAZ2)
		formData.append('files', saz1File);
		formData.append('files', saz2File);

		// Add JSON data as strings
		formData.append('saz1Data', JSON.stringify(saz1Data));
		formData.append('saz2Data', JSON.stringify(saz2Data));

		return this.http
			.post<CreateTwoSazsWithEaResponse>(
				`${this.apiUrl}/create-two-sazs-with-ea`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error creating two SAZs with EA:', error);
					return throwError(() => error);
				})
			);
	}
}
