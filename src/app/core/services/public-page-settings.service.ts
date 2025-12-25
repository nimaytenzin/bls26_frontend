import { Injectable } from '@angular/core';
import { ColorScaleType } from '../utility/map-feature-color.service';

export interface PublicPageSettings {
	mapVisualizationMode: 'households' | 'enumerationAreas';
	selectedBasemapId: string;
	colorScale: ColorScaleType;
	nationalDataViewerTitle: string;
	nationalDataViewerDescription: string;
	nationalDataViewerInfoBoxContent: string;
	nationalDataViewerInfoBoxStats: string;
}

const STORAGE_KEY = 'nsfd_public_page_settings';
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
	/**
	 * Get public page settings from localStorage
	 * Returns default values if not set
	 */
	getSettings(): PublicPageSettings {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Merge with defaults to ensure all properties exist
				return { ...DEFAULT_SETTINGS, ...parsed };
			}
		} catch (error) {
			console.error('Error reading public page settings from localStorage:', error);
		}
		return { ...DEFAULT_SETTINGS };
	}

	/**
	 * Save public page settings to localStorage
	 */
	saveSettings(settings: Partial<PublicPageSettings>): void {
		try {
			const current = this.getSettings();
			const updated = { ...current, ...settings };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch (error) {
			console.error('Error saving public page settings to localStorage:', error);
		}
	}

	/**
	 * Get default settings (for admin UI)
	 */
	getDefaultSettings(): PublicPageSettings {
		return { ...DEFAULT_SETTINGS };
	}

	/**
	 * Reset settings to defaults
	 */
	resetSettings(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
		} catch (error) {
			console.error('Error resetting public page settings:', error);
		}
	}
}

