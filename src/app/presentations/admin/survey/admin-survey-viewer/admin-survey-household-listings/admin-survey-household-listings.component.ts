import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { CreateBlankHouseholdListingsDto, HouseholdListingStatisticsResponseDto, SurveyEnumerationAreaHouseholdListing, CreateSurveyEnumerationAreaHouseholdListingDto, BulkUploadResponse } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { AdministrativeZoneType } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { DzongkhagHierarchyDto, AdministrativeZoneHierarchyDto, SubAdministrativeZoneHierarchyDto, EnumerationAreaHierarchyDto } from '../../../../../core/dataservice/survey/survey-enumeration-hierarchy.dto';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { PaginationQueryDto, PaginatedResponse } from '../../../../../core/utility/pagination.utility.service';
import * as Papa from 'papaparse';

@Component({
	selector: 'app-admin-survey-household-listings',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-survey-household-listings.component.html',
	styleUrls: ['./admin-survey-household-listings.component.css'],
	providers: [MessageService],
})
export class AdminSurveyHouseholdListingsComponent 
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

	/** Title for the table section: "Showing all household listings" or hierarchical location with names. */
	get filterScopeTitle(): string {
		const dz = this.selectedDzongkhagFilter;
		const az = this.selectedAdminZoneFilter;
		const saz = this.selectedSubAdminZoneFilter;
		const ea = this.selectedEnumerationArea;

		if (!dz) return 'Showing all household listings';

		const dzPart = `${dz.name} Dzongkhag`;
		if (!az) return `Showing household listings for ${dzPart}`;

		const azLabel = az.type === AdministrativeZoneType.Thromde ? 'Thromde' : 'Gewog';
		const azPart = `${az.name} ${azLabel}`;
		if (!saz) return `Showing household listings for ${dzPart}, ${azPart}`;

		const sazLabel = az.type === AdministrativeZoneType.Thromde ? 'Lap' : 'Chiwog';
		const sazPart = `${saz.name} ${sazLabel}`;
		if (!ea) return `Showing household listings for ${dzPart}, ${azPart}, ${sazPart}`;

		return `Showing household listings for ${dzPart}, ${azPart}, ${sazPart}, ${ea.name}`;
	}

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

	// Bulk Upload Dialog
	showBulkUploadDialog = false;
	bulkUploadLoading = false;
	bulkUploadFile: File | null = null;
	bulkUploadResults: BulkUploadResponse | null = null;
	selectedEAForBulkUpload: EnumerationAreaHierarchyDto | null = null;
	downloadingTemplate = false;

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

	/**
	 * Open bulk upload dialog
	 */
	openBulkUploadDialog(): void {
		this.showBulkUploadDialog = true;
		this.selectedEAForBulkUpload = null;
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
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
	 * Close bulk upload dialog
	 */
	closeBulkUploadDialog(): void {
		this.showBulkUploadDialog = false;
		this.selectedEAForBulkUpload = null;
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
		this.selectedDialogDzongkhag = null;
		this.selectedDialogAdminZone = null;
		this.selectedDialogSubAdminZone = null;
		this.dialogAdminZoneFilters = [];
		this.dialogSubAdminZoneFilters = [];
		this.dialogEnumerationAreaOptions = [];
	}

	/**
	 * Download CSV template for selected enumeration area
	 */
	downloadTemplate(): void {
		if (!this.selectedEAForBulkUpload?.surveyEnumerationAreaId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select an enumeration area first',
			});
			return;
		}

		this.downloadingTemplate = true;
		this.householdService
			.downloadTemplate(this.selectedEAForBulkUpload.surveyEnumerationAreaId)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `household_template_${this.selectedEAForBulkUpload?.areaCode || 'template'}.csv`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					this.downloadingTemplate = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Template downloaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					this.downloadingTemplate = false;
					console.error('Error downloading template:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to download template',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle file selection for bulk upload
	 */
	onBulkUploadFileSelect(event: any): void {
		const file = event.files?.[0];
		if (file) {
			// Validate file type
			if (!file.name.endsWith('.csv')) {
				this.messageService.add({
					severity: 'error',
					summary: 'Invalid File',
					detail: 'Please select a CSV file',
					life: 3000,
				});
				return;
			}
			this.bulkUploadFile = file;
			this.bulkUploadResults = null;
		}
	}

	/**
	 * Remove selected file
	 */
	onBulkUploadFileRemove(): void {
		this.bulkUploadFile = null;
		this.bulkUploadResults = null;
	}

	/**
	 * Parse CSV file and convert to DTOs (using Promise wrapper for Papa.parse)
	 */
	parseCSVToDTOs(csvText: string): Promise<{
		valid: CreateSurveyEnumerationAreaHouseholdListingDto[];
		errors: Array<{ row: number; error: string }>;
	}> {
		return new Promise((resolve) => {
			if (!this.selectedEAForBulkUpload?.surveyEnumerationAreaId) {
				resolve({
					valid: [],
					errors: [{ row: 0, error: 'Enumeration area is not selected' }],
				});
				return;
			}

			const valid: CreateSurveyEnumerationAreaHouseholdListingDto[] = [];
			const errors: Array<{ row: number; error: string }> = [];

			Papa.parse(csvText, {
				header: true,
				skipEmptyLines: true,
				transformHeader: (header: string) => header.trim().toLowerCase(),
				complete: (results) => {
					const rows = results.data as any[];
					
					for (let i = 0; i < rows.length; i++) {
						const row = rows[i];
						
						try {
							const dto: CreateSurveyEnumerationAreaHouseholdListingDto = {
								surveyEnumerationAreaId: this.selectedEAForBulkUpload!.surveyEnumerationAreaId,
								structureId: this.parseNumber(row.structureid || row.structure_id) || 0,
								householdIdentification: (row.householdidentification || row.household_identification || row['household id'] || '').trim(),
								householdSerialNumber: this.parseNumber(row.householdserialnumber || row.household_serial_number || row['serial number']) || 0,
								nameOfHOH: (row.nameofhoh || row.name_of_hoh || row['head of household'] || row.name || '').trim(),
								totalMale: this.parseNumber(row.totalmale || row.total_male || row.male) || 0,
								totalFemale: this.parseNumber(row.totalfemale || row.total_female || row.female) || 0,
								phoneNumber: (row.phonenumber || row.phone_number || row.phone || '').trim() || undefined,
								remarks: (row.remarks || row.remark || row.notes || '').trim() || undefined,
							};

							// Validate required fields
							if (!dto.householdIdentification || !dto.nameOfHOH) {
								errors.push({
									row: i + 2, // +2 because header is row 1, and array is 0-indexed
									error: 'Missing required fields: householdIdentification and nameOfHOH are required',
								});
								continue;
							}

							if (dto.structureId <= 0) {
								errors.push({
									row: i + 2,
									error: 'Invalid structureId: must be a positive number',
								});
								continue;
							}

							valid.push(dto);
						} catch (error: any) {
							errors.push({
								row: i + 2,
								error: error.message || 'Failed to parse row',
							});
						}
					}

					resolve({ valid, errors });
				},
				error: (error: any) => {
					resolve({
						valid: [],
						errors: [{ row: 0, error: error.message || 'Failed to parse CSV file' }],
					});
				},
			});
		});
	}

	/**
	 * Helper method to parse numbers from CSV values
	 */
	private parseNumber(value: any): number | null {
		if (value === null || value === undefined || value === '') {
			return null;
		}
		const num = typeof value === 'string' ? parseFloat(value.trim()) : Number(value);
		return isNaN(num) ? null : num;
	}

	/**
	 * Upload household listings from CSV file
	 */
	uploadHouseholdListings(): void {
		if (!this.selectedEAForBulkUpload?.surveyEnumerationAreaId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select an enumeration area',
			});
			return;
		}

		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a CSV file to upload',
			});
			return;
		}

		this.bulkUploadLoading = true;
		const reader = new FileReader();

		reader.onload = async (e: any) => {
			try {
				const csvText = e.target.result;
				const { valid, errors } = await this.parseCSVToDTOs(csvText);

				if (valid.length === 0) {
					this.bulkUploadLoading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Validation Error',
						detail: `No valid rows found in CSV. ${errors.length} error(s) found.`,
						life: 5000,
					});
					return;
				}

				// Upload valid listings
				this.householdService.bulkUpload(valid).subscribe({
					next: (response: BulkUploadResponse) => {
						this.bulkUploadLoading = false;
						this.bulkUploadResults = response;
						
						if (response.success > 0) {
							this.messageService.add({
								severity: 'success',
								summary: 'Upload Complete',
								detail: `Successfully uploaded ${response.success} household listing(s). ${response.failed} failed.`,
								life: 5000,
							});

							// Refresh data if viewing the same EA
							if (
								this.selectedEAForBulkUpload &&
								this.selectedEnumerationArea?.surveyEnumerationAreaId === this.selectedEAForBulkUpload.surveyEnumerationAreaId
							) {
								const eaId = this.selectedEAForBulkUpload.surveyEnumerationAreaId;
								this.loadHouseholdListingsByEA(eaId);
								this.loadStatistics(eaId);
							} else {
								this.loadAllHouseholdListings();
								this.loadSurveyStatistics();
							}
						} else {
							this.messageService.add({
								severity: 'warn',
								summary: 'Upload Failed',
								detail: 'No household listings were uploaded. Please check the errors.',
								life: 5000,
							});
						}
					},
					error: (error) => {
						this.bulkUploadLoading = false;
						console.error('Error uploading household listings:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Upload Failed',
							detail: error?.error?.message || 'Failed to upload household listings',
							life: 5000,
						});
					},
				});
			} catch (error: any) {
				this.bulkUploadLoading = false;
				console.error('Error parsing CSV file:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Parse Error',
					detail: error.message || 'Failed to parse CSV file',
					life: 5000,
				});
			}
		};

		reader.onerror = () => {
			this.bulkUploadLoading = false;
			this.messageService.add({
				severity: 'error',
				summary: 'File Error',
				detail: 'Failed to read CSV file',
				life: 3000,
			});
		};

		reader.readAsText(this.bulkUploadFile);
	}
}
