import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	CreateSubAdministrativeZoneDto,
	SubAdministrativeZone,
	SubAdministrativeZoneGeoJSON,
	UpdateSubAdministrativeZoneDto,
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
}
