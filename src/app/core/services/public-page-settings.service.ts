import { Injectable } from '@angular/core';

export interface PublicPageSettings {
	mapVisualizationMode: 'households' | 'enumerationAreas';
	selectedBasemapId: string;
}

const STORAGE_KEY = 'nsfd_public_page_settings';
const DEFAULT_SETTINGS: PublicPageSettings = {
	mapVisualizationMode: 'households',
	selectedBasemapId: 'positron',
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

