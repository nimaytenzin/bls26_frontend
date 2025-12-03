import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumerationAreaDataService } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import {
	SurveyEnumerationArea,
	BulkUploadResponse,
} from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface GroupedEA {
	dzongkhag: Dzongkhag;
	administrativeZones: Array<{
		adminZone: AdministrativeZone;
		subAdministrativeZones: Array<{
			subAdminZone: SubAdministrativeZone;
			enumerationAreas: SurveyEnumerationArea[];
		}>;
	}>;
}

@Component({
	selector: 'app-admin-survey-ea-management',
	templateUrl: './admin-survey-ea-management.component.html',
	styleUrls: ['./admin-survey-ea-management.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminSurveyEaManagementComponent implements OnInit {
	@Input() surveyId!: number;

	// Survey EAs (already assigned to this survey)
	surveyEAs: SurveyEnumerationArea[] = [];
	groupedEAs: GroupedEA[] = [];
	loadingSurveyEAs = false;

	// Add EA Dialog
	showAddDialog = false;
	availableEAs: EnumerationArea[] = [];
	selectedEAsToAdd: EnumerationArea[] = [];
	loadingAvailableEAs = false;

	// Add EA Dropdowns
	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];
	enumerationAreas: EnumerationArea[] = [];

	selectedDzongkhag: Dzongkhag | null = null;
	selectedAdminZone: AdministrativeZone | null = null;
	selectedSubAdminZone: SubAdministrativeZone | null = null;

	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;
	loadingEAs = false;

	// Remove Dialog
	selectedEAsToRemove: SurveyEnumerationArea[] = [];

	// Table reference for filtering
	tableRef: any;

	// Bulk Upload Dialog
	showBulkUploadDialog = false;
	bulkUploadFile: File | null = null;
	uploading = false;
	uploadResult: BulkUploadResponse | null = null;

	// Validation Dialog
	showValidationDialog = false;
	validating = false;
	validationComments = '';
	isApproving = true;
	currentEAForValidation: SurveyEnumerationArea | null = null;

	// Household listings for validation dialog
	householdListings: any[] = [];
	loadingHouseholdListings = false;
	householdListingsStatistics: any = null;

	// Generate Blank Entries Dialog
	showGenerateBlankDialog = false;
	generatingBlank = false;
	blankCount = 20;
	blankRemarks = 'No data available - Historical survey entry';

	constructor(
		private surveyService: SurveyDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private eaService: EnumerationAreaDataService,
		private dzongkhagService: DzongkhagDataService,
		private adminZoneService: AdministrativeZoneDataService,
		private subAdminZoneService: SubAdministrativeZoneDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private authService: AuthService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadSurveyEAs();
		}
	}

	/**
	 * Load survey enumeration areas
	 */
	loadSurveyEAs() {
		this.loadingSurveyEAs = true;
		this.surveyEAService
			.getBySurvey(this.surveyId)
			.pipe(finalize(() => (this.loadingSurveyEAs = false)))
			.subscribe({
				next: (data) => {
					// Extract survey enumeration areas from nested structure
					this.surveyEAs = this.extractSurveyEAs(data);
					this.buildGroupedData();
				},
				error: (error) => {
					console.error('Error loading survey EAs:', error);
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
	 * Extract survey enumeration areas from hierarchical data structure
	 */
	private extractSurveyEAs(dzongkhags: any[]): SurveyEnumerationArea[] {
		const surveyEAs: SurveyEnumerationArea[] = [];

		dzongkhags.forEach((dz) => {
			dz.administrativeZones?.forEach((az: any) => {
				az.subAdministrativeZones?.forEach((saz: any) => {
					saz.enumerationAreas?.forEach((ea: any) => {
						ea.surveyEnumerationAreas?.forEach((surveyEA: any) => {
							// Reconstruct the full object with nested relations
							surveyEAs.push({
								...surveyEA,
								enumerationArea: {
									...ea,
									subAdministrativeZone: {
										...saz,
										administrativeZone: {
											...az,
											dzongkhag: dz,
										},
									},
								},
							});
						});
					});
				});
			});
		});

		return surveyEAs;
	}

	/**
	 * Build grouped data structure
	 */
	async buildGroupedData() {
		const grouped = new Map<number, GroupedEA>();

		for (const surveyEA of this.surveyEAs) {
			const ea = surveyEA.enumerationArea;
			if (!ea || !ea.subAdministrativeZone) continue;

			const saz = ea.subAdministrativeZone;
			const az = saz.administrativeZone;
			const dz = az?.dzongkhag;

			if (!dz) continue;

			// Get or create dzongkhag group
			if (!grouped.has(dz.id)) {
				grouped.set(dz.id, {
					dzongkhag: dz,
					administrativeZones: [],
				});
			}

			const dzGroup = grouped.get(dz.id)!;

			// Find or create admin zone group
			let azGroup = dzGroup.administrativeZones.find(
				(g) => g.adminZone.id === az.id
			);
			if (!azGroup) {
				azGroup = {
					adminZone: az,
					subAdministrativeZones: [],
				};
				dzGroup.administrativeZones.push(azGroup);
			}

			// Find or create sub admin zone group
			let sazGroup = azGroup.subAdministrativeZones.find(
				(g) => g.subAdminZone.id === saz.id
			);
			if (!sazGroup) {
				sazGroup = {
					subAdminZone: saz,
					enumerationAreas: [],
				};
				azGroup.subAdministrativeZones.push(sazGroup);
			}

			// Add EA to group
			sazGroup.enumerationAreas.push(surveyEA);
		}

		this.groupedEAs = Array.from(grouped.values());
	}

	/**
	 * Open Add EA Dialog
	 */
	openAddDialog() {
		this.showAddDialog = true;
		this.selectedEAsToAdd = [];
		this.selectedDzongkhag = null;
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		this.loadDzongkhags();
	}

	/**
	 * Load dzongkhags
	 */
	loadDzongkhags() {
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
	 * Handle dzongkhag change
	 */
	onDzongkhagChange() {
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		this.selectedEAsToAdd = [];

		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones(this.selectedDzongkhag.id);
		}
	}

	/**
	 * Load administrative zones
	 */
	loadAdministrativeZones(dzongkhagId: number) {
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
	 * Handle admin zone change
	 */
	onAdminZoneChange() {
		this.selectedSubAdminZone = null;
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		this.selectedEAsToAdd = [];

		if (this.selectedAdminZone) {
			this.loadSubAdministrativeZones(this.selectedAdminZone.id);
		}
	}

	/**
	 * Load sub-administrative zones
	 */
	loadSubAdministrativeZones(adminZoneId: number) {
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
	 * Handle sub-admin zone change
	 */
	onSubAdminZoneChange() {
		this.enumerationAreas = [];
		this.selectedEAsToAdd = [];

		if (this.selectedSubAdminZone) {
			this.loadEnumerationAreas(this.selectedSubAdminZone.id);
		}
	}

	/**
	 * Load enumeration areas
	 */
	loadEnumerationAreas(subAdminZoneId: number) {
		this.loadingEAs = true;
		this.eaService
			.findEnumerationAreasBySubAdministrativeZone(subAdminZoneId)
			.pipe(finalize(() => (this.loadingEAs = false)))
			.subscribe({
				next: (data) => {
					// Filter out EAs already assigned to this survey
					const assignedEAIds = this.surveyEAs.map(
						(sea) => sea.enumerationAreaId
					);
					this.enumerationAreas = data.filter(
						(ea) => !assignedEAIds.includes(ea.id)
					);
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
	 * Add selected EAs to survey
	 */
	addEAsToSurvey() {
		if (this.selectedEAsToAdd.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Selection',
				detail: 'Please select at least one enumeration area',
				life: 3000,
			});
			return;
		}

		const eaIds = this.selectedEAsToAdd.map((ea) => ea.id);
		this.surveyService.addEnumerationAreas(this.surveyId, eaIds).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: `Added ${eaIds.length} enumeration area(s) to survey`,
					life: 3000,
				});
				this.showAddDialog = false;
				this.loadSurveyEAs();
			},
			error: (error) => {
				console.error('Error adding EAs to survey:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to add enumeration areas',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Get selected EA nodes (replaces tree selection)
	 */
	getSelectedEANodes(): SurveyEnumerationArea[] {
		return this.selectedEAsToRemove;
	}

	/**
	 * Remove selected EAs
	 */
	removeSelectedEAs() {
		const selectedEANodes = this.getSelectedEANodes();
		if (selectedEANodes.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Selection',
				detail: 'Please select enumeration areas to remove',
				life: 3000,
			});
			return;
		}

		this.confirmationService.confirm({
			message: `Are you sure you want to remove ${selectedEANodes.length} enumeration area(s) from this survey?`,
			header: 'Confirm Removal',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				const eaIds = selectedEANodes.map((ea) => ea.enumerationAreaId);
				this.surveyService
					.removeEnumerationAreas(this.surveyId, eaIds)
					.subscribe({
						next: () => {
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: `Removed ${eaIds.length} enumeration area(s)`,
								life: 3000,
							});
							this.selectedEAsToRemove = [];
							this.loadSurveyEAs();
						},
						error: (error) => {
							console.error('Error removing EAs:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: 'Failed to remove enumeration areas',
								life: 3000,
							});
						},
					});
			},
		});
	}

	/**
	 * Open bulk upload dialog
	 */
	openBulkUploadDialog() {
		this.showBulkUploadDialog = true;
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
	}

	/**
	 * Handle file selection
	 */
	onBulkFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.bulkUploadFile = files[0];
			this.uploadResult = null; // Reset previous results
		}
	}

	/**
	 * Download CSV template
	 */
	downloadTemplate() {
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
	 * Execute bulk upload
	 */
	executeBulkUpload() {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No File',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		if (!this.surveyId) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Survey ID is missing',
				life: 3000,
			});
			return;
		}

		this.uploading = true;
		this.uploadResult = null;

		this.surveyEAService.bulkUpload(this.surveyId, this.bulkUploadFile).subscribe({
			next: (result) => {
				this.uploadResult = result;
				this.uploading = false;
				this.messageService.add({
					severity: result.success ? 'success' : 'warn',
					summary: result.success ? 'Success' : 'Partial Success',
					detail: `Uploaded: ${result.successful}/${result.totalRows} rows. Created: ${result.created}, Skipped: ${result.skipped}, Failed: ${result.failed}`,
					life: 5000,
				});

				// Reload survey EAs if any were created
				if (result.created > 0) {
					this.loadSurveyEAs();
				}
			},
			error: (error) => {
				this.uploading = false;
				console.error('Error uploading CSV:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Upload Failed',
					detail: error.error?.message || 'Failed to upload file',
					life: 5000,
				});
			},
		});
	}

	/**
	 * Close bulk upload dialog and reset
	 */
	closeBulkUploadDialog() {
		this.showBulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
	}

	/**
	 * Get total EA count
	 */
	getTotalEACount(): number {
		return this.surveyEAs.length;
	}

	/**
	 * Handle table search
	 */
	onTableSearch(event: Event) {
		const input = event.target as HTMLInputElement;
		const table = (event.target as HTMLElement)
			.closest('p-table')
			?.querySelector('table');
		if (table) {
			// Get the p-table component instance
			const pTable = (event.target as HTMLElement).closest('p-table');
			if (pTable && (pTable as any).dt) {
				(pTable as any).dt.filterGlobal(input.value, 'contains');
			}
		}
	}

	
	

	/**
	 * Load household listings for the validation dialog
	 */
	loadHouseholdListingsForDialog(surveyEAId: number) {
		this.loadingHouseholdListings = true;
		
		// Load household listings
		this.householdService.getBySurveyEA(surveyEAId).subscribe({
			next: (listings: any[]) => {
				this.householdListings = listings;
				this.loadingHouseholdListings = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.loadingHouseholdListings = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
					life: 3000,
				});
			},
		});

		// Load statistics
		this.householdService.getStatisticsByEnumerationArea(surveyEAId).subscribe({
			next: (stats) => {
				this.householdListingsStatistics = stats;
			},
			error: (error) => {
				console.error('Error loading statistics:', error);
			},
		});
	}

	/**
	 * Close validation dialog
	 */
	closeValidationDialog() {
		this.showValidationDialog = false;
		this.validationComments = '';
		this.currentEAForValidation = null;
		this.householdListings = [];
		this.householdListingsStatistics = null;
	}

	/**
	 * Open generate blank entries dialog
	 */
	openGenerateBlankDialog() {
		if (!this.currentEAForValidation) return;
		this.blankCount = 20;
		this.blankRemarks = 'No data available - Historical survey entry';
		this.showGenerateBlankDialog = true;
	}

	/**
	 * Close generate blank entries dialog
	 */
	closeGenerateBlankDialog() {
		this.showGenerateBlankDialog = false;
		this.blankCount = 20;
		this.blankRemarks = 'No data available - Historical survey entry';
	}

	/**
	 * Generate blank household listings
	 */
	generateBlankHouseholdListings() {
		if (!this.currentEAForValidation) return;

		if (this.blankCount < 1 || this.blankCount > 10000) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Count',
				detail: 'Count must be between 1 and 10000',
				life: 3000,
			});
			return;
		}

		this.generatingBlank = true;

		const dto = {
			count: this.blankCount,
			remarks: this.blankRemarks?.trim() || undefined,
		};

		this.householdService
			.createBlankHouseholdListings(this.currentEAForValidation.id, dto)
			.subscribe({
				next: (response) => {
					this.generatingBlank = false;
					this.showGenerateBlankDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Successfully created ${response.created} blank household listing entries`,
						life: 3000,
					});
					// Reload household listings and statistics
					if (this.currentEAForValidation) {
						this.loadHouseholdListingsForDialog(this.currentEAForValidation.id);
					}
				},
				error: (error) => {
					this.generatingBlank = false;
					console.error('Error generating blank household listings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error?.error?.message ||
							'Failed to generate blank household listings',
						life: 3000,
					});
				},
			});
	}
}
