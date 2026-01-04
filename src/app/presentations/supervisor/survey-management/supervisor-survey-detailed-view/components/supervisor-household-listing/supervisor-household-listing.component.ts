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
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { HouseholdListingStatisticsResponseDto, SurveyEnumerationAreaHouseholdListing, CreateSurveyEnumerationAreaHouseholdListingDto, BulkUploadResponse } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SupervisorSurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/supervisor-survey-enumeration-area-household-listing.dataservice';
import { DzongkhagHierarchyDto, AdministrativeZoneHierarchyDto, SubAdministrativeZoneHierarchyDto } from '../../../../../../core/dataservice/survey/survey-enumeration-hierarchy.dto';
import { EnumerationArea } from '../../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';

// Extended types for enumeration areas with surveyEnumerationAreaId (flattened structure from supervisor API)
interface EnumerationAreaWithSurveyId extends EnumerationArea {
	surveyEnumerationAreaId?: number;
	isEnumerated?: boolean;
	isSampled?: boolean;
	isPublished?: boolean;
}
import { PaginationQueryDto, PaginatedResponse } from '../../../../../../core/utility/pagination.utility.service';
import * as Papa from 'papaparse';
import { SupervisorSurveyDataService } from '../../../../../../core/dataservice/survey/supervisor-survey.dataservice';

