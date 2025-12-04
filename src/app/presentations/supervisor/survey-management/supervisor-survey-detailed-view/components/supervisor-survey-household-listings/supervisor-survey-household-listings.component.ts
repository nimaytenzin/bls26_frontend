import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import {
	SurveyEnumerationAreaHouseholdListing,
	HouseholdListingStatisticsResponseDto,
	CreateBlankHouseholdListingsDto,
} from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import {
	DzongkhagHierarchyDto,
	AdministrativeZoneHierarchyDto,
	SubAdministrativeZoneHierarchyDto,
	EnumerationAreaHierarchyDto,
} from '../../../../../../core/dataservice/survey/survey-enumeration-hierarchy.dto';
import {
	PaginationQueryDto,
	PaginatedResponse,
} from '../../../../../../core/utility/pagination.utility.service';

@Component({
	selector: 'app-supervisor-survey-household-listings',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './supervisor-survey-household-listings.component.html',
	styleUrls: ['./supervisor-survey-household-listings.component.css'],
	providers: [MessageService],
})
export class SupervisorSurveyHouseholdListingsComponent
	implements OnInit, OnChanges
{
	@Input() surveyId!: number;
	@Input() surveyName?: string;

	// Data
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

	// Create Blank Household Listings Dialog
	showCreateBlankDialog = false;
	creatingBlank = false;
	blankForm: CreateBlankHouseholdListingsDto = {
		count: 1,
		remarks: '',
	};
	selectedEAForBlank: EnumerationAreaHierarchyDto | null = null;
	
	// Dialog-specific filters (separate from main filters)
	dialogDzongkhagFilters: DzongkhagHierarchyDto[] = [];
	dialogAdminZoneFilters: AdministrativeZoneHierarchyDto[] = [];
	dialogSubAdminZoneFilters: SubAdministrativeZoneHierarchyDto[] = [];
	dialogEnumerationAreaOptions: EnumerationAreaHierarchyDto[] = [];
	selectedDialogDzongkhag: DzongkhagHierarchyDto | null = null;
	selectedDialogAdminZone: AdministrativeZoneHierarchyDto | null = null;
	selectedDialogSubAdminZone: SubAdministrativeZoneHierarchyDto | null = null;

	constructor(
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private surveyDataService: SurveyDataService,
		private messageService: MessageService
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
			this.loadAllHouseholdListings();
		}
	}

	/**
	 * Clear selection
	 */
	clearSelection() {
		this.selectedEnumerationArea = null;
		this.selectedDzongkhagFilter = null;
		this.selectedAdminZoneFilter = null;
		this.selectedSubAdminZoneFilter = null;
		this.adminZoneFilters = [];
		this.subAdminZoneFilters = [];
		this.enumerationAreaOptions = [];
		this.householdListingsPageIndex = 0;
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
	 * Get total population for a household
	 */
	getTotalPopulation(listing: SurveyEnumerationAreaHouseholdListing): number {
		return listing.totalMale + listing.totalFemale;
	}

	/**
	 * Open create blank household listings dialog
	 */
	openCreateBlankDialog(): void {
		this.showCreateBlankDialog = true;
		this.selectedEAForBlank = null;
		this.blankForm = {
			count: 1,
			remarks: '',
		};
		// Initialize dialog filters with full hierarchy
		this.dialogDzongkhagFilters = [...this.dzongkhagFilters];
		this.selectedDialogDzongkhag = null;
		this.selectedDialogAdminZone = null;
		this.selectedDialogSubAdminZone = null;
		this.dialogAdminZoneFilters = [];
		this.dialogSubAdminZoneFilters = [];
		this.dialogEnumerationAreaOptions = [];
	}

	/**
	 * Handle dzongkhag filter change in dialog
	 */
	onDialogDzongkhagChange(): void {
		this.selectedDialogAdminZone = null;
		this.selectedDialogSubAdminZone = null;
		this.selectedEAForBlank = null;
		this.dialogAdminZoneFilters = [];
		this.dialogSubAdminZoneFilters = [];
		this.dialogEnumerationAreaOptions = [];

		if (this.selectedDialogDzongkhag) {
			this.dialogAdminZoneFilters = this.selectedDialogDzongkhag.administrativeZones ?? [];
		}
	}

	/**
	 * Handle admin zone filter change in dialog
	 */
	onDialogAdminZoneChange(): void {
		this.selectedDialogSubAdminZone = null;
		this.selectedEAForBlank = null;
		this.dialogSubAdminZoneFilters = [];
		this.dialogEnumerationAreaOptions = [];

		if (this.selectedDialogAdminZone) {
			this.dialogSubAdminZoneFilters = this.selectedDialogAdminZone.subAdministrativeZones ?? [];
		}
	}

	/**
	 * Handle sub-admin zone filter change in dialog
	 */
	onDialogSubAdminZoneChange(): void {
		this.selectedEAForBlank = null;
		this.dialogEnumerationAreaOptions = [];

		if (this.selectedDialogSubAdminZone) {
			this.dialogEnumerationAreaOptions = this.selectedDialogSubAdminZone.enumerationAreas ?? [];
		}
	}

	/**
	 * Close create blank household listings dialog
	 */
	closeCreateBlankDialog(): void {
		this.showCreateBlankDialog = false;
		this.selectedEAForBlank = null;
		this.blankForm = {
			count: 1,
			remarks: '',
		};
		this.selectedDialogDzongkhag = null;
		this.selectedDialogAdminZone = null;
		this.selectedDialogSubAdminZone = null;
		this.dialogAdminZoneFilters = [];
		this.dialogSubAdminZoneFilters = [];
		this.dialogEnumerationAreaOptions = [];
	}

	/**
	 * Create blank household listings for selected enumeration area
	 */
	createBlankHouseholdListings(): void {
		if (!this.selectedEAForBlank || !this.selectedEAForBlank.surveyEnumerationAreaId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select an enumeration area',
			});
			return;
		}

		if (!this.blankForm.count || this.blankForm.count < 1 || this.blankForm.count > 10000) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Count must be between 1 and 10000',
			});
			return;
		}

		this.creatingBlank = true;
		const dto: CreateBlankHouseholdListingsDto = {
			count: this.blankForm.count,
			remarks: this.blankForm.remarks?.trim() || undefined,
		};

		this.householdService
			.createBlankHouseholdListings(this.selectedEAForBlank.surveyEnumerationAreaId, dto)
			.subscribe({
				next: (response) => {
					this.creatingBlank = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Successfully created ${response.created} blank household listing(s)`,
						life: 5000,
					});
					this.closeCreateBlankDialog();

					// Refresh data
					if (
						this.selectedEAForBlank &&
						this.selectedEnumerationArea?.surveyEnumerationAreaId === this.selectedEAForBlank.surveyEnumerationAreaId
					) {
						// If viewing the same EA, reload its listings
						const eaId = this.selectedEAForBlank.surveyEnumerationAreaId;
						this.loadHouseholdListingsByEA(eaId);
						this.loadStatistics(eaId);
					} else {
						// Otherwise reload all listings
						this.loadAllHouseholdListings();
						this.loadSurveyStatistics();
					}
				},
				error: (error) => {
					this.creatingBlank = false;
					console.error('Error creating blank household listings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to create blank household listings',
						life: 5000,
					});
				},
			});
	}
}
