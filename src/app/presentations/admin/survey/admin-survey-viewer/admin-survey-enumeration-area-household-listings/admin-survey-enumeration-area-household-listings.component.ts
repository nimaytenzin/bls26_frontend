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
import { TableLazyLoadEvent } from 'primeng/table';
import { SurveyEnumerationAreaDataService } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumerationArea } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import { SamplingDataService } from '../../../../../core/dataservice/sampling/sampling.dataservice';
import {
	SurveyEnumerationAreaHouseholdListing,
	HouseholdListingStatisticsResponseDto,
} from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import {
	DzongkhagHierarchyDto,
	AdministrativeZoneHierarchyDto,
	SubAdministrativeZoneHierarchyDto,
	EnumerationAreaHierarchyDto,
} from '../../../../../core/dataservice/survey/survey-enumeration-hierarchy.dto';
import {
	PaginationQueryDto,
	PaginatedResponse,
} from '../../../../../core/utility/pagination.utility.service';

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
	statistics: HouseholdListingStatisticsResponseDto | null = null;

	// Pagination
	householdListingsTotalRecords = 0;
	householdListingsPageSize = 10;
	householdListingsPageIndex = 0;
	householdListingsLoading = false;

	// Filters (using hierarchy DTOs)
	dzongkhagFilters: DzongkhagHierarchyDto[] = [];
	adminZoneFilters: AdministrativeZoneHierarchyDto[] = [];
	subAdminZoneFilters: SubAdministrativeZoneHierarchyDto[] = [];
	enumerationAreaOptions: EnumerationAreaHierarchyDto[] = [];

	selectedDzongkhagFilter: DzongkhagHierarchyDto | null = null;
	selectedAdminZoneFilter: AdministrativeZoneHierarchyDto | null = null;
	selectedSubAdminZoneFilter: SubAdministrativeZoneHierarchyDto | null = null;
	selectedEnumerationArea: EnumerationAreaHierarchyDto | null = null;

	// UI State
	loading = false;
	loadingStatistics = false;
	validating = false;

	// Validation dialog
	showValidationDialog = false;
	validationComments = '';
	currentValidationEA: SurveyEnumerationArea | null = null;

	// Selected households for highlighting (sampling)
	selectedHouseholdIds: Set<number> = new Set();

	constructor(
		private surveyEAService: SurveyEnumerationAreaDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private surveyDataService: SurveyDataService,
		private authService: AuthService,
		private samplingService: SamplingDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadHierarchy();
			this.loadAllHouseholdListings();
			this.loadSurveyStatistics();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['surveyId'] && !changes['surveyId'].firstChange) {
			this.resetState();
			this.loadHierarchy();
			this.loadAllHouseholdListings();
			this.loadSurveyStatistics();
		}
	}

	private resetState(): void {
		this.selectedEA = null;
		this.selectedEnumerationArea = null;
		this.householdListings = [];
		this.householdListingsTotalRecords = 0;
		this.householdListingsPageIndex = 0;
		this.statistics = null;
		this.selectedDzongkhagFilter = null;
		this.selectedAdminZoneFilter = null;
		this.selectedSubAdminZoneFilter = null;
		this.adminZoneFilters = [];
		this.subAdminZoneFilters = [];
		this.enumerationAreaOptions = [];
	}

	/**
	 * Load hierarchy from survey data service
	 */
	loadHierarchy() {
		if (!this.surveyId) return;
		this.loading = true;
		this.surveyDataService.getSurveyEnumerationHierarchy(this.surveyId).subscribe({
			next: (response) => {
				this.dzongkhagFilters = response?.hierarchy ?? [];
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading hierarchy:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration hierarchy',
				});
				this.loading = false;
			},
		});
	}

	/**
	 * Handle dzongkhag filter change
	 */
	onDzongkhagFilterChange() {
		this.selectedAdminZoneFilter = null;
		this.selectedSubAdminZoneFilter = null;
		this.selectedEnumerationArea = null;
		this.adminZoneFilters = [];
		this.subAdminZoneFilters = [];
		this.enumerationAreaOptions = [];

		if (this.selectedDzongkhagFilter) {
			this.adminZoneFilters = this.selectedDzongkhagFilter.administrativeZones ?? [];
		}

		// Reload all household listings when filter changes
		this.householdListingsPageIndex = 0;
		this.loadAllHouseholdListings();
	}

	/**
	 * Handle admin zone filter change
	 */
	onAdminZoneFilterChange() {
		this.selectedSubAdminZoneFilter = null;
		this.selectedEnumerationArea = null;
		this.subAdminZoneFilters = [];
		this.enumerationAreaOptions = [];

		if (this.selectedAdminZoneFilter) {
			this.subAdminZoneFilters = this.selectedAdminZoneFilter.subAdministrativeZones ?? [];
		}

		// Reload all household listings when filter changes
		this.householdListingsPageIndex = 0;
		this.loadAllHouseholdListings();
	}

	/**
	 * Handle sub-admin zone filter change
	 */
	onSubAdminZoneFilterChange() {
		this.selectedEnumerationArea = null;
		this.enumerationAreaOptions = [];

		if (this.selectedSubAdminZoneFilter) {
			this.enumerationAreaOptions = this.selectedSubAdminZoneFilter.enumerationAreas ?? [];
		}

		// Reload all household listings when filter changes
		this.householdListingsPageIndex = 0;
		this.loadAllHouseholdListings();
	}

	/**
	 * Handle enumeration area selection
	 */
	onEnumerationAreaSelect() {
		if (this.selectedEnumerationArea) {
			this.householdListingsPageIndex = 0;
			this.loadHouseholdListingsByEA(this.selectedEnumerationArea.surveyEnumerationAreaId);
			this.loadStatistics(this.selectedEnumerationArea.surveyEnumerationAreaId);
		} else {
			// If EA is cleared, reload survey-level statistics
			this.loadSurveyStatistics();
		}
	}

	/**
	 * Clear selection
	 */
	clearSelection() {
		this.selectedEA = null;
		this.selectedEnumerationArea = null;
		this.householdListings = [];
		this.householdListingsTotalRecords = 0;
		this.householdListingsPageIndex = 0;
		this.selectedHouseholdIds.clear();
		this.loadAllHouseholdListings();
		this.loadSurveyStatistics();
	}

	/**
	 * Load all household listings by survey (paginated)
	 */
	loadAllHouseholdListings(event?: TableLazyLoadEvent) {
		if (!this.surveyId) return;

		if (event) {
			this.householdListingsPageSize = event.rows ?? this.householdListingsPageSize;
			const first = event.first ?? 0;
			this.householdListingsPageIndex = Math.floor(first / this.householdListingsPageSize);
		}

		const page = this.householdListingsPageIndex + 1;
		const query: PaginationQueryDto = {
			page,
			limit: this.householdListingsPageSize,
			sortBy: 'createdAt',
			sortOrder: 'DESC',
		};

		// Only show loading overlay if there's no existing data (prevents blinking)
		const hasExistingData = this.householdListings.length > 0;
		if (!hasExistingData) {
			this.householdListingsLoading = true;
		}

		this.householdService.getBySurveyPaginated(this.surveyId, query).subscribe({
			next: (response: PaginatedResponse<SurveyEnumerationAreaHouseholdListing>) => {
				this.householdListings = response.data;
				this.householdListingsTotalRecords = response.meta.totalItems;
				this.householdListingsPageIndex = response.meta.currentPage - 1;
				this.householdListingsPageSize = response.meta.itemsPerPage;
				this.householdListingsLoading = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
				});
				this.householdListingsLoading = false;
			},
		});
	}

	/**
	 * Load household listings for selected enumeration area (paginated)
	 */
	loadHouseholdListingsByEA(surveyEnumerationAreaId: number, event?: TableLazyLoadEvent) {
		if (event) {
			this.householdListingsPageSize = event.rows ?? this.householdListingsPageSize;
			const first = event.first ?? 0;
			this.householdListingsPageIndex = Math.floor(first / this.householdListingsPageSize);
		}

		const page = this.householdListingsPageIndex + 1;
		const query: PaginationQueryDto = {
			page,
			limit: this.householdListingsPageSize,
			sortBy: 'createdAt',
			sortOrder: 'DESC',
		};

		// Only show loading overlay if there's no existing data (prevents blinking)
		const hasExistingData = this.householdListings.length > 0;
		if (!hasExistingData) {
			this.householdListingsLoading = true;
		}

		this.householdService.getBySurveyEnumerationAreaPaginated(surveyEnumerationAreaId, query).subscribe({
			next: (response: PaginatedResponse<SurveyEnumerationAreaHouseholdListing>) => {
				this.householdListings = response.data;
				this.householdListingsTotalRecords = response.meta.totalItems;
				this.householdListingsPageIndex = response.meta.currentPage - 1;
				this.householdListingsPageSize = response.meta.itemsPerPage;
				this.householdListingsLoading = false;
				
				// Load selected household IDs for highlighting
				this.loadSelectedHouseholdIds(surveyEnumerationAreaId);
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
				});
				this.householdListingsLoading = false;
			},
		});
	}

	/**
	 * Load selected household IDs for highlighting sampled households
	 */
	loadSelectedHouseholdIds(surveyEnumerationAreaId: number) {
		if (!this.surveyId) return;

		// Reset selected households
		this.selectedHouseholdIds.clear();

		// Load selected household IDs
		this.samplingService.getSelectedHouseholdIds(this.surveyId, surveyEnumerationAreaId).subscribe({
			next: (householdIds: number[]) => {
				this.selectedHouseholdIds = new Set(householdIds);
			},
			error: (error) => {
				// Silently fail - empty array is returned if no sampling exists
				console.error('Error loading selected household IDs:', error);
				this.selectedHouseholdIds.clear();
			},
		});
	}

	/**
	 * Check if a household is selected (sampled)
	 */
	isHouseholdSelected(householdId: number): boolean {
		return this.selectedHouseholdIds.has(householdId);
	}

	/**
	 * Handle table lazy load event
	 */
	onLazyLoad(event: TableLazyLoadEvent) {
		if (this.selectedEnumerationArea) {
			this.loadHouseholdListingsByEA(this.selectedEnumerationArea.surveyEnumerationAreaId, event);
		} else {
			this.loadAllHouseholdListings(event);
		}
	}

	/**
	 * Load statistics for selected enumeration area
	 */
	loadStatistics(surveyEnumerationAreaId: number) {
		if (!surveyEnumerationAreaId) return;
		this.loadingStatistics = true;
		this.householdService.getStatisticsByEnumerationArea(surveyEnumerationAreaId).subscribe({
			next: (stats) => {
				this.statistics = stats;
				this.loadingStatistics = false;
			},
			error: (error) => {
				console.error('Error loading enumeration area statistics:', error);
				this.loadingStatistics = false;
			},
		});
	}

	/**
	 * Load statistics for entire survey (across all enumeration areas)
	 */
	loadSurveyStatistics() {
		if (!this.surveyId) return;
		this.loadingStatistics = true;
		this.householdService.getStatisticsBySurvey(this.surveyId).subscribe({
			next: (stats) => {
				this.statistics = stats;
				this.loadingStatistics = false;
			},
			error: (error) => {
				console.error('Error loading survey statistics:', error);
				this.loadingStatistics = false;
			},
		});
	}

	/**
	 * Download CSV template for selected enumeration area
	 */
	downloadTemplate() {
		if (!this.selectedEnumerationArea) return;

		this.householdService.downloadTemplate(this.selectedEnumerationArea.surveyEnumerationAreaId).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `household_template_EA_${
					this.selectedEnumerationArea?.areaCode || this.selectedEnumerationArea?.id
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
			this.selectedEnumerationArea?.areaCode || this.selectedEnumerationArea?.id || 'all'
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
	 * Export all household listings for a survey as ZIP (CSV + metadata TXT)
	 */
	exportSurveyHouseholdListingsZip() {
		if (!this.surveyId) return;

		this.householdService.exportSurveyHouseholdListings(this.surveyId).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `household_listings_survey_${this.surveyId}_${Date.now()}.zip`;
				link.click();
				window.URL.revokeObjectURL(url);

				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Survey household listings exported as ZIP successfully',
				});
			},
			error: (error) => {
				console.error('Error exporting survey household listings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to export survey household listings',
				});
			},
		});
	}

	/**
	 * Export all household listings for a survey enumeration area as ZIP (CSV + metadata TXT)
	 */
	exportEnumerationAreaHouseholdListingsZip() {
		if (!this.selectedEnumerationArea) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select an enumeration area to export',
			});
			return;
		}

		this.householdService
			.exportEnumerationAreaHouseholdListings(
				this.selectedEnumerationArea.surveyEnumerationAreaId
			)
			.subscribe({
				next: (blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `household_listings_ea_${this.selectedEnumerationArea?.surveyEnumerationAreaId}_${Date.now()}.zip`;
					link.click();
					window.URL.revokeObjectURL(url);

					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Enumeration area household listings exported as ZIP successfully',
					});
				},
				error: (error) => {
					console.error('Error exporting enumeration area household listings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to export enumeration area household listings',
					});
				},
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
	 * Close validation dialog
	 */
	closeValidationDialog() {
		this.showValidationDialog = false;
		this.validationComments = '';
		this.currentValidationEA = null;
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

}