@Component({
	selector: 'app-supervisor-household-listing',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './supervisor-household-listing.component.html',
	styleUrls: ['./supervisor-household-listing.component.scss'],
	providers: [MessageService],
})
export class SupervisorHouseholdListingComponent 
	implements OnInit, OnChanges
{
	@Input() surveyId!: number;
	@Input() surveyName?: string;

	// Data
	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	statistics: HouseholdListingStatisticsResponseDto | null = null;

	// Pagination (for frontend sorting, we load all data)
	householdListingsTotalRecords = 0;
	householdListingsPageSize = 10;
	householdListingsPageIndex = 0;
	householdListingsLoading = false;
	allHouseholdListings: SurveyEnumerationAreaHouseholdListing[] = []; // Store all data for frontend sorting

	// Filters (using supervisor hierarchy response)
	dzongkhagFilters: DzongkhagHierarchyDto[] = [];
	adminZoneFilters: AdministrativeZoneHierarchyDto[] = [];
	subAdminZoneFilters: SubAdministrativeZoneHierarchyDto[] = [];
	enumerationAreaOptions: EnumerationAreaWithSurveyId[] = [];

	selectedDzongkhagFilter: DzongkhagHierarchyDto | null = null;
	selectedAdminZoneFilter: AdministrativeZoneHierarchyDto | null = null;
	selectedSubAdminZoneFilter: SubAdministrativeZoneHierarchyDto | null = null;
	selectedEnumerationArea: EnumerationAreaWithSurveyId | null = null;

	// UI State
	loading = false;
	loadingStatistics = false;

	// Dialog-specific filters (separate from main filters)
	dialogDzongkhagFilters: DzongkhagHierarchyDto[] = [];
	dialogAdminZoneFilters: AdministrativeZoneHierarchyDto[] = [];
	dialogSubAdminZoneFilters: SubAdministrativeZoneHierarchyDto[] = [];
	dialogEnumerationAreaOptions: EnumerationAreaWithSurveyId[] = [];
	selectedDialogDzongkhag: DzongkhagHierarchyDto | null = null;
	selectedDialogAdminZone: AdministrativeZoneHierarchyDto | null = null;
	selectedDialogSubAdminZone: SubAdministrativeZoneHierarchyDto | null = null;

	// Bulk Upload Dialog
	showBulkUploadDialog = false;
	bulkUploadLoading = false;
	bulkUploadFile: File | null = null;
	bulkUploadResults: BulkUploadResponse | null = null;
	selectedEAForBulkUpload: EnumerationAreaWithSurveyId | null = null;
	downloadingTemplate = false;
	downloadingDzongkhagExport = false;

	constructor(
		private householdService: SupervisorSurveyEnumerationAreaHouseholdListingDataService,
		private supervisorSurveyService: SupervisorSurveyDataService,
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
		this.allHouseholdListings = [];
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
	 * Load hierarchy from supervisor survey service
	 */
	loadHierarchy() {
		if (!this.surveyId) return;
		this.loading = true;
		this.supervisorSurveyService.getSurveyEnumerationHierarchy(this.surveyId).subscribe({
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
			// Map enumeration areas to include surveyEnumerationAreaId if available
			this.enumerationAreaOptions = (this.selectedSubAdminZoneFilter.enumerationAreas ?? []).map((ea: any) => ({
				...ea,
				surveyEnumerationAreaId: ea.surveyEnumerationAreaId || (ea.surveyEnumerationAreas && ea.surveyEnumerationAreas.length > 0 ? ea.surveyEnumerationAreas[0].id : undefined)
			}));
		}

		// Reload all household listings when filter changes
		this.householdListingsPageIndex = 0;
		this.loadAllHouseholdListings();
	}

	/**
	 * Handle enumeration area selection
	 */
	onEnumerationAreaSelect() {
		if (this.selectedEnumerationArea && this.selectedEnumerationArea.surveyEnumerationAreaId) {
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
	 * Load all household listings by survey (load all data for frontend sorting)
	 */
	loadAllHouseholdListings() {
		if (!this.surveyId) return;

		this.householdListingsLoading = true;

		// Load all data without pagination for frontend sorting
		const query: PaginationQueryDto = {
			page: 1,
			limit: 10000, // Load a large number to get all records
		};

		this.householdService.getBySurveyPaginated(this.surveyId, query).subscribe({
			next: (response: PaginatedResponse<SurveyEnumerationAreaHouseholdListing>) => {
				this.allHouseholdListings = response.data;
				this.householdListingsTotalRecords = response.meta.totalItems;
				
				// If there are more records, we might need to load them
				// For now, use the first page and let frontend handle sorting
				this.householdListings = [...this.allHouseholdListings];
				this.householdListingsPageIndex = 0;
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
	 * Load household listings for selected enumeration area (load all data for frontend sorting)
	 */
	loadHouseholdListingsByEA(surveyEnumerationAreaId: number) {
		this.householdListingsLoading = true;

		// Load all data without pagination for frontend sorting
		const query: PaginationQueryDto = {
			page: 1,
			limit: 10000, // Load a large number to get all records
		};

		this.householdService.getBySurveyEnumerationAreaPaginated(surveyEnumerationAreaId, query).subscribe({
			next: (response: PaginatedResponse<SurveyEnumerationAreaHouseholdListing>) => {
				this.allHouseholdListings = response.data;
				this.householdListingsTotalRecords = response.meta.totalItems;
				
				// Use all data for frontend sorting
				this.householdListings = [...this.allHouseholdListings];
				this.householdListingsPageIndex = 0;
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
	 * Load statistics for selected enumeration area
	 */
	loadStatistics(surveyEnumerationAreaId: number) {
		if (!surveyEnumerationAreaId) return;
		this.loadingStatistics = true;
		this.householdService.getHouseholdCount(surveyEnumerationAreaId).subscribe({
			next: (stats) => {
				// Map HouseholdCount to HouseholdListingStatisticsResponseDto
				this.statistics = {
					totalHouseholds: stats.totalHouseholds,
					totalMale: stats.totalMale,
					totalFemale: stats.totalFemale,
					totalPopulation: stats.totalPopulation,
					householdsWithPhone: 0, // Not available in HouseholdCount
					averageHouseholdSize: stats.averageHouseholdSize.toFixed(2),
				};
				this.loadingStatistics = false;
			},
			error: (error: any) => {
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
	 * Custom sort function for frontend sorting
	 */
	customSort(event: any) {
		// Sort the householdListings array
		this.householdListings.sort((data1: SurveyEnumerationAreaHouseholdListing, data2: SurveyEnumerationAreaHouseholdListing) => {
			let value1 = this.getFieldValue(data1, event.field);
			let value2 = this.getFieldValue(data2, event.field);
			let result = null;

			if (value1 == null && value2 != null) result = -1;
			else if (value1 != null && value2 == null) result = 1;
			else if (value1 == null && value2 == null) result = 0;
			else if (typeof value1 === 'string' && typeof value2 === 'string') {
				result = value1.localeCompare(value2);
			} else if (typeof value1 === 'number' && typeof value2 === 'number') {
				result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
			} else {
				// Convert to string for comparison
				const str1 = String(value1 || '');
				const str2 = String(value2 || '');
				result = str1.localeCompare(str2);
			}

			return (event.order * result);
		});
		
		// Update the array reference to trigger change detection
		this.householdListings = [...this.householdListings];
	}

	/**
	 * Get field value for sorting (handles nested fields like structure.structureNumber)
	 */
	private getFieldValue(data: SurveyEnumerationAreaHouseholdListing, field: string): any {
		if (field === 'structure.structureNumber') {
			return data.structure?.structureNumber || null;
		}
		// Handle other nested fields if needed
		const fields = field.split('.');
		let value: any = data;
		for (const f of fields) {
			value = value?.[f];
		}
		return value;
	}

	/**
	 * Handle dzongkhag filter change in dialog
	 */
	onDialogDzongkhagChange(): void {
		this.selectedDialogAdminZone = null;
		this.selectedDialogSubAdminZone = null;
		this.selectedEAForBulkUpload = null;
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
		this.selectedEAForBulkUpload = null;
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
		this.selectedEAForBulkUpload = null;
		this.dialogEnumerationAreaOptions = [];

		if (this.selectedDialogSubAdminZone) {
			// Map enumeration areas to include surveyEnumerationAreaId if available
			this.dialogEnumerationAreaOptions = (this.selectedDialogSubAdminZone.enumerationAreas ?? []).map((ea: any) => ({
				...ea,
				surveyEnumerationAreaId: ea.surveyEnumerationAreaId || (ea.surveyEnumerationAreas && ea.surveyEnumerationAreas.length > 0 ? ea.surveyEnumerationAreas[0].id : undefined)
			}));
		}
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
							if (!this.selectedEAForBulkUpload?.surveyEnumerationAreaId) {
								errors.push({
									row: i + 2,
									error: 'Enumeration area is not selected',
								});
								continue;
							}

							const dto: CreateSurveyEnumerationAreaHouseholdListingDto = {
								surveyEnumerationAreaId: this.selectedEAForBulkUpload.surveyEnumerationAreaId,
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
	 * Download household count CSV for selected dzongkhag
	 */
	downloadDzongkhagHouseholdCount(): void {
		if (!this.selectedDzongkhagFilter || !this.selectedDzongkhagFilter.id) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select a dzongkhag first',
			});
			return;
		}

		this.downloadingDzongkhagExport = true;
		this.householdService
			.exportHouseholdCountByDzongkhag(this.selectedDzongkhagFilter.id)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					const timestamp = new Date().toISOString().split('T')[0];
					link.download = `household_count_${this.selectedDzongkhagFilter?.name || 'dzongkhag'}_${timestamp}.csv`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					this.downloadingDzongkhagExport = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Household count CSV downloaded successfully',
						life: 3000,
					});
				},
				error: (error) => {
					this.downloadingDzongkhagExport = false;
					console.error('Error downloading dzongkhag household count:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to download household count CSV',
						life: 3000,
					});
				},
			});
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

		// Use supervisor service which accepts file upload directly
		this.householdService
			.bulkUploadHouseholds(this.selectedEAForBulkUpload.surveyEnumerationAreaId, this.bulkUploadFile)
			.subscribe({
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
							this.selectedEAForBulkUpload.surveyEnumerationAreaId &&
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
				error: (error: any) => {
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
	}
}
