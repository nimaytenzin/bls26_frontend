import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import {
	Survey,
	AutoHouseholdUploadRequestDto,
	AutoHouseholdUploadItemDto,
} from '../../../../core/dataservice/survey/survey.dto';
import { AdministrativeZone, AdministrativeZoneType } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';

interface HouseholdDataRow {
	gewogId: number;
	gewogName: string;
	gewogAreaCode: string;
	chiwogId: number;
	chiwogName: string;
	chiwogAreaCode: string;
	eaId: number;
	eaName: string;
	eaAreaCode: string;
	fullAreaCode: string;
	surveyData: { [surveyId: number]: number | null }; // surveyId -> household count
}

@Component({
	selector: 'app-admin-auto-household-data-upload-by-dzongkhag',
	templateUrl: './admin-auto-household-data-upload-by-dzongkhag.component.html',
	styleUrls: ['./admin-auto-household-data-upload-by-dzongkhag.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminAutoHouseholdDataUploadByDzongkhagComponent implements OnInit {
	// Dzongkhag selection
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	loadingDzongkhags = false;

	// Tab control
	activeTab: 'rural' | 'urban' = 'rural';

	// Surveys
	surveys: Survey[] = [];
	loadingSurveys = false;

	// Table data
	ruralTableData: HouseholdDataRow[] = [];
	urbanTableData: HouseholdDataRow[] = [];
	loadingTableData = false;

	// Hierarchical data from API
	hierarchicalData: any = null;

	// Save state
	saving = false;

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private surveyService: SurveyDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		this.loadDzongkhags();
		this.loadSurveys();
	}

	loadDzongkhags(): void {
		this.loadingDzongkhags = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loadingDzongkhags = false;
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				this.loadingDzongkhags = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	loadSurveys(): void {
		this.loadingSurveys = true;
		this.surveyService.findAllSurveysPaginated({ page: 1, limit: 1000 }).subscribe({
			next: (response) => {
				this.surveys = response.data;
				this.loadingSurveys = false;
			},
			error: (error: any) => {
				console.error('Error loading surveys:', error);
				this.loadingSurveys = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load surveys',
					life: 3000,
				});
			},
		});
	}

	onDzongkhagChange(): void {
		if (this.selectedDzongkhag) {
			this.loadEnumerationAreas();
		} else {
			this.ruralTableData = [];
			this.urbanTableData = [];
		}
	}

	loadEnumerationAreas(): void {
		if (!this.selectedDzongkhag) return;

		this.loadingTableData = true;
		this.dzongkhagService
			.getEnumerationAreasByDzongkhag(
				this.selectedDzongkhag.id,
				false,
				true
			)
			.subscribe({
				next: (data) => {
					this.hierarchicalData = data;
					this.buildTableData();
					this.loadingTableData = false;
				},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					this.loadingTableData = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	buildTableData(): void {
		if (!this.hierarchicalData || !this.hierarchicalData.administrativeZones) {
			this.ruralTableData = [];
			this.urbanTableData = [];
			return;
		}

		const ruralRows: HouseholdDataRow[] = [];
		const urbanRows: HouseholdDataRow[] = [];

		// Process each administrative zone
		for (const adminZone of this.hierarchicalData.administrativeZones) {
			const isRural = adminZone.type === AdministrativeZoneType.Gewog;
			const targetRows = isRural ? ruralRows : urbanRows;

			// Process each sub-administrative zone (chiwog/lap)
			for (const subAdminZone of adminZone.subAdministrativeZones || []) {
				// Process each enumeration area
				for (const ea of subAdminZone.enumerationAreas || []) {
					// Initialize survey data object
					const surveyData: { [surveyId: number]: number | null } = {};
					for (const survey of this.surveys) {
						surveyData[survey.id] = null;
					}

					const row: HouseholdDataRow = {
						gewogId: adminZone.id,
						gewogName: adminZone.name,
						gewogAreaCode: adminZone.areaCode || '',
						chiwogId: subAdminZone.id,
						chiwogName: subAdminZone.name,
						chiwogAreaCode: subAdminZone.areaCode || '',
						eaId: ea.id,
						eaName: ea.name,
						eaAreaCode: ea.areaCode || '',
						fullAreaCode: this.buildFullAreaCode(
							this.hierarchicalData.areaCode,
							adminZone.areaCode,
							subAdminZone.areaCode,
							ea.areaCode
						),
						surveyData: surveyData,
					};

					targetRows.push(row);
				}
			}
		}

		// Sort by area code (ascending)
		ruralRows.sort((a, b) => a.fullAreaCode.localeCompare(b.fullAreaCode));
		urbanRows.sort((a, b) => a.fullAreaCode.localeCompare(b.fullAreaCode));

		this.ruralTableData = ruralRows;
		this.urbanTableData = urbanRows;
	}

	buildFullAreaCode(
		dzongkhagCode: string,
		gewogCode: string,
		chiwogCode: string,
		eaCode: string
	): string {
		return [dzongkhagCode, gewogCode, chiwogCode, eaCode]
			.filter((code) => code)
			.join('');
	}

	onTabChange(tab: 'rural' | 'urban'): void {
		this.activeTab = tab;
	}

	onHouseholdDataChange(
		row: HouseholdDataRow,
		surveyId: number,
		value: string
	): void {
		const numValue = value === '' ? null : parseInt(value, 10);
		if (numValue !== null && isNaN(numValue)) {
			return; // Invalid number, don't update
		}
		row.surveyData[surveyId] = numValue;
	}

	getHouseholdDataValue(row: HouseholdDataRow, surveyId: number): string {
		const value = row.surveyData[surveyId];
		return value === null || value === undefined ? '' : value.toString();
	}

	saveData(): void {
		if (!this.selectedDzongkhag) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select a dzongkhag first',
				life: 3000,
			});
			return;
		}

		// Collect all items from both rural and urban tables
		const items: AutoHouseholdUploadItemDto[] = [];

		// Process rural table data
		for (const row of this.ruralTableData) {
			for (const survey of this.surveys) {
				const householdCount = row.surveyData[survey.id];
				if (householdCount !== null && householdCount !== undefined && householdCount > 0) {
					items.push({
						enumerationAreaId: row.eaId,
						surveyId: survey.id,
						householdCount: householdCount,
					});
				}
			}
		}

		// Process urban table data
		for (const row of this.urbanTableData) {
			for (const survey of this.surveys) {
				const householdCount = row.surveyData[survey.id];
				if (householdCount !== null && householdCount !== undefined && householdCount > 0) {
					items.push({
						enumerationAreaId: row.eaId,
						surveyId: survey.id,
						householdCount: householdCount,
					});
				}
			}
		}

		// Validate that we have items to upload
		if (items.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'No household data to upload. Please enter household counts for at least one enumeration area and survey combination.',
				life: 4000,
			});
			return;
		}

		// Prepare request
		const request: AutoHouseholdUploadRequestDto = { items };

		// Show confirmation dialog
		const totalItems = items.length;
		const totalHouseholds = items.reduce((sum, item) => sum + item.householdCount, 0);

		// Proceed with upload
		this.saving = true;
		this.surveyService.autoHouseholdUpload(request).subscribe({
			next: (response) => {
				this.saving = false;

				// Build success message
				const hasErrors = response.errors && response.errors.length > 0;
				let message = `Successfully processed ${response.totalItems} item(s). `;
				message += `Created ${response.created} SurveyEnumerationArea record(s) and ${response.householdListingsCreated} household listing(s).`;
				
				if (response.skipped > 0) {
					message += ` Skipped ${response.skipped} item(s) with zero counts.`;
				}

				if (hasErrors) {
					message += ` ${response.errors.length} error(s) encountered.`;
					console.warn('Upload completed with errors:', response.errors);
					
					// Show detailed error message
					const errorDetails = response.errors
						.map(
							(err) =>
								`EA ${err.enumerationAreaId}, Survey ${err.surveyId}: ${err.reason}`
						)
						.join('; ');
					
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Errors',
						detail: errorDetails,
						life: 8000,
					});
				}

				this.messageService.add({
					severity: hasErrors ? 'warn' : 'success',
					summary: hasErrors ? 'Partial Success' : 'Success',
					detail: message,
					life: 6000,
				});
			},
			error: (error) => {
				this.saving = false;
				console.error('Error uploading household data:', error);

				let errorMessage = 'Failed to upload household data.';
				if (error.error?.message) {
					if (Array.isArray(error.error.message)) {
						errorMessage = error.error.message.join('\n');
					} else {
						errorMessage = error.error.message;
					}
				} else if (error.message) {
					errorMessage = error.message;
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

	getCurrentTableData(): HouseholdDataRow[] {
		return this.activeTab === 'rural' ? this.ruralTableData : this.urbanTableData;
	}
}

