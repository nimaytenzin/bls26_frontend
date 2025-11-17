import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { finalize } from 'rxjs/operators';

@Component({
	selector: 'app-admin-survey-creator-enumeration-areas',
	templateUrl: './admin-survey-creator-enumeration-areas.component.html',
	styleUrls: ['./admin-survey-creator-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSurveyCreatorEnumerationAreasComponent implements OnInit {
	@Input() selectedEAIds: number[] = [];
	@Output() completed = new EventEmitter<number[]>();
	@Output() back = new EventEmitter<void>();

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

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private adminZoneService: AdministrativeZoneDataService,
		private subAdminZoneService: SubAdministrativeZoneDataService,
		private eaService: EnumerationAreaDataService,
		private messageService: MessageService
	) {}

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
		// Reset dependent dropdowns
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		this.selectedEAs = [];

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
		// Reset dependent dropdowns
		this.selectedSubAdminZone = null;
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		this.selectedEAs = [];

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
		// Reset enumeration areas
		this.enumerationAreas = [];
		this.selectedEAs = [];

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
}
