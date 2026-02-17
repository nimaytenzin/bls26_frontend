import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import {
	AdministrativeZone,
	AdministrativeZoneType,
} from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { finalize } from 'rxjs/operators';
import { AdminSurveyCreatorBulkUploadEaDialogComponent } from '../admin-survey-creator-bulk-upload-ea-dialog/admin-survey-creator-bulk-upload-ea-dialog.component';

@Component({
	selector: 'app-admin-survey-creator-enumeration-areas',
	templateUrl: './admin-survey-creator-enumeration-areas.component.html',
	styleUrls: ['./admin-survey-creator-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules, AdminSurveyCreatorBulkUploadEaDialogComponent],
	providers: [MessageService],
})
export class AdminSurveyCreatorEnumerationAreasComponent implements OnInit {
	@Input() selectedEAIds: number[] = [];
	@Output() completed = new EventEmitter<number[]>();
	@Output() back = new EventEmitter<void>();
	/** Emitted when user clicks "Proceed to Enumerator upload" in bulk upload dialog (wizard advances to enumerators step). */
	@Output() proceedToEnumerators = new EventEmitter<void>();

	// Dropdown data
	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];
	enumerationAreas: EnumerationArea[] = [];

	// Selected values
	selectedDzongkhag: Dzongkhag | null = null;
	selectedAdminZone: AdministrativeZone | null = null;
	selectedSubAdminZone: SubAdministrativeZone | null = null;
	selectedEAs: EnumerationArea[] = [];

	// Loading states
	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;
	loadingEAs = false;

	// Bulk Upload Dialog
	showBulkUploadDialog = false;

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private adminZoneService: AdministrativeZoneDataService,
		private subAdminZoneService: SubAdministrativeZoneDataService,
		private eaService: EnumerationAreaDataService,
		private messageService: MessageService
	) {}

	/** Dzongkhags sorted by areaCode ascending for dropdown (display: areaCode | name). */
	get dzongkhagsSortedByCode(): Dzongkhag[] {
		return [...(this.dzongkhags || [])].sort((a, b) =>
			(a.areaCode ?? '').localeCompare(b.areaCode ?? '', undefined, { numeric: true })
		);
	}

	/** Gewog/Thromde grouped by Urban (Thromde) first, then Rural (Gewog), each sorted by areaCode ascending. */
	get groupedAdministrativeZones(): { label: string; items: AdministrativeZone[] }[] {
		const thromde = (this.administrativeZones || []).filter(
			(az) => az.type === AdministrativeZoneType.Thromde
		);
		const gewog = (this.administrativeZones || []).filter(
			(az) => az.type === AdministrativeZoneType.Gewog
		);
		const sortByAreaCode = (a: AdministrativeZone, b: AdministrativeZone) =>
			(a.areaCode ?? '').localeCompare(b.areaCode ?? '', undefined, { numeric: true });
		const groups: { label: string; items: AdministrativeZone[] }[] = [
			{ label: 'Urban (Thromde)', items: thromde.slice().sort(sortByAreaCode) },
			{ label: 'Rural (Gewog)', items: gewog.slice().sort(sortByAreaCode) },
		];
		return groups.filter((g) => g.items.length > 0);
	}

	/** Chiwog/Lap sorted by areaCode ascending for dropdown (display: areaCode | name). */
	get subAdministrativeZonesSortedByCode(): SubAdministrativeZone[] {
		return [...(this.subAdministrativeZones || [])].sort((a, b) =>
			(a.areaCode ?? '').localeCompare(b.areaCode ?? '', undefined, { numeric: true })
		);
	}

	ngOnInit(): void {
		this.loadDzongkhags();
	}

	/**
	 * Load all dzongkhags
	 */
	loadDzongkhags(): void {
		this.loadingDzongkhags = true;
		this.dzongkhagService
			.findAllDzongkhags()
			.pipe(finalize(() => (this.loadingDzongkhags = false)))
			.subscribe({
				next: (data) => {
					this.dzongkhags = data;
				},
				error: (error) => {
					console.error('Error loading dzongkhags:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load dzongkhags',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle dzongkhag selection
	 */
	onDzongkhagChange(): void {
		// Reset dependent dropdowns (but keep selectedEAs)
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		// Don't clear selectedEAs - they should persist across zone changes

		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones(this.selectedDzongkhag.id);
		}
	}

	/**
	 * Load administrative zones by dzongkhag
	 */
	loadAdministrativeZones(dzongkhagId: number): void {
		this.loadingAdminZones = true;
		this.adminZoneService
			.findAdministrativeZonesByDzongkhag(dzongkhagId)
			.pipe(finalize(() => (this.loadingAdminZones = false)))
			.subscribe({
				next: (data) => {
					this.administrativeZones = data;
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load administrative zones',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle administrative zone selection
	 */
	onAdminZoneChange(): void {
		// Reset dependent dropdowns (but keep selectedEAs)
		this.selectedSubAdminZone = null;
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		// Don't clear selectedEAs - they should persist across zone changes

		if (this.selectedAdminZone) {
			this.loadSubAdministrativeZones(this.selectedAdminZone.id);
		}
	}

	/**
	 * Load sub-administrative zones by administrative zone
	 */
	loadSubAdministrativeZones(adminZoneId: number): void {
		this.loadingSubAdminZones = true;
		this.subAdminZoneService
			.findSubAdministrativeZonesByAdministrativeZone(adminZoneId)
			.pipe(finalize(() => (this.loadingSubAdminZones = false)))
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data;
				},
				error: (error) => {
					console.error('Error loading sub-administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sub-administrative zones',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle sub-administrative zone selection
	 */
	onSubAdminZoneChange(): void {
		// Reset enumeration areas (but keep selectedEAs)
		this.enumerationAreas = [];
		// Don't clear selectedEAs - they should persist across zone changes

		if (this.selectedSubAdminZone) {
			this.loadEnumerationAreas(this.selectedSubAdminZone.id);
		}
	}

	/**
	 * Load enumeration areas by sub-administrative zone
	 */
	loadEnumerationAreas(subAdminZoneId: number): void {
		this.loadingEAs = true;
		this.eaService
			.findEnumerationAreasBySubAdministrativeZone(subAdminZoneId)
			.pipe(finalize(() => (this.loadingEAs = false)))
			.subscribe({
				next: (data) => {
					this.enumerationAreas = data;
					// Pre-select EAs that were previously selected
					if (this.selectedEAIds.length > 0) {
						this.selectedEAs = this.enumerationAreas.filter((ea) =>
							this.selectedEAIds.includes(ea.id)
						);
					}
				},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Get selected EA IDs
	 */
	getSelectedEAIds(): number[] {
		return this.selectedEAs.map((ea) => ea.id);
	}

	/**
	 * Handle next button click
	 */
	onNext(): void {
		const selectedIds = this.getSelectedEAIds();
		if (selectedIds.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select at least one enumeration area',
				life: 3000,
			});
			return;
		}
		this.completed.emit(selectedIds);
	}

	/**
	 * Handle back button click
	 */
	onBack(): void {
		this.back.emit();
	}

	// ==================== Bulk Upload ====================

	/**
	 * Open bulk upload dialog
	 */
	openBulkUploadDialog(): void {
		this.showBulkUploadDialog = true;
	}

	/** When user proceeds from bulk upload dialog to enumerator step, emit so wizard advances. */
	onProceedToEnumeratorsFromBulk(): void {
		this.proceedToEnumerators.emit();
	}

	/**
	 * Add EAs from bulk upload to selected list (no duplicates)
	 */
	onBulkUploadMatchedEAs(eas: EnumerationArea[]): void {
		for (const ea of eas) {
			if (!this.selectedEAs.find((s) => s.id === ea.id)) {
				this.selectedEAs.push(ea);
			}
		}
	}

	/**
	 * Remove EA from selection
	 */
	removeEA(ea: EnumerationArea): void {
		this.selectedEAs = this.selectedEAs.filter((selected) => selected.id !== ea.id);
	}

	/**
	 * Full hierarchy code: dzongkhag + gewog/thromde + chiwog/lap + EA code (e.g. 13123201).
	 * Uses current filter selection when available, else EA's subAdministrativeZones.
	 */
	getEAFullCode(ea: EnumerationArea): string {
		const eaPart = ea.areaCode ?? (ea as any).eaCode ?? '';
		if (
			this.selectedDzongkhag &&
			this.selectedAdminZone &&
			this.selectedSubAdminZone
		) {
			return (
				(this.selectedDzongkhag.areaCode ?? '') +
				(this.selectedAdminZone.areaCode ?? '') +
				(this.selectedSubAdminZone.areaCode ?? '') +
				eaPart
			);
		}
		if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
			const saz = ea.subAdministrativeZones[0];
			const az = saz.administrativeZone;
			const dz = az?.dzongkhag;
			return (
				(dz?.areaCode ?? '') +
				(az?.areaCode ?? '') +
				(saz.areaCode ?? '') +
				eaPart
			);
		}
		return eaPart || '—';
	}

	/**
	 * Get location hierarchy for an EA (Dzongkhag | Thromde/Gewog | Chiwog/LAP | EA)
	 */
	getEALocation(ea: EnumerationArea): string {
		const eaPart = ea.name || (ea.areaCode ?? (ea as any).eaCode ?? 'EA');
		if (
			this.selectedDzongkhag &&
			this.selectedAdminZone &&
			this.selectedSubAdminZone
		) {
			return [
				this.selectedDzongkhag.name,
				this.selectedAdminZone.name,
				this.selectedSubAdminZone.name,
				eaPart,
			]
				.filter(Boolean)
				.join(' | ');
		}
		if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
			const saz = ea.subAdministrativeZones[0];
			const dz = saz.administrativeZone?.dzongkhag?.name ?? '';
			const az = saz.administrativeZone?.name ?? '';
			const sazName = saz.name ?? '';
			return [dz, az, sazName, eaPart].filter(Boolean).join(' | ');
		}
		return eaPart || '—';
	}

	/** Dzongkhag name for EA (for location columns). */
	getEADzongkhag(ea: EnumerationArea): string {
		if (this.selectedDzongkhag) return this.selectedDzongkhag.name ?? '—';
		const saz = ea.subAdministrativeZones?.[0];
		return saz?.administrativeZone?.dzongkhag?.name ?? '—';
	}

	/** Thromde/Gewog name for EA (for location columns). */
	getEAGewogThromde(ea: EnumerationArea): string {
		if (this.selectedAdminZone) return this.selectedAdminZone.name ?? '—';
		const saz = ea.subAdministrativeZones?.[0];
		return saz?.administrativeZone?.name ?? '—';
	}

	/** Chiwog/LAP name for EA (for location columns). */
	getEAChiwogLap(ea: EnumerationArea): string {
		if (this.selectedSubAdminZone) return this.selectedSubAdminZone.name ?? '—';
		const saz = ea.subAdministrativeZones?.[0];
		return saz?.name ?? '—';
	}

	/** EA name/code for display (for location columns). */
	getEAPart(ea: EnumerationArea): string {
		return ea.name || (ea.areaCode ?? (ea as any).eaCode ?? '—');
	}

}
