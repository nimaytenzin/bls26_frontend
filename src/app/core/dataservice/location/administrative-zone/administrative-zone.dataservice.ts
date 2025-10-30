import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	CreateAdministrativeZoneDto,
	AdministrativeZone,
	AdministrativeZoneGeoJSON,
	UpdateAdministrativeZoneDto,
} from './administrative-zone.dto';

@Injectable({
	providedIn: 'root',
})
export class AdministrativeZoneDataService {
	private readonly apiUrl = `${BASEAPI_URL}/administrative-zone`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all administrative zones
	 */
	findAllAdministrativeZones(): Observable<AdministrativeZone[]> {
		return this.http.get<AdministrativeZone[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching administrative zones:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get administrative zones by dzongkhag ID
	 */
	findAdministrativeZonesByDzongkhag(
		dzongkhagId: number
	): Observable<AdministrativeZone[]> {
		return this.http
			.get<AdministrativeZone[]>(`${this.apiUrl}/by-dzongkhag/${dzongkhagId}`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching administrative zones by dzongkhag:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all administrative zones as GeoJSON
	 */
	getAllAdministrativeZoneGeojson(): Observable<AdministrativeZoneGeoJSON> {
		return this.http
			.get<AdministrativeZoneGeoJSON>(`${this.apiUrl}/geojson/all`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching administrative zone geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all administrative zones by dzongkhag ID as GeoJSON
	 */
	getAdministrativeZoneGeojsonByDzongkhag(
		dzongkhagId: number
	): Observable<AdministrativeZoneGeoJSON> {
		return this.http
			.get<AdministrativeZoneGeoJSON>(
				`${this.apiUrl}/geojson/by-dzongkhag/${dzongkhagId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching administrative zone geojson by dzongkhag:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get administrative zone by ID
	 */
	findAdministrativeZoneById(id: number): Observable<AdministrativeZone> {
		return this.http.get<AdministrativeZone>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching administrative zone:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get administrative zone by ID without geom
	 */
	findAdministrativeZoneByIdWithoutGeom(
		id: number
	): Observable<AdministrativeZone> {
		return this.http
			.get<AdministrativeZone>(`${this.apiUrl}/${id}?withoutGeom=true`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching administrative zone without geom:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create new administrative zone
	 */
	createAdministrativeZone(
		data: CreateAdministrativeZoneDto
	): Observable<ApiResponse<AdministrativeZone>> {
		return this.http
			.post<ApiResponse<AdministrativeZone>>(this.apiUrl, data)
			.pipe(
				catchError((error) => {
					console.error('Error creating administrative zone:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing administrative zone
	 */
	updateAdministrativeZone(
		id: number,
		data: UpdateAdministrativeZoneDto
	): Observable<ApiResponse<AdministrativeZone>> {
		return this.http
			.patch<ApiResponse<AdministrativeZone>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating administrative zone:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete administrative zone
	 */
	deleteAdministrativeZone(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting administrative zone:', error);
				return throwError(() => error);
			})
		);
	}
}
