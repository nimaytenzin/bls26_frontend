import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ColorScaleType } from '../utility/map-feature-color.service';
import { BASEAPI_URL } from '../constants/constants';

export interface PublicPageSettings {
	mapVisualizationMode: 'households' | 'enumerationAreas';
	selectedBasemapId: string;
	colorScale: string; // API may return 'gray', 'viridis', 'plasma' which aren't in ColorScaleType
	nationalDataViewerTitle: string;
	nationalDataViewerDescription: string;
	nationalDataViewerInfoBoxContent: string;
	nationalDataViewerInfoBoxStats: string;
}

export interface PublicPageSettingsDto extends PublicPageSettings {
	id: number;
	createdBy?: number;
	updatedBy?: number;
	createdAt: string;
	updatedAt: string;
}

export interface UpdatePublicPageSettingsDto {
	mapVisualizationMode?: 'households' | 'enumerationAreas';
	selectedBasemapId?: string;
	colorScale?: string;
	nationalDataViewerTitle?: string;
	nationalDataViewerDescription?: string;
	nationalDataViewerInfoBoxContent?: string;
	nationalDataViewerInfoBoxStats?: string;
}

const DEFAULT_SETTINGS: PublicPageSettings = {
	mapVisualizationMode: 'households',
	selectedBasemapId: 'positron',
	colorScale: 'blue',
	nationalDataViewerTitle: 'National Sampling Frame',
	nationalDataViewerDescription: 'Current statistics on households and enumeration areas',
	nationalDataViewerInfoBoxContent:
		'A sampling frame is a population from which a sample can be drawn, ensuring survey samples are representative and reliable.',
	nationalDataViewerInfoBoxStats: '3,310 EAs total (1,464 urban, 1,846 rural)',
};

@Injectable({
	providedIn: 'root',
})
export class PublicPageSettingsService {
	private readonly apiUrl = `${BASEAPI_URL}/public-page-settings`;

	constructor(private http: HttpClient) {}

	/**
	 * Get public page settings (no authentication required)
	 * Used by public data viewer pages
	 */
	getPublicSettings(): Observable<PublicPageSettings> {
		return this.http.get<PublicPageSettingsDto>(this.apiUrl).pipe(
			map((dto) => this.mapDtoToSettings(dto)),
			catchError((error) => {
				console.error('Error fetching public page settings:', error);
				// Return default settings on error
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get public page settings for admin (requires authentication)
	 * Used by admin settings page
	 */
	getAdminSettings(): Observable<PublicPageSettings> {
		return this.http.get<PublicPageSettingsDto>(`${this.apiUrl}/admin`).pipe(
			map((dto) => this.mapDtoToSettings(dto)),
			catchError((error) => {
				console.error('Error fetching admin page settings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update public page settings (requires authentication)
	 * Only admins can update settings
	 */
	updateSettings(settings: UpdatePublicPageSettingsDto): Observable<PublicPageSettings> {
		return this.http.put<PublicPageSettingsDto>(`${this.apiUrl}/admin`, settings).pipe(
			map((dto) => this.mapDtoToSettings(dto)),
			catchError((error) => {
				console.error('Error updating public page settings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Reset settings to defaults (requires authentication)
	 * Only admins can reset settings
	 */
	resetSettings(): Observable<PublicPageSettings> {
		return this.http.post<PublicPageSettingsDto>(`${this.apiUrl}/admin/reset`, {}).pipe(
			map((dto) => this.mapDtoToSettings(dto)),
			catchError((error) => {
				console.error('Error resetting public page settings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get default settings (for admin UI)
	 * Returns default values without making API call
	 */
	getDefaultSettings(): PublicPageSettings {
		return { ...DEFAULT_SETTINGS };
	}

	/**
	 * Map DTO to settings interface (exclude metadata fields)
	 */
	private mapDtoToSettings(dto: PublicPageSettingsDto): PublicPageSettings {
		return {
			mapVisualizationMode: dto.mapVisualizationMode,
			selectedBasemapId: dto.selectedBasemapId,
			colorScale: dto.colorScale,
			nationalDataViewerTitle: dto.nationalDataViewerTitle,
			nationalDataViewerDescription: dto.nationalDataViewerDescription,
			nationalDataViewerInfoBoxContent: dto.nationalDataViewerInfoBoxContent,
			nationalDataViewerInfoBoxStats: dto.nationalDataViewerInfoBoxStats,
		};
	}

	/**
	 * @deprecated Use getPublicSettings() or getAdminSettings() instead
	 * This method is kept for backwards compatibility but will return default settings
	 */
	getSettings(): PublicPageSettings {
		console.warn(
			'getSettings() is deprecated. Use getPublicSettings() or getAdminSettings() instead.'
		);
		return { ...DEFAULT_SETTINGS };
	}

	/**
	 * @deprecated Use updateSettings() instead
	 * This method is kept for backwards compatibility but does nothing
	 */
	saveSettings(settings: Partial<PublicPageSettings>): void {
		console.warn(
			'saveSettings() is deprecated. Use updateSettings() Observable method instead.'
		);
	}
}

