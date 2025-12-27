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
import { SurveyEnumerationAreaDataService } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { BulkMatchEaResponse } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
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

	// Bulk Upload Dialog
	showBulkUploadDialog = false;
	bulkUploadFile: File | null = null;
	uploading = false;
	uploadResult: BulkMatchEaResponse | null = null;
	activeTabIndex = 0; // 0 = Matched, 1 = Unmatched

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private adminZoneService: AdministrativeZoneDataService,
		private subAdminZoneService: SubAdministrativeZoneDataService,
		private eaService: EnumerationAreaDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
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
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
		this.activeTabIndex = 0;
	}

	/**
	 * Close bulk upload dialog
	 */
	closeBulkUploadDialog(): void {
		this.showBulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
		this.activeTabIndex = 0;
	}

	/**
	 * Remove EA from selection
	 */
	removeEA(ea: EnumerationArea): void {
		this.selectedEAs = this.selectedEAs.filter((selected) => selected.id !== ea.id);
	}

	/**
	 * Get location hierarchy for an EA
	 */
	getEALocation(ea: EnumerationArea): string {
		if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
			const saz = ea.subAdministrativeZones[0];
			const parts: string[] = [];
			if (saz.administrativeZone?.dzongkhag?.name) {
				parts.push(saz.administrativeZone.dzongkhag.name);
			}
			if (saz.administrativeZone?.name) {
				parts.push(saz.administrativeZone.name);
			}
			if (saz.name) {
				parts.push(saz.name);
			}
			return parts.join(' > ');
		}
		return 'N/A';
	}

	/**
	 * Handle file selection
	 */
	onBulkFileSelect(event: any): void {
		const files = event.files;
		if (files && files.length > 0) {
			this.bulkUploadFile = files[0];
			this.uploadResult = null; // Reset previous results
		}
	}

	/**
	 * Download CSV template
	 */
	downloadTemplate(): void {
		this.surveyEAService.downloadTemplate().subscribe({
			next: (blob: Blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'enumeration_area_upload_template.csv';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Template downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download template',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Execute bulk match - call API to validate and match enumeration areas
	 */
	executeBulkUpload(): void {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No File',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.uploading = true;
		this.uploadResult = null;
		this.activeTabIndex = 0;

		this.surveyEAService.bulkMatch(this.bulkUploadFile).subscribe({
			next: (result) => {
				this.uploadResult = result;
				this.uploading = false;

				// Add matched EAs to selectedEAs
				if (result.matched > 0 && result.matchedEnumerationAreaIds.length > 0) {
					// Load full EA details for matched IDs
					const loadPromises = result.matchedEnumerationAreaIds.map((eaId) => {
						return new Promise<void>((resolve) => {
							this.eaService.findEnumerationAreaById(eaId, false, true).subscribe({
								next: (fullEA) => {
									if (!this.selectedEAs.find((selected) => selected.id === fullEA.id)) {
										this.selectedEAs.push(fullEA);
									}
									resolve();
								},
								error: () => {
									// If loading fails, try to create a minimal EA object
									const minimalEA: EnumerationArea = {
										id: eaId,
										name: `EA ${eaId}`,
										areaCode: '',
									} as EnumerationArea;
									if (!this.selectedEAs.find((selected) => selected.id === minimalEA.id)) {
										this.selectedEAs.push(minimalEA);
									}
									resolve();
								},
							});
						});
					});

					Promise.all(loadPromises).then(() => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Matched ${result.matched} enumeration areas and added to selection`,
							life: 5000,
						});
					});
				} else {
					this.messageService.add({
						severity: 'warn',
						summary: 'No Matches',
						detail: 'No enumeration areas were matched. Please check your CSV file.',
						life: 5000,
					});
				}

				// Switch to unmatched tab if there are errors
				if (result.errors && result.errors.length > 0) {
					this.activeTabIndex = 1;
				}
			},
			error: (error) => {
				this.uploading = false;
				console.error('Error matching enumeration areas:', error);
				let errorMessage = 'Failed to process CSV file. Please check the format.';
				if (error.error?.message) {
					errorMessage = error.error.message;
				}
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
					life: 5000,
				});
			},
		});
	}

}
