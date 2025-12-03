import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SamplingDataService } from '../../../../../../core/dataservice/sampling/sampling.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import {
	SamplingResultsResponseDto,
	SamplingResultHouseholdDto,
} from '../../../../../../core/dataservice/sampling/sampling.dto';
import { SurveyEnumerationArea } from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { SurveyEnumerationAreaHouseholdListing } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';

@Component({
	selector: 'app-supervisor-survey-sampling-results-view',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './supervisor-survey-sampling-results-view.component.html',
	styleUrls: ['./supervisor-survey-sampling-results-view.component.scss'],
})
export class SupervisorSurveySamplingResultsViewComponent implements OnInit {
	surveyId!: number;
	enumerationArea!: SurveyEnumerationArea;

	resultLoading = false;
	currentResult: SamplingResultsResponseDto['data'] | null = null;
	selectedHouseholds: SamplingResultHouseholdDto[] = [];
	allHouseholdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	loadingAllHouseholds = false;
	selectedHouseholdIds: Set<number> = new Set();

	constructor(
		private samplingService: SamplingDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig
	) {
		// Get data from dialog config
		if (this.config.data) {
			this.surveyId = this.config.data.surveyId;
			this.enumerationArea = this.config.data.enumerationArea;
		}
	}

	ngOnInit(): void {
		if (this.surveyId && this.enumerationArea?.id) {
			this.loadSamplingResults();
		}
	}

	/**
	 * Load sampling results and household listings
	 */
	loadSamplingResults(): void {
		this.resultLoading = true;
		this.currentResult = null;
		this.selectedHouseholds = [];
		this.allHouseholdListings = [];
		this.selectedHouseholdIds.clear();

		// Load sampling results
		this.samplingService
			.getSamplingResults(this.surveyId, this.enumerationArea.id)
			.subscribe({
				next: (response: SamplingResultsResponseDto) => {
					if (response.success && response.data) {
						this.currentResult = response.data;
						this.selectedHouseholds = response.data.selectedHouseholds;
						// Store selected household IDs for highlighting
						this.selectedHouseholdIds = new Set(
							this.selectedHouseholds.map((item) => item.household.id)
						);
					}
					// Load all household listings regardless of sampling results
					this.loadAllHouseholdListings();
				},
				error: (error: any) => {
					console.error('Error loading sampling results:', error);
					// Still load all household listings even if sampling fails
					this.loadAllHouseholdListings();
					if (error?.status !== 404) {
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: error?.error?.message || 'Failed to load sampling results',
						});
					}
				},
			});
	}

	/**
	 * Load all household listings for the enumeration area
	 */
	loadAllHouseholdListings(): void {
		this.loadingAllHouseholds = true;
		this.householdService.getBySurveyEA(this.enumerationArea.id).subscribe({
			next: (listings: SurveyEnumerationAreaHouseholdListing[]) => {
				this.allHouseholdListings = listings.sort(
					(a, b) => (a.householdSerialNumber || 0) - (b.householdSerialNumber || 0)
				);
				this.loadingAllHouseholds = false;
				this.resultLoading = false;
			},
			error: (error: any) => {
				console.error('Error loading household listings:', error);
				this.loadingAllHouseholds = false;
				this.resultLoading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
				});
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
	 * Get location hierarchy string
	 */
	getLocationHierarchy(): string {
		if (!this.enumerationArea?.enumerationArea) return 'N/A';
		const ea = this.enumerationArea.enumerationArea;
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

	/**
	 * Download sampling result as CSV
	 */
	downloadSamplingResult(): void {
		if (!this.currentResult || !this.selectedHouseholds.length) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No sampling results to export',
			});
			return;
		}

		const headers = [
			'Selection Order',
			'Structure Number',
			'Household ID',
			'Serial Number',
			'Head of Household',
			'Total Male',
			'Total Female',
			'Total Population',
			'Phone Number',
			'Remarks',
			'Is Replacement',
		];

		const csvData = this.selectedHouseholds.map((item) => [
			item.selectionOrder,
			item.household.structureNumber,
			item.household.householdIdentification,
			item.household.householdSerialNumber,
			item.household.nameOfHOH,
			item.household.totalMale,
			item.household.totalFemale,
			item.household.totalPopulation,
			item.household.phoneNumber || '',
			item.household.remarks || '',
			item.isReplacement ? 'Yes' : 'No',
		]);

		let csvContent = headers.join(',') + '\n';
		csvData.forEach((row) => {
			csvContent += row.map((val) => `"${val}"`).join(',') + '\n';
		});

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `sampling_results_${this.currentResult.enumerationArea.areaCode || 'ea'}_${Date.now()}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Sampling results exported successfully',
		});
	}

	/**
	 * Close dialog
	 */
	closeDialog(): void {
		this.ref.close();
	}
}

