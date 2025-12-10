import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dzongkhag } from '../dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

/**
 * Service to preserve location selections (Dzongkhag, Administrative Zone, Sub-Administrative Zone)
 * across navigation between master data components
 */
@Injectable({
	providedIn: 'root',
})
export class LocationSelectionService {
	private selectedDzongkhagSubject = new BehaviorSubject<Dzongkhag | null>(null);
	private selectedAdministrativeZoneSubject = new BehaviorSubject<AdministrativeZone | null>(null);
	private selectedSubAdministrativeZoneSubject = new BehaviorSubject<SubAdministrativeZone | null>(null);

	public selectedDzongkhag$: Observable<Dzongkhag | null> = this.selectedDzongkhagSubject.asObservable();
	public selectedAdministrativeZone$: Observable<AdministrativeZone | null> = this.selectedAdministrativeZoneSubject.asObservable();
	public selectedSubAdministrativeZone$: Observable<SubAdministrativeZone | null> = this.selectedSubAdministrativeZoneSubject.asObservable();

	/**
	 * Get current selected dzongkhag
	 */
	getSelectedDzongkhag(): Dzongkhag | null {
		return this.selectedDzongkhagSubject.value;
	}

	/**
	 * Set selected dzongkhag
	 */
	setSelectedDzongkhag(dzongkhag: Dzongkhag | null): void {
		this.selectedDzongkhagSubject.next(dzongkhag);
		// When dzongkhag changes, clear dependent selections
		if (!dzongkhag) {
			this.setSelectedAdministrativeZone(null);
		}
	}

	/**
	 * Get current selected administrative zone
	 */
	getSelectedAdministrativeZone(): AdministrativeZone | null {
		return this.selectedAdministrativeZoneSubject.value;
	}

	/**
	 * Set selected administrative zone
	 */
	setSelectedAdministrativeZone(administrativeZone: AdministrativeZone | null): void {
		this.selectedAdministrativeZoneSubject.next(administrativeZone);
		// When administrative zone changes, clear dependent selections
		if (!administrativeZone) {
			this.setSelectedSubAdministrativeZone(null);
		}
	}

	/**
	 * Get current selected sub-administrative zone
	 */
	getSelectedSubAdministrativeZone(): SubAdministrativeZone | null {
		return this.selectedSubAdministrativeZoneSubject.value;
	}

	/**
	 * Set selected sub-administrative zone
	 */
	setSelectedSubAdministrativeZone(subAdministrativeZone: SubAdministrativeZone | null): void {
		this.selectedSubAdministrativeZoneSubject.next(subAdministrativeZone);
	}

	/**
	 * Clear all selections
	 */
	clearAllSelections(): void {
		this.selectedDzongkhagSubject.next(null);
		this.selectedAdministrativeZoneSubject.next(null);
		this.selectedSubAdministrativeZoneSubject.next(null);
	}
}

