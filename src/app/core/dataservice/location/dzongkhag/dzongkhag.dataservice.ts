import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	CreateDzongkhagDto,
	Dzongkhag,
	DzongkhagGeoJSON,
	UpdateDzongkhagDto,
} from './dzongkhag.interface';

@Injectable({
	providedIn: 'root',
})
export class DzongkhagDataService {
	private readonly apiUrl = `${BASEAPI_URL}/dzongkhag`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all dzongkhags
	 * @param withGeom - Include geometry (default: false)
	 * @param includeAdminZones - Include administrative zones (default: false)
	 * @param includeSubAdminZones - Include sub-administrative zones (default: false)
	 * @param includeEAs - Include enumeration areas (default: false)
	 * @returns Observable<Dzongkhag[]>
	 *
	 * @example
	 * findAllDzongkhags() // Basic list
	 * findAllDzongkhags(true) // With geometry
	 * findAllDzongkhags(false, true, true, true) // With all nested relations
	 */
	findAllDzongkhags(
		withGeom: boolean = false,
		includeAdminZones: boolean = false,
		includeSubAdminZones: boolean = false,
		includeEAs: boolean = false
	): Observable<Dzongkhag[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeAdminZones) params = params.set('includeAdminZones', 'true');
		if (includeSubAdminZones)
			params = params.set('includeSubAdminZones', 'true');
		if (includeEAs) params = params.set('includeEAs', 'true');

		return this.http.get<Dzongkhag[]>(this.apiUrl, { params }).pipe(
			map((dzongkhags: any[]) =>
				dzongkhags.map((d) => ({
					...d,
					areaSqKm:
						typeof d.areaSqKm === 'string'
							? parseFloat(d.areaSqKm)
							: d.areaSqKm,
				}))
			),
			catchError((error) => {
				console.error('Error fetching dzongkhags:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all dzongkhags as GeoJSON FeatureCollection
	 * @returns Observable<any> - GeoJSON FeatureCollection
	 */
	getAllDzongkhagGeojson(): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/geojson/all`).pipe(
			catchError((error) => {
				console.error('Error fetching dzongkhag geojson:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get a single dzongkhag by ID
	 * @param dzongkhagId - Dzongkhag ID
	 * @param withGeom - Include geometry (default: false)
	 * @param includeAdminZones - Include administrative zones (default: false)
	 * @param includeSubAdminZones - Include sub-administrative zones (default: false)
	 * @param includeEAs - Include enumeration areas (default: false)
	 * @returns Observable<Dzongkhag>
	 *
	 * @example
	 * getDzongkhagById(1) // Basic info
	 * getDzongkhagById(1, true) // With geometry
	 * getDzongkhagById(1, false, true, true) // With nested zones
	 */
	getDzongkhagById(
		dzongkhagId: number,
		withGeom: boolean = false,
		includeAdminZones: boolean = false,
		includeSubAdminZones: boolean = false,
		includeEAs: boolean = false
	): Observable<Dzongkhag> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeAdminZones) params = params.set('includeAdminZones', 'true');
		if (includeSubAdminZones)
			params = params.set('includeSubAdminZones', 'true');
		if (includeEAs) params = params.set('includeEAs', 'true');

		return this.http.get<any>(`${this.apiUrl}/${dzongkhagId}`, { params }).pipe(
			map((dzongkhag: any) => ({
				...dzongkhag,
				areaSqKm:
					typeof dzongkhag.areaSqKm === 'string'
						? parseFloat(dzongkhag.areaSqKm)
						: dzongkhag.areaSqKm,
			})),
			catchError((error) => {
				console.error('Error fetching dzongkhag:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get enumeration areas by dzongkhag with administrative hierarchy
	 * @param dzongkhagId - Dzongkhag ID
	 * @param withGeom - Include geometry for enumeration areas (default: false)
	 * @param includeHierarchy - Include full administrative hierarchy (default: true)
	 * @returns Observable<any> - Hierarchical or flat response based on includeHierarchy
	 *
	 * @example
	 * // Get complete hierarchy (default)
	 * getEnumerationAreasByDzongkhag(1)
	 *
	 * // Get flat list with geometry
	 * getEnumerationAreasByDzongkhag(1, true, false)
	 *
	 * // Get hierarchy with geometry
	 * getEnumerationAreasByDzongkhag(1, true, true)
	 */
	getEnumerationAreasByDzongkhag(
		dzongkhagId: number,
		withGeom: boolean = true,
		includeHierarchy: boolean = true
	): Observable<any> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (!includeHierarchy) params = params.set('includeHierarchy', 'false');

		return this.http
			.get<any>(`${this.apiUrl}/${dzongkhagId}/enumeration-areas`, { params })
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration areas by dzongkhag:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	// ============ ADMIN OPERATIONS ============

	/**
	 * Create a new dzongkhag (ADMIN only)
	 * @param data - CreateDzongkhagDto
	 * @returns Observable<ApiResponse<Dzongkhag>>
	 */
	createDzongkhag(
		data: CreateDzongkhagDto
	): Observable<ApiResponse<Dzongkhag>> {
		return this.http.post<ApiResponse<Dzongkhag>>(this.apiUrl, data).pipe(
			catchError((error) => {
				console.error('Error creating dzongkhag:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update an existing dzongkhag (ADMIN only)
	 * @param id - Dzongkhag ID
	 * @param data - UpdateDzongkhagDto (partial update)
	 * @returns Observable<ApiResponse<Dzongkhag>>
	 */
	updateDzongkhag(
		id: number,
		data: UpdateDzongkhagDto
	): Observable<ApiResponse<Dzongkhag>> {
		return this.http
			.patch<ApiResponse<Dzongkhag>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating dzongkhag:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete a dzongkhag (ADMIN only)
	 * @param id - Dzongkhag ID
	 * @returns Observable<ApiResponse<any>>
	 */
	deleteDzongkhag(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting dzongkhag:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Upload GeoJSON file to update dzongkhag geometry (ADMIN only)
	 * Accepts .geojson or .json files (max 50MB)
	 * Supports Feature, FeatureCollection, or direct Geometry objects
	 *
	 * @param dzongkhagId - Dzongkhag ID
	 * @param file - GeoJSON file to upload
	 * @returns Observable<ApiResponse<Dzongkhag>>
	 *
	 * @example
	 * const file = event.target.files[0];
	 * uploadGeojsonByDzongkhag(1, file).subscribe(...)
	 */
	uploadGeojsonByDzongkhag(
		dzongkhagId: number,
		file: File
	): Observable<ApiResponse<Dzongkhag>> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<ApiResponse<Dzongkhag>>(
				`${this.apiUrl}/upload-geojson/${dzongkhagId}`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading dzongkhag geojson:', error);
					return throwError(() => error);
				})
			);
	}
}
