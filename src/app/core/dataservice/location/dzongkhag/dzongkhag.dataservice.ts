import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
	 */
	findAllDzongkhags(): Observable<Dzongkhag[]> {
		return this.http.get<Dzongkhag[]>(this.apiUrl).pipe(
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
				console.error('Error fetching dzonghkags:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all dzongkhags as GeoJSON
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
	 * Get all dzongkhag by Id(No Geojson)
	 */
	getDzongkhagById(dzongkhagId: number): Observable<Dzongkhag> {
		return this.http.get<any>(`${this.apiUrl}/${dzongkhagId}`).pipe(
			map((dzongkhag: any) => ({
				...dzongkhag,
				areaSqKm:
					typeof dzongkhag.areaSqKm === 'string'
						? parseFloat(dzongkhag.areaSqKm)
						: dzongkhag.areaSqKm,
			})),
			catchError((error) => {
				console.error('Error fetching dzongkhag :', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new dzongkhag
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
	 * Update existing dzongkhag
	 */
	updateDzongkhag(
		id: number,
		data: UpdateDzongkhagDto
	): Observable<ApiResponse<Dzongkhag>> {
		return this.http
			.patch<ApiResponse<Dzongkhag>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating dzlongkhag:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete language
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
	 * Upload GeoJSON for a dzongkhag
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
