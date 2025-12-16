import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../../primeng.modules';
 import { SamplingResultHouseholdDto, SamplingResultsResponseDto } from '../../../../core/dataservice/sampling/sampling.dto';
import { SurveyEnumerationAreaHouseholdListing } from '../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SamplingDataService } from '../../../../core/dataservice/sampling/sampling.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyEnumerationArea } from '../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';

@Component({
	selector: 'app-supervisor-survey-household-result-viewer',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './survey-listing-viewer.component.html',
	styleUrls: ['./survey-listing-viewer.component.scss'],
})
export class SurveyListingViewerComponent implements OnInit {
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
							this.selectedHouseholds
								.map((item) => item.household?.id)
								.filter((id): id is number => id !== undefined && id !== null)
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
	isHouseholdSelected(householdId: number | undefined | null): boolean {
		if (!householdId) {
			return false;
		}
		if (!this.selectedHouseholdIds || this.selectedHouseholdIds.size === 0) {
			return false;
		}
		// Ensure we're comparing numbers
		const id = typeof householdId === 'number' ? householdId : Number(householdId);
		return this.selectedHouseholdIds.has(id);
	}

	/**
	 * Get location hierarchy string
	 */
	getLocationHierarchy(): string {
		if (!this.enumerationArea?.enumerationArea) return 'N/A';
		const ea = this.enumerationArea.enumerationArea;
		// Use first SAZ if multiple exist
		const firstSaz = ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0
			? ea.subAdministrativeZones[0]
			: null;
		const parts: string[] = [];
		if (firstSaz?.administrativeZone?.dzongkhag?.name) {
			parts.push(firstSaz.administrativeZone.dzongkhag.name);
		}
		if (firstSaz?.administrativeZone?.name) {
			parts.push(firstSaz.administrativeZone.name);
		}
		if (firstSaz?.name) {
			parts.push(firstSaz.name);
		}
		return parts.length > 0 ? parts.join(' > ') : 'N/A';
	}

	/**
	 * Download all household listings as CSV
	 */
	downloadAllHouseholds(): void {
		if (!this.allHouseholdListings || this.allHouseholdListings.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No household listings to export',
			});
			return;
		}

		const headers = [
			'Serial Number',
			'Structure Number',
			'Latitude',
			'Longitude',
			'Household Serial Number',
			'Household Identification',
			'Head of Household',
			'Phone Number',
			'Total Male',
			'Total Female',
			'Total Population',
			'Remarks',
		];

		const csvData = this.allHouseholdListings.map((listing) => [
			listing.householdSerialNumber,
			listing.structure?.structureNumber || '',
			listing.structure?.latitude || '',
			listing.structure?.longitude || '',
			listing.householdIdentification,
			listing.nameOfHOH,
			listing.phoneNumber || '',
			listing.totalMale || 0,
			listing.totalFemale || 0,
			(listing.totalMale || 0) + (listing.totalFemale || 0),
			listing.remarks || '',
		]);

		let csvContent = headers.join(',') + '\n';
		csvData.forEach((row) => {
			csvContent += row.map((val) => `"${val}"`).join(',') + '\n';
		});

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		const areaCode = this.enumerationArea.enumerationArea?.areaCode || 'ea';
		link.href = url;
		link.download = `all_households_${areaCode}_${Date.now()}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: `All households exported successfully (${this.allHouseholdListings.length} records)`,
		});
	}

	/**
	 * Download sampled households as CSV
	 */
	downloadSampledHouseholds(): void {
		if (!this.currentResult || !this.selectedHouseholds.length) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No sampled households to export',
			});
			return;
		}

		const headers = [
			'Selection Order',
			'Structure Number',
			'Latitude',
			'Longitude',
			'Household Serial Number',
			'Household ID',
			'Head of Household',
			'Total Male',
			'Total Female',
			'Total Population',
			'Phone Number',
			'Remarks',
 		];

		const csvData = this.selectedHouseholds.map((item) => [
			item.selectionOrder,
			item.household.structure?.structureNumber || '',
			item.household.structure?.latitude || '',
			item.household.structure?.longitude || '',
			item.household.householdSerialNumber,
			item.household.householdIdentification,
			item.household.nameOfHOH || 'NA',
			item.household.phoneNumber || '',
			item.household.totalMale,
			item.household.totalFemale,
			item.household.totalMale + item.household.totalFemale,
			item.household.remarks || '',
 		]);

		let csvContent = headers.join(',') + '\n';
		csvData.forEach((row) => {
			csvContent += row.map((val) => `"${val}"`).join(',') + '\n';
		});

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		const areaCode = this.currentResult.enumerationArea.areaCode || 'ea';
		link.href = url;
		link.download = `sampled_households_${areaCode}_${Date.now()}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Success',
			detail: `Sampled households exported successfully (${this.selectedHouseholds.length} records)`,
		});
	}

	/**
	 * Close dialog
	 */
	closeDialog(): void {
		this.ref.close();
	}
}

