import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SurveyEnumerationAreaDataService } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyEnumerationArea } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import {
	SurveyEnumerationAreaHouseholdListing,
	HouseholdStatistics,
} from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import {
	SamplingService,
	SamplingMethod,
	SamplingResult,
} from '../../../../../core/utility/sampling';

@Component({
	selector: 'app-admin-survey-enumeration-area-household-listings',
	templateUrl:
		'./admin-survey-enumeration-area-household-listings.component.html',
	styleUrls: [
		'./admin-survey-enumeration-area-household-listings.component.css',
	],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminSurveyEnumerationAreaHouseholdListingsComponent
	implements OnInit, OnChanges
{
	@Input() surveyId!: number;
	@Input() surveyName!: string;

	// Data
	surveyEnumerationAreas: SurveyEnumerationArea[] = [];
	filteredEnumerationAreas: SurveyEnumerationArea[] = [];
	selectedEA: SurveyEnumerationArea | null = null;
	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	statistics: HouseholdStatistics | null = null;

	// Filters
	dzongkhagFilters: Dzongkhag[] = [];
	adminZoneFilters: AdministrativeZone[] = [];
	subAdminZoneFilters: SubAdministrativeZone[] = [];

	selectedDzongkhagFilter: Dzongkhag | null = null;
	selectedAdminZoneFilter: AdministrativeZone | null = null;
	selectedSubAdminZoneFilter: SubAdministrativeZone | null = null;

	// UI State
	loading = false;
	loadingListings = false;
	loadingStatistics = false;
	validating = false;

	// Validation dialog
	showValidationDialog = false;
	validationComments = '';
	currentValidationEA: SurveyEnumerationArea | null = null;

	// Sampling
	showSamplingDialog = false;
	samplingMethod: 'CSS' | 'SRS' = 'CSS';
	sampleSize = 12;
	customRandomStart: number | null = null;
	samplingResult: SamplingResult<SurveyEnumerationAreaHouseholdListing> | null =
		null;
	selectedSampledHouseholds: SurveyEnumerationAreaHouseholdListing[] = [];
	performingSampling = false;

	constructor(
		private surveyEAService: SurveyEnumerationAreaDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private samplingService: SamplingService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadSurveyEnumerationAreas();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['surveyId'] && !changes['surveyId'].firstChange) {
			this.loadSurveyEnumerationAreas();
		}
	}

	/**
	 * Load all survey enumeration areas for the survey
	 */
	loadSurveyEnumerationAreas() {
		this.loading = true;
		this.surveyEAService.getBySurvey(this.surveyId).subscribe({
			next: (data) => {
				// Extract survey enumeration areas from hierarchical structure
				this.surveyEnumerationAreas = this.extractSurveyEAs(data);
				this.filteredEnumerationAreas = [...this.surveyEnumerationAreas];
				this.buildFilters();
				this.loading = false;

				// Don't auto-select - let user search and select
			},
			error: (error) => {
				console.error('Error loading enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
				});
				this.loading = false;
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
	 * Build filter options from loaded EAs
	 */
	buildFilters() {
		// Extract unique dzongkhags
		const dzongkhagMap = new Map<number, Dzongkhag>();
		this.surveyEnumerationAreas.forEach((ea) => {
			const dz =
				ea.enumerationArea?.subAdministrativeZone?.administrativeZone
					?.dzongkhag;
			if (dz && !dzongkhagMap.has(dz.id)) {
				dzongkhagMap.set(dz.id, dz);
			}
		});
		this.dzongkhagFilters = Array.from(dzongkhagMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	/**
	 * Handle dzongkhag filter change
	 */
	onDzongkhagFilterChange() {
		this.selectedAdminZoneFilter = null;
		this.selectedSubAdminZoneFilter = null;
		this.adminZoneFilters = [];
		this.subAdminZoneFilters = [];

		if (this.selectedDzongkhagFilter) {
			// Build admin zone filters for selected dzongkhag
			const adminZoneMap = new Map<number, AdministrativeZone>();
			this.surveyEnumerationAreas.forEach((ea) => {
				const az =
					ea.enumerationArea?.subAdministrativeZone?.administrativeZone;
				if (
					az &&
					az.dzongkhag?.id === this.selectedDzongkhagFilter?.id &&
					!adminZoneMap.has(az.id)
				) {
					adminZoneMap.set(az.id, az);
				}
			});
			this.adminZoneFilters = Array.from(adminZoneMap.values()).sort((a, b) =>
				a.name.localeCompare(b.name)
			);
		}

		this.applyFilters();
	}

	/**
	 * Handle admin zone filter change
	 */
	onAdminZoneFilterChange() {
		this.selectedSubAdminZoneFilter = null;
		this.subAdminZoneFilters = [];

		if (this.selectedAdminZoneFilter) {
			// Build sub-admin zone filters for selected admin zone
			const subAdminZoneMap = new Map<number, SubAdministrativeZone>();
			this.surveyEnumerationAreas.forEach((ea) => {
				const saz = ea.enumerationArea?.subAdministrativeZone;
				if (
					saz &&
					saz.administrativeZone?.id === this.selectedAdminZoneFilter?.id &&
					!subAdminZoneMap.has(saz.id)
				) {
					subAdminZoneMap.set(saz.id, saz);
				}
			});
			this.subAdminZoneFilters = Array.from(subAdminZoneMap.values()).sort(
				(a, b) => a.name.localeCompare(b.name)
			);
		}

		this.applyFilters();
	}

	/**
	 * Apply all filters
	 */
	applyFilters() {
		this.filteredEnumerationAreas = this.surveyEnumerationAreas.filter((ea) => {
			// Dzongkhag filter
			if (this.selectedDzongkhagFilter) {
				const dzId =
					ea.enumerationArea?.subAdministrativeZone?.administrativeZone
						?.dzongkhag?.id;
				if (dzId !== this.selectedDzongkhagFilter.id) return false;
			}

			// Admin zone filter
			if (this.selectedAdminZoneFilter) {
				const azId =
					ea.enumerationArea?.subAdministrativeZone?.administrativeZone?.id;
				if (azId !== this.selectedAdminZoneFilter.id) return false;
			}

			// Sub-admin zone filter
			if (this.selectedSubAdminZoneFilter) {
				const sazId = ea.enumerationArea?.subAdministrativeZone?.id;
				if (sazId !== this.selectedSubAdminZoneFilter.id) return false;
			}

			return true;
		});
	}

	/**
	 * Clear selection
	 */
	clearSelection() {
		this.selectedEA = null;
		this.householdListings = [];
		this.statistics = null;
	}

	/**
	 * Handle EA selection
	 */
	onEASelect() {
		if (this.selectedEA) {
			this.selectEnumerationArea(this.selectedEA);
		}
	}

	/**
	 * Select an enumeration area and load its household listings
	 */
	selectEnumerationArea(ea: SurveyEnumerationArea) {
		this.selectedEA = ea;
		this.loadHouseholdListings(ea.id);
		this.loadStatistics(ea.id);
	}

	/**
	 * Load household listings for selected enumeration area
	 */
	loadHouseholdListings(surveyEnumerationAreaId: number) {
		this.loadingListings = true;
		this.householdService.getBySurveyEA(surveyEnumerationAreaId).subscribe({
			next: (listings) => {
				console.log('hosuehold listings for EA', listings);
				this.householdListings = listings;
				this.loadingListings = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
				});
				this.loadingListings = false;
			},
		});
	}

	/**
	 * Load statistics for selected enumeration area
	 */
	loadStatistics(surveyEnumerationAreaId: number) {
		this.loadingStatistics = true;
		this.householdService.getStatistics(surveyEnumerationAreaId).subscribe({
			next: (stats) => {
				this.statistics = stats;
				this.loadingStatistics = false;
			},
			error: (error) => {
				console.error('Error loading statistics:', error);
				this.loadingStatistics = false;
			},
		});
	}

	/**
	 * Download CSV template for selected enumeration area
	 */
	downloadTemplate() {
		if (!this.selectedEA) return;

		this.householdService.downloadTemplate(this.selectedEA.id).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `household_template_EA_${
					this.selectedEA?.enumerationArea?.areaCode || this.selectedEA?.id
				}.csv`;
				link.click();
				window.URL.revokeObjectURL(url);

				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Template downloaded successfully',
				});
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download template',
				});
			},
		});
	}

	/**
	 * Export household listings to CSV
	 */
	exportToCSV() {
		if (!this.householdListings || this.householdListings.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'No data to export',
			});
			return;
		}

		const headers = [
			'ID',
			'Structure Number',
			'Household ID',
			'Serial Number',
			'Head of Household',
			'Total Male',
			'Total Female',
			'Total',
			'Phone Number',
			'Remarks',
		];

		const csvData = this.householdListings.map((listing) => [
			listing.id,
			listing.structureNumber,
			listing.householdIdentification,
			listing.householdSerialNumber,
			listing.nameOfHOH,
			listing.totalMale,
			listing.totalFemale,
			listing.totalMale + listing.totalFemale,
			listing.phoneNumber || '',
			listing.remarks || '',
		]);

		let csvContent = headers.join(',') + '\n';
		csvData.forEach((row) => {
			csvContent += row.map((val) => `"${val}"`).join(',') + '\n';
		});

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `household_listings_EA_${
			this.selectedEA?.enumerationArea?.areaCode || this.selectedEA?.id
		}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Data exported successfully',
		});
	}

	/**
	 * Get total population for a household
	 */
	getTotalPopulation(listing: SurveyEnumerationAreaHouseholdListing): number {
		return listing.totalMale + listing.totalFemale;
	}

	/**
	 * Open validation dialog for approve
	 */
	openApproveDialog(ea: SurveyEnumerationArea) {
		this.currentValidationEA = ea;
		this.validationComments = '';
		this.showValidationDialog = true;
	}

	/**
	 * Open validation dialog for reject
	 */
	openRejectDialog(ea: SurveyEnumerationArea) {
		this.confirmationService.confirm({
			message: `Are you sure you want to reject the submission for ${ea.enumerationArea?.name}? This will require the supervisor to resubmit.`,
			header: 'Confirm Rejection',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.currentValidationEA = ea;
				this.validationComments = '';
				this.showValidationDialog = true;
			},
		});
	}

	/**
	 * Approve the enumeration area data
	 */
	approveEnumerationArea() {
		if (!this.currentValidationEA) return;

		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Unable to get current user information',
			});
			return;
		}

		this.validating = true;

		this.surveyEAService
			.validate(this.currentValidationEA.id, {
				validatedBy: currentUser.id,
				isApproved: true,
				comments: this.validationComments || undefined,
			})
			.subscribe({
				next: (updatedEA) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Approved',
						detail: `Enumeration area ${updatedEA.enumerationArea?.name} has been approved and validated`,
					});
					this.validating = false;
					this.showValidationDialog = false;
					this.validationComments = '';
					this.currentValidationEA = null;

					// Reload the enumeration areas to reflect the updated status
					this.loadSurveyEnumerationAreas();
				},
				error: (error) => {
					this.validating = false;
					console.error('Error approving enumeration area:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error?.error?.message || 'Failed to approve enumeration area',
					});
				},
			});
	}

	/**
	 * Reject the enumeration area data
	 */
	rejectEnumerationArea() {
		if (!this.currentValidationEA) return;

		if (!this.validationComments || this.validationComments.trim() === '') {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please provide comments explaining the rejection',
			});
			return;
		}

		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Unable to get current user information',
			});
			return;
		}

		this.validating = true;

		this.surveyEAService
			.validate(this.currentValidationEA.id, {
				validatedBy: currentUser.id,
				isApproved: false,
				comments: this.validationComments,
			})
			.subscribe({
				next: (updatedEA) => {
					this.messageService.add({
						severity: 'info',
						summary: 'Rejected',
						detail: `Enumeration area ${updatedEA.enumerationArea?.name} has been rejected. Supervisor will be notified to resubmit.`,
					});
					this.validating = false;
					this.showValidationDialog = false;
					this.validationComments = '';
					this.currentValidationEA = null;

					// Reload the enumeration areas to reflect the updated status
					this.loadSurveyEnumerationAreas();
				},
				error: (error) => {
					this.validating = false;
					console.error('Error rejecting enumeration area:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error?.error?.message || 'Failed to reject enumeration area',
					});
				},
			});
	}

	/**
	 * Close validation dialog
	 */
	closeValidationDialog() {
		this.showValidationDialog = false;
		this.validationComments = '';
		this.currentValidationEA = null;
	}

	/**
	 * Check if enumeration area can be validated
	 */
	canValidate(ea: SurveyEnumerationArea): boolean {
		return ea.isSubmitted && !ea.isValidated;
	}

	/**
	 * Get formatted EA code
	 * Format: DZONGKHAG.areaCodeAdmZon.areaCodeSubAdminZone.areaCodeEa
	 * For now, returns the EA area code as-is since we don't have nested objects
	 */
	getFormattedEACode(ea: SurveyEnumerationArea): string {
		if (!ea.enumerationArea?.areaCode) {
			return 'N/A';
		}
		return ea.enumerationArea.areaCode;
	}

	/**
	 * Get location hierarchy display text
	 * Returns available location information
	 */
	getLocationHierarchy(ea: SurveyEnumerationArea): string {
		if (!ea.enumerationArea) {
			return 'Location information not available';
		}
		// For now, just show the EA name since we don't have nested objects
		return ea.enumerationArea.name || 'N/A';
	}

	/**
	 * Open sampling dialog
	 */
	openSamplingDialog() {
		if (!this.selectedEA) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select an enumeration area first',
			});
			return;
		}

		if (this.householdListings.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'No household listings available for sampling',
			});
			return;
		}

		// Reset sampling state
		this.samplingResult = null;
		this.selectedSampledHouseholds = [];
		this.customRandomStart = null;

		// Set default sample size based on population
		const populationSize = this.householdListings.length;
		if (populationSize <= 12) {
			this.sampleSize = populationSize;
		} else {
			this.sampleSize = 12; // Default urban sample size
		}

		this.showSamplingDialog = true;
	}

	/**
	 * Perform sampling based on selected method
	 */
	performSampling() {
		if (!this.selectedEA || this.householdListings.length === 0) {
			return;
		}

		this.performingSampling = true;

		try {
			if (this.samplingMethod === 'CSS') {
				// Circular Systematic Sampling
				this.samplingResult = this.samplingService.sampleCSS(
					this.householdListings,
					this.sampleSize,
					this.customRandomStart || undefined
				);
			} else {
				// Simple Random Sampling
				this.samplingResult = this.samplingService.sampleSRS(
					this.householdListings,
					this.sampleSize
				);
			}

			this.selectedSampledHouseholds = this.samplingResult.selectedHouseholds;

			this.messageService.add({
				severity: 'success',
				summary: 'Sampling Completed',
				detail: `Successfully selected ${this.samplingResult.selectedHouseholds.length} households using ${this.samplingMethod}`,
			});

			this.performingSampling = false;
		} catch (error: any) {
			console.error('Sampling error:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Sampling Failed',
				detail: error.message || 'An error occurred during sampling',
			});
			this.performingSampling = false;
		}
	}

	/**
	 * Close sampling dialog
	 */
	closeSamplingDialog() {
		this.showSamplingDialog = false;
		this.samplingResult = null;
		this.selectedSampledHouseholds = [];
	}

	/**
	 * Export sampling results to CSV
	 */
	exportSamplingResults() {
		if (!this.samplingResult) {
			return;
		}

		try {
			// Create CSV header
			const headers = [
				'Selection Order',
				'Household Position',
				'Structure Number',
				'Household ID',
				'Serial Number',
				'Head of Household',
				'Total Male',
				'Total Female',
				'Total Population',
				'Phone Number',
			];

			// Create CSV rows
			const rows = this.samplingResult.selectedHouseholds.map((hh, index) => [
				index + 1,
				this.samplingResult!.selectedIndices[index],
				hh.structureNumber || '',
				hh.householdIdentification || '',
				hh.householdSerialNumber || '',
				hh.nameOfHOH || '',
				hh.totalMale || 0,
				hh.totalFemale || 0,
				(hh.totalMale || 0) + (hh.totalFemale || 0),
				hh.phoneNumber || '',
			]);

			// Combine into CSV string
			const csvContent = [
				headers.join(','),
				...rows.map((row) =>
					row.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(',')
				),
			].join('\n');

			// Add metadata as comments
			const metadata = [
				`# Sampling Method: ${this.samplingResult.method}`,
				`# Population Size: ${this.samplingResult.metadata.populationSize}`,
				`# Sample Size: ${this.samplingResult.metadata.sampleSize}`,
				`# Actual Sample: ${this.samplingResult.metadata.actualSampleSize}`,
				`# Full Selection: ${this.samplingResult.metadata.isFullSelection}`,
				`# Timestamp: ${this.samplingResult.metadata.timestamp.toISOString()}`,
			];

			if (this.samplingMethod === 'CSS' && this.samplingResult.metadata) {
				const cssMetadata = this.samplingResult.metadata as any;
				metadata.push(
					`# Sampling Interval: ${cssMetadata.samplingInterval}`,
					`# Random Start: ${cssMetadata.randomStart}`,
					`# Wrap-around Count: ${cssMetadata.wrapAroundCount}`
				);
			}

			const fullCSV = [...metadata, '', csvContent].join('\n');

			// Download file
			const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `sampling_results_EA_${
				this.selectedEA?.enumerationArea?.areaCode ||
				this.selectedEA?.id ||
				'unknown'
			}_${this.samplingMethod}_${new Date().getTime()}.csv`;
			link.click();
			window.URL.revokeObjectURL(url);

			this.messageService.add({
				severity: 'success',
				summary: 'Success',
				detail: 'Sampling results exported successfully',
			});
		} catch (error) {
			console.error('Export error:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Failed to export sampling results',
			});
		}
	}

	/**
	 * Get recommended sample size based on population
	 */
	getRecommendedSampleSize(): number {
		const populationSize = this.householdListings.length;
		if (populationSize <= 12) {
			return populationSize;
		}
		return this.samplingService.getRecommendedSampleSize('urban'); // Default to urban (12)
	}

	/**
	 * Check if full selection will occur
	 */
	isFullSelection(): boolean {
		return this.samplingService.isFullSelectionNeeded(
			this.householdListings.length,
			this.sampleSize
		);
	}

	/**
	 * Get CSS metadata safely (type guard)
	 */
	getCSSMetadata(): any {
		if (this.samplingResult && this.samplingMethod === 'CSS') {
			return this.samplingResult.metadata;
		}
		return null;
	}
}
