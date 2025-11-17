import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import {
	CurrentHouseholdListingResponseDto,
	CurrentHouseholdListingStatus,
	SurveyEnumerationAreaHouseholdListing,
	HouseholdStatisticsDto,
} from '../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { MessageService } from 'primeng/api';
import { GenerateFullEACode } from '../../../../../core/utility/utility.service';

@Component({
	selector: 'app-current-household-listing',
	templateUrl: './current-household-listing.component.html',
	styleUrls: ['./current-household-listing.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class CurrentHouseholdListingComponent implements OnInit, OnChanges {
	@Input() enumerationAreaId: number | null = null;

	response: CurrentHouseholdListingResponseDto | null = null;
	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	statistics: HouseholdStatisticsDto | null = null;
	loading = false;
	errorMessage: string | null = null;

	getFulllEACode = GenerateFullEACode;

	// Status enum for template usage
	readonly Status = CurrentHouseholdListingStatus;

	constructor(
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService,
		private router: Router
	) {}

	ngOnInit(): void {
		if (this.enumerationAreaId) {
			this.loadCurrentHouseholdListings();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['enumerationAreaId'] && this.enumerationAreaId) {
			this.loadCurrentHouseholdListings();
		}
	}

	/**
	 * Load current household listings for the enumeration area
	 */
	loadCurrentHouseholdListings(): void {
		if (!this.enumerationAreaId) return;

		this.loading = true;
		this.errorMessage = null;

		this.householdService
			.getCurrentHouseholdListings(this.enumerationAreaId)
			.subscribe({
				next: (response) => {
					this.response = response;
					this.loading = false;

					switch (response.status) {
						case CurrentHouseholdListingStatus.SUCCESS:
							console.log('Household listings loaded successfully', response);
							this.householdListings = response.data?.householdListings || [];
							this.statistics = response.data?.statistics || null;
							console.log('Households loaded:', this.householdListings.length);
							console.log('Statistics:', this.statistics);
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: `Loaded ${this.householdListings.length} households from ${response.data?.survey.name} (${response.data?.survey.year})`,
							});
							break;

						case CurrentHouseholdListingStatus.NO_DATA:
							console.log('No validated data available:', response.message);
							this.householdListings = [];
							this.statistics = null;
							this.messageService.add({
								severity: 'info',
								summary: 'No Data',
								detail: response.message,
								life: 5000,
							});
							break;

						case CurrentHouseholdListingStatus.VALIDATED_BUT_EMPTY:
							console.log('Validated but no households:', response.message);
							this.householdListings = [];
							this.statistics = response.data?.statistics || null;
							this.messageService.add({
								severity: 'warn',
								summary: 'Empty Dataset',
								detail: response.message,
							});
							break;
					}
				},
				error: (error) => {
					this.loading = false;
					this.errorMessage = error.message;
					console.error('Failed to load household listings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load current household listings',
					});
				},
			});
	}

	/**
	 * Get display message based on response status
	 */
	getDisplayMessage(): string {
		if (!this.response) return '';

		switch (this.response.status) {
			case CurrentHouseholdListingStatus.SUCCESS:
				return `Found ${this.householdListings.length} households from ${this.response.data?.survey.name} (${this.response.data?.survey.year})`;

			case CurrentHouseholdListingStatus.NO_DATA:
				if (this.response.metadata?.latestSurvey) {
					const latest = this.response.metadata.latestSurvey;
					return `Latest survey: ${latest.surveyName} (${latest.surveyYear}) - ${latest.reason}`;
				}
				return this.response.message;

			case CurrentHouseholdListingStatus.VALIDATED_BUT_EMPTY:
				return `Survey ${this.response.data?.survey.name} has been validated but contains no household data`;

			default:
				return this.response.message;
		}
	}

	/**
	 * Get survey information if available
	 */
	getSurveyInfo(): string {
		if (this.response?.data?.survey) {
			return `${this.response.data.survey.name} (${this.response.data.survey.year})`;
		}
		return '';
	}

	/**
	 * Check if data has been submitted
	 */
	isSubmitted(): boolean {
		return this.response?.data?.surveyEnumerationArea?.isSubmitted ?? false;
	}

	/**
	 * Get submitter name
	 */
	getSubmitterName(): string {
		console.log(
			'Submitter info:',
			this.response?.data?.surveyEnumerationArea?.submitter
		);
		return this.response?.data?.surveyEnumerationArea?.submitter?.name || 'N/A';
	}

	/**
	 * Get submitter phone number
	 */
	getSubmitterPhone(): string {
		return (
			this.response?.data?.surveyEnumerationArea?.submitter?.phoneNumber ||
			'N/A'
		);
	}

	/**
	 * Navigate to survey details page
	 */
	navigateToSurvey(): void {
		const surveyId = this.response?.data?.survey?.id;
		if (surveyId) {
			this.router.navigate(['/admin/survey/details', surveyId]);
		}
	}

	/**
	 * Get submission date
	 */
	getSubmissionDate(): Date | string | null {
		return this.response?.data?.surveyEnumerationArea?.submissionDate || null;
	}

	/**
	 * Check if data has been validated
	 */
	isValidated(): boolean {
		return this.response?.data?.surveyEnumerationArea?.isValidated ?? false;
	}

	/**
	 * Get validator name
	 */
	getValidatorName(): string {
		return this.response?.data?.surveyEnumerationArea?.validator?.name || 'N/A';
	}

	/**
	 * Get validator phone number
	 */
	getValidatorPhone(): string {
		return (
			this.response?.data?.surveyEnumerationArea?.validator?.phoneNumber ||
			'N/A'
		);
	}

	/**
	 * Get validation date
	 */
	getValidationDate(): Date | string | null {
		return this.response?.data?.surveyEnumerationArea?.validationDate || null;
	}

	/**
	 * Download household listings as CSV
	 */
	downloadCSV(): void {
		if (!this.householdListings || this.householdListings.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No household listings available to download',
			});
			return;
		}

		// CSV Headers
		const headers = [
			'Serial Number',
			'Structure Number',
			'Household ID',
			'Head of Household',
			'Phone Number',
			'Male',
			'Female',
			'Total Population',
			'Remarks',
			'Submitted By',
			'Submitter Phone',
			'Submission Date',
		];

		// Convert data to CSV rows
		const rows = this.householdListings.map((hh) => [
			hh.householdSerialNumber || '',
			hh.structureNumber || '',
			hh.householdIdentification || '',
			hh.nameOfHOH || '',
			hh.phoneNumber || '',
			hh.totalMale || 0,
			hh.totalFemale || 0,
			(hh.totalMale || 0) + (hh.totalFemale || 0),
			hh.remarks || '',
			this.getSubmitterName(),
			this.getSubmitterPhone(),
			this.getSubmissionDate()
				? new Date(this.getSubmissionDate()!).toLocaleDateString()
				: '',
		]);

		// Combine headers and rows
		const csvContent = [
			headers.join(','),
			...rows.map((row) =>
				row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
			),
		].join('\n');

		// Create blob and download
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);

		const fileName = `household_listings_${this.response?.data?.survey.name}_${
			this.response?.data?.survey.year
		}_${new Date().toISOString().split('T')[0]}.csv`;

		link.setAttribute('href', url);
		link.setAttribute('download', fileName);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		this.messageService.add({
			severity: 'success',
			summary: 'Downloaded',
			detail: 'Household listings CSV downloaded successfully',
		});
	}
}
