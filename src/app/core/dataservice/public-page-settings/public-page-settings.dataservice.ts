import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	PublicPageSettingsDto,
	UpdatePublicPageSettingsDto,
} from '../../services/public-page-settings.interface';

@Injectable({
	providedIn: 'root',
})
export class PublicPageSettingsDataService {
	private readonly baseUrl = `${BASEAPI_URL}/public-page-settings`;

	constructor(private http: HttpClient) {}

	/**
	 * Get public page settings (public endpoint - no auth required)
	 */
	getSettings(): Observable<PublicPageSettingsDto> {
		return this.http.get<PublicPageSettingsDto>(`${this.baseUrl}`).pipe(
			catchError((error) => {
				console.error('Error fetching public page settings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get public page settings (admin endpoint - requires auth)
	 */
	getSettingsAdmin(): Observable<PublicPageSettingsDto> {
		return this.http
			.get<PublicPageSettingsDto>(`${this.baseUrl}/admin`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching public page settings (admin):',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update public page settings (admin only)
	 */
	updateSettings(
		payload: UpdatePublicPageSettingsDto
	): Observable<PublicPageSettingsDto> {
		return this.http
			.put<PublicPageSettingsDto>(`${this.baseUrl}/admin`, payload)
			.pipe(
				catchError((error) => {
					console.error('Error updating public page settings:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Reset settings to defaults (admin only)
	 */
	resetSettings(): Observable<PublicPageSettingsDto> {
		return this.http
			.post<PublicPageSettingsDto>(`${this.baseUrl}/admin/reset`, {})
			.pipe(
				catchError((error) => {
					console.error(
						'Error resetting public page settings:',
						error
					);
					return throwError(() => error);
				})
			);
	}
}

