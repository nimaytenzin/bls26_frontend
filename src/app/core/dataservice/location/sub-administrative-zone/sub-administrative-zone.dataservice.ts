import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	BulkUploadResponse,
	CreateSubAdministrativeZoneDto,
	SubAdministrativeZone,
	SubAdministrativeZoneGeoJSON,
	UpdateSubAdministrativeZoneDto,
	SazEaUploadDto,
	SazEaUploadResponse,
} from './sub-administrative-zone.dto';
import { AdministrativeZone } from '../administrative-zone/administrative-zone.dto';

@Injectable({
	providedIn: 'root',
})
export class SubAdministrativeZoneDataService {
	private readonly apiUrl = `${BASEAPI_URL}/sub-administrative-zone`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all sub-administrative zones
	 */
	findAllSubAdministrativeZones(): Observable<SubAdministrativeZone[]> {
		return this.http.get<SubAdministrativeZone[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching sub-administrative zones:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all sub-administrative zones by administrative zone ID
	 */
	findSubAdministrativeZonesByAdministrativeZone(
		administrativeZoneId: number
	): Observable<SubAdministrativeZone[]> {
		return this.http
			.get<SubAdministrativeZone[]>(
				`${this.apiUrl}/by-administrative-zone/${administrativeZoneId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching sub-administrative zones by administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all sub-administrative zones as GeoJSON
	 */
	getAllSubAdministrativeZoneGeojson(): Observable<SubAdministrativeZoneGeoJSON> {
		return this.http
			.get<SubAdministrativeZoneGeoJSON>(`${this.apiUrl}/geojson/all`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching sub-administrative zone geojson:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get single sub-administrative zone as GeoJSON
	 * @param id - Sub-administrative zone ID
	 * @returns GeoJSON Feature
	 */
	findOneAsGeoJson(id: number): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/geojson/${id}`).pipe(
			catchError((error) => {
				console.error(
					'Error fetching sub-administrative zone as GeoJSON:',
					error
				);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all sub-administrative zones by administrative zone ID as GeoJSON
	 */
	getSubAdministrativeZoneGeojsonByAdministrativeZone(
		administrativeZoneId: number
	): Observable<SubAdministrativeZoneGeoJSON> {
		return this.http
			.get<SubAdministrativeZoneGeoJSON>(
				`${this.apiUrl}/geojson/by-administrative-zone/${administrativeZoneId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching sub-administrative zone geojson by administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all sub-administrative zones by dzongkhag ID
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable<SubAdministrativeZone[]> - Array of sub-administrative zones
	 */
	findSubAdministrativeZonesByDzongkhag(
		dzongkhagId: number
	): Observable<SubAdministrativeZone[]> {
		return this.http
			.get<SubAdministrativeZone[]>(
				`${this.apiUrl}/by-dzongkhag/${dzongkhagId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching sub-administrative zones by dzongkhag:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all sub-administrative zones by dzongkhag ID as GeoJSON
	 * @param dzongkhagId - Dzongkhag ID
	 * @returns Observable<SubAdministrativeZoneGeoJSON> - GeoJSON FeatureCollection
	 */
	getSubAdministrativeZoneGeojsonByDzongkhag(
		dzongkhagId: number
	): Observable<SubAdministrativeZoneGeoJSON> {
		return this.http
			.get<SubAdministrativeZoneGeoJSON>(
				`${this.apiUrl}/geojson/by-dzongkhag/${dzongkhagId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching sub-administrative zone geojson by dzongkhag:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get sub-administrative zone by ID
	 */
	findSubAdministrativeZoneById(id: number): Observable<SubAdministrativeZone> {
		return this.http.get<SubAdministrativeZone>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching sub-administrative zone:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get sub administrative zone by ID without geom
	 */
	findAdministrativeZoneByIdWithoutGeom(
		id: number
	): Observable<SubAdministrativeZone> {
		return this.http
			.get<SubAdministrativeZone>(`${this.apiUrl}/${id}?withoutGeom=true`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching sub-administrative zone without geom:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create new sub-administrative zone
	 */
	createSubAdministrativeZone(
		data: CreateSubAdministrativeZoneDto
	): Observable<ApiResponse<SubAdministrativeZone>> {
		return this.http
			.post<ApiResponse<SubAdministrativeZone>>(this.apiUrl, data)
			.pipe(
				catchError((error) => {
					console.error('Error creating sub-administrative zone:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing sub-administrative zone
	 */
	updateSubAdministrativeZone(
		id: number,
		data: UpdateSubAdministrativeZoneDto
	): Observable<ApiResponse<SubAdministrativeZone>> {
		return this.http
			.patch<ApiResponse<SubAdministrativeZone>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating sub-administrative zone:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete sub-administrative zone
	 */
	deleteSubAdministrativeZone(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting sub-administrative zone:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Upload GeoJSON file for sub-administrative zone
	 */
	uploadGeojsonBySubAdministrativeZone(
		subAdministrativeZoneId: number,
		file: File
	): Observable<ApiResponse<SubAdministrativeZone>> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<ApiResponse<SubAdministrativeZone>>(
				`${this.apiUrl}/upload-geojson/${subAdministrativeZoneId}`,
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
	 * Bulk upload sub-administrative zones by administrative zone
	 * Uploads a GeoJSON FeatureCollection file to create multiple sub-administrative zones
	 * All features will be assigned to the specified administrative zone
	 *
	 * @param administrativeZoneId - The ID of the administrative zone
	 * @param file - GeoJSON FeatureCollection file containing sub-administrative zone features
	 * @returns Observable with bulk upload results including success count, skipped items, and errors
	 *
	 * @example
	 * const file = event.target.files[0];
	 * bulkUploadGeojsonByAdministrativeZone(5, file).subscribe({
	 *   next: (response) => {
	 *     console.log(`Created: ${response.success}, Skipped: ${response.skipped}`);
	 *   }
	 * });
	 */
	bulkUploadGeojsonByAdministrativeZone(
		administrativeZoneId: number,
		file: File
	): Observable<BulkUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<BulkUploadResponse>(
				`${this.apiUrl}/bulk-upload-geojson/by-administrative-zone/${administrativeZoneId}`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error bulk uploading sub-administrative zones:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Upload a single SAZ with its corresponding EA (EA1)
	 * 
	 * Creates both Sub-Administrative Zone and Enumeration Area in one operation.
	 * EA is automatically created with:
	 * - name: "EA1"
	 * - areaCode: "01"
	 * - areaSqKm: 22.22
	 * - Same geometry as SAZ
	 * 
	 * @param data - Upload data including form fields and GeoJSON file
	 * @returns Observable with created SAZ and EA
	 */
	uploadSazWithEa(data: SazEaUploadDto): Observable<SazEaUploadResponse> {
		const formData = new FormData();
		
		formData.append('administrativeZoneId', data.administrativeZoneId.toString());
		formData.append('name', data.name);
		formData.append('areaCode', data.areaCode);
		formData.append('type', data.type);
		formData.append('areaSqKm', data.areaSqKm.toString());
		formData.append('file', data.file, data.file.name);

		return this.http
			.post<SazEaUploadResponse>(
				`${this.apiUrl}/upload-saz-ea`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading SAZ with EA:', error);
					return throwError(() => error);
				})
			);
	}
}
