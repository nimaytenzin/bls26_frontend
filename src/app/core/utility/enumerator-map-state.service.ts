import { Injectable } from '@angular/core';

/**
 * Map state interface
 */
export interface EnumeratorMapState {
	center: { lat: number; lng: number };
	zoom: number;
	selectedStructureId: number | null;
}

/**
 * Service for managing enumerator map state in session storage
 * Stores map position, zoom level, and selected structure for each enumeration area
 */
@Injectable({
	providedIn: 'root',
})
export class EnumeratorMapStateService {
	private readonly storageKeyPrefix = 'enumerator_mapState_';

	/**
	 * Get storage key for a specific survey enumeration area
	 */
	private getStorageKey(surveyEnumerationAreaId: number): string {
		return `${this.storageKeyPrefix}${surveyEnumerationAreaId}`;
	}

	/**
	 * Save complete map state for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @param state - Map state to save
	 */
	saveMapState(
		surveyEnumerationAreaId: number,
		state: EnumeratorMapState
	): void {
		const key = this.getStorageKey(surveyEnumerationAreaId);
		try {
			sessionStorage.setItem(key, JSON.stringify(state));
		} catch (error) {
			console.error('Error saving map state to session storage:', error);
		}
	}

	/**
	 * Get map state for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @returns Map state or null if not found
	 */
	getMapState(surveyEnumerationAreaId: number): EnumeratorMapState | null {
		const key = this.getStorageKey(surveyEnumerationAreaId);
		try {
			const stored = sessionStorage.getItem(key);
			if (stored) {
				return JSON.parse(stored) as EnumeratorMapState;
			}
		} catch (error) {
			console.error('Error reading map state from session storage:', error);
		}
		return null;
	}

	/**
	 * Save only the selected structure ID
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @param structureId - Structure ID to save, or null to clear
	 */
	saveSelectedStructure(
		surveyEnumerationAreaId: number,
		structureId: number | null
	): void {
		const currentState = this.getMapState(surveyEnumerationAreaId);
		const newState: EnumeratorMapState = {
			center: currentState?.center || { lat: 0, lng: 0 },
			zoom: currentState?.zoom || 13,
			selectedStructureId: structureId,
		};
		this.saveMapState(surveyEnumerationAreaId, newState);
	}

	/**
	 * Get selected structure ID for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @returns Selected structure ID or null if not found
	 */
	getSelectedStructure(surveyEnumerationAreaId: number): number | null {
		const state = this.getMapState(surveyEnumerationAreaId);
		return state?.selectedStructureId || null;
	}

	/**
	 * Save map center and zoom
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @param center - Map center coordinates
	 * @param zoom - Zoom level
	 */
	saveMapPosition(
		surveyEnumerationAreaId: number,
		center: { lat: number; lng: number },
		zoom: number
	): void {
		const currentState = this.getMapState(surveyEnumerationAreaId);
		const newState: EnumeratorMapState = {
			center,
			zoom,
			selectedStructureId: currentState?.selectedStructureId || null,
		};
		this.saveMapState(surveyEnumerationAreaId, newState);
	}

	/**
	 * Clear map state for a specific survey enumeration area
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 */
	clearMapState(surveyEnumerationAreaId: number): void {
		const key = this.getStorageKey(surveyEnumerationAreaId);
		try {
			sessionStorage.removeItem(key);
		} catch (error) {
			console.error('Error clearing map state from session storage:', error);
		}
	}

	/**
	 * Clear all map states (used when entering survey detail page)
	 */
	clearAllMapStates(): void {
		try {
			const keys: string[] = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key && key.startsWith(this.storageKeyPrefix)) {
					keys.push(key);
				}
			}
			keys.forEach((key) => sessionStorage.removeItem(key));
		} catch (error) {
			console.error('Error clearing all map states from session storage:', error);
		}
	}
}

