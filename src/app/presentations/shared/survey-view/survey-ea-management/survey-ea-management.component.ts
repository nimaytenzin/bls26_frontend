import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';




import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
  
import { PrimeNgModules } from '../../../../primeng.modules';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumerationAreaDataService } from '../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SamplingDataService } from '../../../../core/dataservice/sampling/sampling.dataservice';
import { SurveyEnumerationArea } from '../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { AdministrativeZone, AdministrativeZoneType } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { SurveyEnumerationAreaHouseholdListing } from '../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { RunEnumerationAreaSamplingDto, SamplingExistsCheckDto, SamplingMethod, SurveySamplingConfigDto } from '../../../../core/dataservice/sampling/sampling.dto';
import { AuthService } from '../../../../core/dataservice/auth/auth.service';
 import { SurveyListingViewerComponent } from '../survey-enumeration-result-viewer/survey-listing-viewer.component';

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
	selector: 'app-survey-ea-management',
	templateUrl: './survey-ea-management.component.html',
	styleUrls: ['./survey-ea-management.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class SurveyEaManagementComponent implements OnInit {
	@Input() surveyId!: number;

	// Survey EAs (already assigned to this survey)
	surveyEAs: SurveyEnumerationArea[] = [];
	filteredSurveyEAs: SurveyEnumerationArea[] = [];
	groupedEAs: GroupedEA[] = [];
	loadingSurveyEAs = false;

	// Filter properties
	availableAdminZones: AdministrativeZone[] = [];
	availableSubAdminZones: SubAdministrativeZone[] = [];
	selectedAdminZoneId: number | null = null;
	selectedSubAdminZoneId: number | null = null;
	selectedStatus: string | null = null;
	statusOptions = [
		{ label: 'All', value: null },
		{ label: 'Enumerated', value: 'enumerated' },
		{ label: 'Sampled', value: 'sampled' },
		{ label: 'Published', value: 'published' },
	];

	// Household counts map: EA ID -> household count
	householdCounts: Map<number, number> = new Map();
	loadingHouseholdCounts = false;

	// Submission Dialog
	showSubmitDialog = false;
	submitting = false;
	submissionComments = '';
	currentEAForSubmission: SurveyEnumerationArea | null = null;

	// Household listings for dialog
	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	loadingHouseholdListings = false;
	householdListingsStatistics: any = null;

	// Generate Blank Entries Dialog
	showGenerateBlankDialog = false;
	generatingBlank = false;
	blankCount = 20;
	blankRemarks = 'No data available - Historical survey entry';

	// Global Sampling Configuration (loaded for use in sampling dialogs)
	samplingConfig: SurveySamplingConfigDto | null = null;
	configForm: FormGroup; // Used only for accessing default values in forms

	// Single EA Sampling Dialog
	showSamplingDialog = false;
	runForm: FormGroup;
	runningSampling = false;
	currentEAForSampling: SurveyEnumerationArea | null = null;

	// Bulk Sampling
	selectedEAIds = new Set<number>();
	bulkDialogVisible = false;
	bulkForm: FormGroup;
	bulkSubmitting = false;
	processingEAs: Set<number> = new Set();
	completedEAs: Set<number> = new Set();
	failedEAs: Map<number, string> = new Map();
	isProcessingBatch = false;

	// Results Viewing
	// Dynamic Dialog References
	householdDialogRef: DynamicDialogRef | undefined;
	resultDialogRef: DynamicDialogRef | undefined;

	// Table reference for filtering
	@ViewChild('dt') tableRef: any;

	constructor(
		private fb: FormBuilder,
		private surveyService: SurveyDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private samplingService: SamplingDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private authService: AuthService,
		private dialogService: DialogService
	) {
		// Initialize config form (for accessing default values)
		this.configForm = this.fb.group({
			defaultMethod: ['CSS'],
			defaultSampleSize: [12],
			urbanSampleSize: [12],
			ruralSampleSize: [16],
		});

		// Initialize run form
		this.runForm = this.fb.group({
			method: ['CSS', Validators.required],
			sampleSize: [12, [Validators.required, Validators.min(1)]],
			overwriteExisting: [false],
		});

		// Initialize bulk form
		this.bulkForm = this.fb.group({
			method: ['CSS', Validators.required],
			sampleSize: [12, [Validators.required, Validators.min(1)]],
			overwriteExisting: [true],
		});
	}

	ngOnInit() {
		if (this.surveyId) {
			this.loadSurveyEAs();
			this.loadSurveyConfigForSampling();
		}
	}

	/**
	 * Load survey enumeration areas
	 */
	loadSurveyEAs() {
		this.loadingSurveyEAs = true;
		this.surveyEAService.getBySurvey(this.surveyId).subscribe({
			next: (data: any[]) => {
				// Extract survey enumeration areas from hierarchical structure
				this.surveyEAs = this.extractSurveyEAs(data);
				this.extractFilterOptions();
				this.updateSubAdminZoneOptions();
				this.applyFilters();
				this.groupEAs();
				this.loadingSurveyEAs = false;
				// Load household counts for all EAs
				this.loadHouseholdCounts();
			},
			error: (error: any) => {
				console.error('Error loading survey enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
					life: 3000,
				});
				this.loadingSurveyEAs = false;
			},
		});
	}

	/**
	 * Load household counts for all enumeration areas
	 */
	loadHouseholdCounts() {
		if (this.surveyEAs.length === 0) return;

		this.loadingHouseholdCounts = true;
		const statisticsRequests = this.surveyEAs.map((ea) =>
			this.householdService.getStatisticsByEnumerationArea(ea.id).pipe(
				catchError((error) => {
					console.error(`Error loading statistics for EA ${ea.id}:`, error);
					// Return null on error, we'll handle it in the map
					return of(null);
				})
			)
		);

		forkJoin(statisticsRequests).subscribe({
			next: (results) => {
				results.forEach((stats, index) => {
					if (stats && this.surveyEAs[index]) {
						this.householdCounts.set(
							this.surveyEAs[index].id,
							stats.totalHouseholds || 0
						);
					} else {
						// Set to 0 if stats failed to load
						if (this.surveyEAs[index]) {
							this.householdCounts.set(this.surveyEAs[index].id, 0);
						}
					}
				});
				this.loadingHouseholdCounts = false;
			},
			error: (error) => {
				console.error('Error loading household counts:', error);
				this.loadingHouseholdCounts = false;
			},
		});
	}

	/**
	 * Get household count for an enumeration area
	 */
	getHouseholdCount(ea: SurveyEnumerationArea | null): number {
		if (!ea || !ea.id) return 0;
		return this.householdCounts.get(ea.id) || 0;
	}

	/**
	 * Extract survey enumeration areas from hierarchical data
	 */
	private extractSurveyEAs(dzongkhags: any[]): SurveyEnumerationArea[] {
		const surveyEAs: SurveyEnumerationArea[] = [];

		dzongkhags.forEach((dz) => {
			dz.administrativeZones?.forEach((az: any) => {
				az.subAdministrativeZones?.forEach((saz: any) => {
					saz.enumerationAreas?.forEach((ea: any) => {
						ea.surveyEnumerationAreas?.forEach((surveyEA: any) => {
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
	 * Extract unique admin zones and sub admin zones from survey EAs
	 */
	extractFilterOptions() {
		const adminZoneMap = new Map<number, AdministrativeZone>();
		const subAdminZoneMap = new Map<number, SubAdministrativeZone>();

		for (const surveyEA of this.surveyEAs) {
			const ea = surveyEA.enumerationArea;
			if (!ea) continue;

			const subAdminZone = ea.subAdministrativeZone;
			if (subAdminZone && !subAdminZoneMap.has(subAdminZone.id)) {
				subAdminZoneMap.set(subAdminZone.id, subAdminZone);
			}

			const adminZone = subAdminZone?.administrativeZone;
			if (adminZone && !adminZoneMap.has(adminZone.id)) {
				adminZoneMap.set(adminZone.id, adminZone);
			}
		}

		this.availableAdminZones = Array.from(adminZoneMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		this.availableSubAdminZones = Array.from(subAdminZoneMap.values()).sort(
			(a, b) => a.name.localeCompare(b.name)
		);
	}

	/**
	 * Apply filters to survey EAs
	 */
	applyFilters() {
		let filtered = [...this.surveyEAs];

		// Filter by admin zone
		if (this.selectedAdminZoneId !== null) {
			filtered = filtered.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZone?.administrativeZone?.id ===
					this.selectedAdminZoneId
			);
		}

		// Filter by sub admin zone
		if (this.selectedSubAdminZoneId !== null) {
			filtered = filtered.filter(
				(ea) =>
					ea.enumerationArea?.subAdministrativeZone?.id ===
					this.selectedSubAdminZoneId
			);
		}

		// Filter by status
		if (this.selectedStatus !== null) {
			switch (this.selectedStatus) {
				case 'enumerated':
					filtered = filtered.filter((ea) => ea.isEnumerated === true);
					break;
				case 'sampled':
					filtered = filtered.filter(
						(ea) => ea.isSampled === true && ea.isPublished !== true
					);
					break;
				case 'published':
					filtered = filtered.filter((ea) => ea.isPublished === true);
					break;
			}
		}

		this.filteredSurveyEAs = filtered;
	}

	/**
	 * Handle admin zone filter change
	 */
	onAdminZoneFilterChange() {
		// Reset sub admin zone filter when admin zone changes
		this.selectedSubAdminZoneId = null;
		this.updateSubAdminZoneOptions();
		this.applyFilters();
	}

	/**
	 * Handle sub admin zone filter change
	 */
	onSubAdminZoneFilterChange() {
		this.applyFilters();
	}

	/**
	 * Handle status filter change
	 */
	onStatusFilterChange() {
		this.applyFilters();
	}

	/**
	 * Update sub admin zone options based on selected admin zone
	 */
	updateSubAdminZoneOptions() {
		if (this.selectedAdminZoneId === null) {
			// Show all sub admin zones
			const subAdminZoneMap = new Map<number, SubAdministrativeZone>();
			for (const surveyEA of this.surveyEAs) {
				const subAdminZone = surveyEA.enumerationArea?.subAdministrativeZone;
				if (subAdminZone && !subAdminZoneMap.has(subAdminZone.id)) {
					subAdminZoneMap.set(subAdminZone.id, subAdminZone);
				}
			}
			this.availableSubAdminZones = Array.from(subAdminZoneMap.values()).sort(
				(a, b) => a.name.localeCompare(b.name)
			);
		} else {
			// Show only sub admin zones for selected admin zone
			const subAdminZoneMap = new Map<number, SubAdministrativeZone>();
			for (const surveyEA of this.surveyEAs) {
				const subAdminZone = surveyEA.enumerationArea?.subAdministrativeZone;
				if (
					subAdminZone &&
					subAdminZone.administrativeZone?.id === this.selectedAdminZoneId &&
					!subAdminZoneMap.has(subAdminZone.id)
				) {
					subAdminZoneMap.set(subAdminZone.id, subAdminZone);
				}
			}
			this.availableSubAdminZones = Array.from(subAdminZoneMap.values()).sort(
				(a, b) => a.name.localeCompare(b.name)
			);
		}
	}

	/**
	 * Clear all filters
	 */
	clearFilters() {
		this.selectedAdminZoneId = null;
		this.selectedSubAdminZoneId = null;
		this.selectedStatus = null;
		this.updateSubAdminZoneOptions();
		this.applyFilters();
	}

	/**
	 * Group EAs by location hierarchy
	 */
	groupEAs() {
		const grouped = new Map<number, GroupedEA>();

		for (const surveyEA of this.filteredSurveyEAs) {
			const ea = surveyEA.enumerationArea;
			if (!ea) continue;

			const subAdminZone = ea.subAdministrativeZone;
			if (!subAdminZone) continue;

			const adminZone = subAdminZone.administrativeZone;
			if (!adminZone) continue;

			const dzongkhag = adminZone.dzongkhag;
			if (!dzongkhag) continue;

			// Get or create dzongkhag group
			let dzGroup = grouped.get(dzongkhag.id);
			if (!dzGroup) {
				dzGroup = {
					dzongkhag,
					administrativeZones: [],
				};
				grouped.set(dzongkhag.id, dzGroup);
			}

			// Get or create admin zone group
			let azGroup = dzGroup.administrativeZones.find(
				(g) => g.adminZone.id === adminZone.id
			);
			if (!azGroup) {
				azGroup = {
					adminZone,
					subAdministrativeZones: [],
				};
				dzGroup.administrativeZones.push(azGroup);
			}

			// Get or create sub-admin zone group
			let sazGroup = azGroup.subAdministrativeZones.find(
				(g) => g.subAdminZone.id === subAdminZone.id
			);
			if (!sazGroup) {
				sazGroup = {
					subAdminZone,
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
	 * Get total EA count
	 */
	getTotalEACount(): number {
		return this.filteredSurveyEAs.length;
	}

	/**
	 * Get enumerated EA count
	 */
	getEnumeratedCount(): number {
		return this.filteredSurveyEAs.filter((ea) => ea.isEnumerated === true)
			.length;
	}

	/**
	 * Get sampled EA count (sampled but not published)
	 */
	getSampledCount(): number {
		return this.filteredSurveyEAs.filter(
			(ea) => ea.isSampled === true && ea.isPublished !== true
		).length;
	}

	/**
	 * Get published EA count
	 */
	getPublishedCount(): number {
		return this.filteredSurveyEAs.filter((ea) => ea.isPublished === true)
			.length;
	}

	/**
	 * Get pending EA count (not enumerated yet)
	 */
	getPendingCount(): number {
		return this.filteredSurveyEAs.filter((ea) => !ea.isEnumerated).length;
	}

	/**
	 * Load household listings for the dialog
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
	 * Close submit dialog
	 */
	closeSubmitDialog() {
		this.showSubmitDialog = false;
		this.submissionComments = '';
		this.currentEAForSubmission = null;
		this.householdListings = [];
		this.householdListingsStatistics = null;
	}

	/**
	 * Open generate blank entries dialog
	 */
	openGenerateBlankDialog() {
		if (!this.currentEAForSubmission) return;
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
		if (!this.currentEAForSubmission) return;

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
			.createBlankHouseholdListings(this.currentEAForSubmission.id, dto)
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
					if (this.currentEAForSubmission) {
						this.loadHouseholdListingsForDialog(this.currentEAForSubmission.id);
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

	/**
	 * Handle table search
	 */
	onTableSearch(event: any) {
		if (this.tableRef) {
			this.tableRef.filterGlobal(event.target.value, 'contains');
		}
	}

	/**
	 * Get location hierarchy display text
	 */
	getLocationHierarchy(ea: any): string {
		if (!ea) return 'N/A';
		const parts: string[] = [];
		if (ea.subAdministrativeZone?.administrativeZone?.dzongkhag?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.dzongkhag.name);
		}
		if (ea.subAdministrativeZone?.administrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.name);
		}
		if (ea.subAdministrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.name);
		}
		return parts.length > 0 ? parts.join(' > ') : 'N/A';
	}

	// ==================== Config Loading for Sampling ====================

	/**
	 * Load survey sampling configuration (for use in sampling dialogs)
	 */
	loadSurveyConfigForSampling(): void {
		if (!this.surveyId) {
			this.samplingConfig = null;
			return;
		}

		this.samplingService.getSurveyConfig(this.surveyId).subscribe({
			next: (config) => {
				if (!config) {
					// No config exists - use defaults
					this.samplingConfig = null;
					return;
				}
				this.samplingConfig = config;
				// Update configForm with loaded values for use in forms
				this.configForm.patchValue(
					{
						defaultMethod: config.defaultMethod,
						defaultSampleSize: config.defaultSampleSize ?? 12,
						urbanSampleSize:
							config.urbanSampleSize ?? config.defaultSampleSize ?? 12,
						ruralSampleSize:
							config.ruralSampleSize ?? config.defaultSampleSize ?? 16,
					},
					{ emitEvent: false }
				);
			},
			error: (error) => {
				if (error?.status === 404) {
					// No config exists - this is normal, use defaults
					this.samplingConfig = null;
					return;
				}
				console.error('Error loading sampling config:', error);
				// Don't show error message - config is optional
			},
		});
	}

	// ==================== Single EA Sampling ====================

	/**
	 * Open sampling dialog for single EA
	 */
	openSamplingDialog(ea: SurveyEnumerationArea) {
		if (!this.canSelectEA(ea)) {
			return;
		}

		this.currentEAForSampling = ea;
		const recommendedSize = this.getRecommendedSampleSize(ea);
		this.runForm.reset({
			method: this.configForm.value.defaultMethod ?? 'CSS',
			sampleSize:
				recommendedSize ?? this.configForm.value.defaultSampleSize ?? 12,
			overwriteExisting: false,
		});
		this.showSamplingDialog = true;
	}

	/**
	 * Close sampling dialog
	 */
	closeSamplingDialog() {
		this.showSamplingDialog = false;
		this.currentEAForSampling = null;
		this.runningSampling = false;
	}

	/**
	 * Run sampling for single enumeration area
	 */
	runSampling(): void {
		if (!this.surveyId || !this.currentEAForSampling) {
			return;
		}

		if (this.runForm.invalid) {
			this.runForm.markAllAsTouched();
			return;
		}

		// First, check if sampling already exists
		this.runningSampling = true;
		this.samplingService
			.checkSamplingExists(this.surveyId, this.currentEAForSampling.id)
			.subscribe({
				next: (checkResult: SamplingExistsCheckDto) => {
					if (checkResult.exists && checkResult.data) {
						// Sampling exists - show confirmation dialog
						this.runningSampling = false;
						this.showOverwriteConfirmation(checkResult.data);
					} else {
						// No existing sampling - proceed directly
						this.executeSampling(false);
					}
				},
				error: (error) => {
					// If check fails, proceed anyway (might be a new EA)
					console.warn(
						'Error checking sampling existence, proceeding anyway:',
						error
					);
					this.executeSampling(false);
				},
			});
	}

	/**
	 * Show confirmation dialog when sampling already exists
	 */
	private showOverwriteConfirmation(
		existingSampling: SamplingExistsCheckDto['data']
	): void {
		if (!existingSampling) return;

		const executedDate = existingSampling.executedAt
			? new Date(existingSampling.executedAt).toLocaleString()
			: 'Unknown';

		this.confirmationService.confirm({
			message: `Sampling already exists for this enumeration area.
				<br/><br/>
				<strong>Existing Sampling Details:</strong><br/>
				Method: ${existingSampling.method}<br/>
				Sample Size: ${existingSampling.sampleSize}<br/>
				Population Size: ${existingSampling.populationSize}<br/>
				Executed At: ${executedDate}<br/><br/>
				Do you want to overwrite the existing sampling? This will delete all existing household samples and create new ones.`,
			header: 'Sampling Already Exists',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			acceptLabel: 'Yes, Overwrite',
			rejectLabel: 'Cancel',
			accept: () => {
				// User confirmed - proceed with overwrite
				this.executeSampling(true);
			},
			reject: () => {
				// User cancelled - do nothing
			},
		});
	}

	/**
	 * Execute the sampling with the given payload
	 */
	private executeSampling(overwriteExisting: boolean): void {
		if (!this.surveyId || !this.currentEAForSampling) {
			return;
		}

		const payload: RunEnumerationAreaSamplingDto = {
			method: this.runForm.value.method,
			sampleSize: this.runForm.value.sampleSize,
			overwriteExisting: overwriteExisting,
		};

		this.runningSampling = true;
		this.samplingService
			.runSampling(this.surveyId, this.currentEAForSampling.id, payload)
			.subscribe({
				next: () => {
					this.runningSampling = false;
					this.showSamplingDialog = false;
					this.currentEAForSampling = null;
					this.loadSurveyEAs();
					this.messageService.add({
						severity: 'success',
						summary: 'Sampling completed',
						detail: overwriteExisting
							? 'Existing sampling has been overwritten successfully'
							: 'Enumeration area has been sampled successfully',
					});
				},
				error: (error) => {
					this.runningSampling = false;
					console.error('Error running sampling:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to run sampling',
					});
				},
			});
	}

	// ==================== Bulk Sampling ====================

	/**
	 * Check if EA can be selected (must be enumerated)
	 */
	canSelectEA(ea: SurveyEnumerationArea): boolean {
		return ea.isEnumerated === true;
	}

	/**
	 * Check if EA is selected
	 */
	isEASelected(ea: SurveyEnumerationArea): boolean {
		return this.selectedEAIds.has(ea.id);
	}

	/**
	 * Toggle EA selection
	 */
	toggleEASelection(ea: SurveyEnumerationArea, checked: boolean): void {
		if (!this.canSelectEA(ea)) {
			return;
		}
		if (checked) {
			this.selectedEAIds.add(ea.id);
		} else {
			this.selectedEAIds.delete(ea.id);
		}
	}

	/**
	 * Get selected enumerated EAs
	 */
	getSelectedEnumeratedEAs(): SurveyEnumerationArea[] {
		return this.filteredSurveyEAs.filter(
			(ea) => this.selectedEAIds.has(ea.id) && this.canSelectEA(ea)
		);
	}

	/**
	 * Clear selection
	 */
	clearSelection(): void {
		this.selectedEAIds.clear();
	}

	/**
	 * Open bulk sampling dialog
	 */
	openBulkDialog(): void {
		const selectedEAs = this.getSelectedEnumeratedEAs();
		if (selectedEAs.length === 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'Select enumeration areas',
				detail:
					'Choose at least one enumerated enumeration area to run bulk sampling',
			});
			return;
		}

		this.bulkForm.reset({
			method: this.configForm.value.defaultMethod ?? 'CSS',
			sampleSize: this.configForm.value.defaultSampleSize ?? 12,
			overwriteExisting: true,
		});
		this.bulkDialogVisible = true;
	}

	/**
	 * Run bulk sampling for selected EAs
	 */
	runBulkSampling(): void {
		if (!this.surveyId) {
			return;
		}

		if (this.bulkForm.invalid) {
			this.bulkForm.markAllAsTouched();
			return;
		}

		const selectedEAs = this.getSelectedEnumeratedEAs();
		if (selectedEAs.length === 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'Select enumeration areas',
				detail:
					'Choose at least one enumerated enumeration area to run bulk sampling',
			});
			return;
		}

		// Close dialog and process sequentially
		this.bulkDialogVisible = false;
		this.bulkSubmitting = true;

		// Process selected EAs sequentially
		this.processSelectedEAsSequentially(
			this.bulkForm.value.method,
			this.bulkForm.value.sampleSize
		);
	}

	/**
	 * Process selected enumeration areas sequentially (one at a time)
	 */
	async processSelectedEAsSequentially(
		method?: SamplingMethod,
		sampleSize?: number
	): Promise<void> {
		if (!this.surveyId) {
			return;
		}

		const selectedEAs = this.getSelectedEnumeratedEAs();
		if (selectedEAs.length === 0) {
			return;
		}

		if (this.isProcessingBatch) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Processing',
				detail: 'Already processing enumeration areas. Please wait.',
			});
			return;
		}

		this.isProcessingBatch = true;
		this.processingEAs.clear();
		this.completedEAs.clear();
		this.failedEAs.clear();

		const totalEAs = selectedEAs.length;

		for (let i = 0; i < selectedEAs.length; i++) {
			const ea = selectedEAs[i];
			this.processingEAs.add(ea.id);

			// Show progress message
			this.messageService.add({
				severity: 'info',
				summary: 'Processing',
				detail: `Processing EA ${i + 1} of ${totalEAs}: ${
					ea.enumerationArea?.name || 'N/A'
				}`,
				life: 3000,
			});

			try {
				await this.processSingleEA(ea, method, sampleSize);
				this.completedEAs.add(ea.id);
			} catch (error: any) {
				const errorMessage = error?.error?.message || 'Unknown error';
				this.failedEAs.set(ea.id, errorMessage);
				console.error(`Error processing EA ${ea.id}:`, error);
			} finally {
				this.processingEAs.delete(ea.id);
			}
		}

		this.isProcessingBatch = false;
		this.bulkSubmitting = false;
		this.selectedEAIds.clear();
		this.loadSurveyEAs();

		// Show summary
		const completed = this.completedEAs.size;
		const failed = this.failedEAs.size;

		if (completed > 0 && failed === 0) {
			this.messageService.add({
				severity: 'success',
				summary: 'Processing Complete',
				detail: `Successfully processed ${completed} enumeration area(s)`,
				life: 5000,
			});
		} else if (completed > 0 && failed > 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Processing Complete with Errors',
				detail: `Completed: ${completed}, Failed: ${failed}`,
				life: 5000,
			});
		} else if (failed > 0) {
			this.messageService.add({
				severity: 'error',
				summary: 'Processing Failed',
				detail: `Failed to process ${failed} enumeration area(s)`,
				life: 5000,
			});
		}
	}

	/**
	 * Process a single enumeration area (check → confirm → run)
	 */
	private processSingleEA(
		ea: SurveyEnumerationArea,
		method?: SamplingMethod,
		sampleSize?: number
	): Promise<void> {
		return new Promise((resolve, reject) => {
			// Step 1: Check if sampling exists
			this.samplingService
				.checkSamplingExists(this.surveyId!, ea.id)
				.subscribe({
					next: (checkResult: SamplingExistsCheckDto) => {
						if (checkResult.exists && checkResult.data) {
							// Step 2: Show confirmation dialog
							this.confirmationService.confirm({
								message: `Sampling already exists for ${
									ea.enumerationArea?.name || 'this EA'
								}.
									<br/><br/>
									<strong>Existing Sampling Details:</strong><br/>
									Method: ${checkResult.data.method}<br/>
									Sample Size: ${checkResult.data.sampleSize}<br/>
									Population Size: ${checkResult.data.populationSize}<br/>
									Executed At: ${new Date(checkResult.data.executedAt).toLocaleString()}<br/><br/>
									Do you want to overwrite? This will delete all existing household samples and create new ones.`,
								header: 'Sampling Already Exists',
								icon: 'pi pi-exclamation-triangle',
								acceptButtonStyleClass: 'p-button-danger',
								acceptLabel: 'Yes, Overwrite',
								rejectLabel: 'Skip',
								accept: () => {
									// User confirmed - proceed with overwrite
									this.executeSamplingForEA(ea, method, sampleSize, true)
										.then(resolve)
										.catch(reject);
								},
								reject: () => {
									// User cancelled - skip this EA
									resolve();
								},
							});
						} else {
							// No existing sampling - proceed directly
							this.executeSamplingForEA(ea, method, sampleSize, false)
								.then(resolve)
								.catch(reject);
						}
					},
					error: (error: any) => {
						reject(error);
					},
				});
		});
	}

	/**
	 * Execute sampling for a single EA
	 */
	private executeSamplingForEA(
		ea: SurveyEnumerationArea,
		method?: SamplingMethod,
		sampleSize?: number,
		overwriteExisting: boolean = false
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const payload: RunEnumerationAreaSamplingDto = {
				method: method || this.configForm.value.defaultMethod || 'CSS',
				sampleSize:
					sampleSize ||
					this.getRecommendedSampleSize(ea) ||
					this.configForm.value.defaultSampleSize ||
					12,
				overwriteExisting: overwriteExisting,
			};

			this.samplingService
				.runSampling(this.surveyId!, ea.id, payload)
				.subscribe({
					next: () => {
						resolve();
					},
					error: (error: any) => {
						reject(error);
					},
				});
		});
	}

	/**
	 * Get recommended sample size based on urban/rural
	 */
	getRecommendedSampleSize(ea: SurveyEnumerationArea): number | undefined {
		const adminZone =
			ea.enumerationArea?.subAdministrativeZone?.administrativeZone;
		const isUrban = adminZone?.type === AdministrativeZoneType.Thromde;
		if (isUrban) {
			return (
				this.configForm.value.urbanSampleSize ||
				this.configForm.value.defaultSampleSize
			);
		}
		return (
			this.configForm.value.ruralSampleSize ||
			this.configForm.value.defaultSampleSize
		);
	}

	/**
	 * Check if EA is currently being processed
	 */
	isEAProcessing(ea: SurveyEnumerationArea): boolean {
		return this.processingEAs.has(ea.id);
	}

	/**
	 * Check if EA has been completed in current batch
	 */
	isEACompleted(ea: SurveyEnumerationArea): boolean {
		return this.completedEAs.has(ea.id);
	}

	/**
	 * Check if EA failed in current batch
	 */
	isEAFailed(ea: SurveyEnumerationArea): boolean {
		return this.failedEAs.has(ea.id);
	}

	/**
	 * Get error message for failed EA
	 */
	getEAErrorMessage(ea: SurveyEnumerationArea): string | null {
		return this.failedEAs.get(ea.id) || null;
	}

	// ==================== Results Viewing ====================

	/**
	 * Open results dialog using dynamic dialog service
	 */
	openResultDialog(ea: SurveyEnumerationArea): void {
		if (!this.surveyId) {
			return;
		}

		this.resultDialogRef = this.dialogService.open(
			SurveyListingViewerComponent,
			{
				header: 'Household Listings',
				width: '90vw',
				style: { 'max-width': '1200px' },
				modal: true,
				closable: true,
				data: {
					surveyId: this.surveyId,
					enumerationArea: ea,
				},
			}
		);

		// Handle dialog close
		this.resultDialogRef.onClose.subscribe(() => {
			this.resultDialogRef = undefined;
		});
	}

	/**
	 * Check if EA is enumerated (can view households)
	 */
	canViewHouseholds(ea: SurveyEnumerationArea): boolean {
		return ea.isEnumerated === true;
	}

	/**
	 * Check if EA is ready for sampling (enumerated but not sampled and not published)
	 */
	isReadyForSampling(ea: SurveyEnumerationArea): boolean {
		return ea.isEnumerated === true && !ea.isSampled && !ea.isPublished;
	}

	/**
	 * Check if EA has been sampled (show view results option)
	 */
	isSampled(ea: SurveyEnumerationArea): boolean {
		return ea.isSampled === true;
	}
}
