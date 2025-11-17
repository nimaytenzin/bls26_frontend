import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../../../primeng.modules';

@Component({
	selector: 'app-supervisor-survey-household-listings',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './supervisor-survey-household-listings.component.html',
	styleUrls: ['./supervisor-survey-household-listings.component.css'],
})
export class SupervisorSurveyHouseholdListingsComponent implements OnInit {
	@Input() surveyId!: number;

	// Hierarchy data
	hierarchyData: any = null;

	// Dropdown options
	dzongkhags: any[] = [];
	administrativeZones: any[] = [];
	subAdministrativeZones: any[] = [];
	enumerationAreaOptions: any[] = [];

	// Selected values
	selectedDzongkhag: any = null;
	selectedAdminZone: any = null;
	selectedSubAdminZone: any = null;
	selectedEA: any = null;

	// Household listings
	householdListings: any[] = [];
	loadingHouseholds = false;

	// Household statistics
	totalHouseholds = 0;
	totalPopulation = 0;
	dataCompletenessPercentage = 0;

	constructor(
		private surveyService: SurveyDataService,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadHierarchy();
		}
	}

	/**
	 * Load survey enumeration hierarchy
	 */
	loadHierarchy() {
		this.surveyService.getSurveyEnumerationHierarchy(this.surveyId).subscribe({
			next: (data: any) => {
				this.hierarchyData = data;
				console.log('Hierarchy Data:', data);
				this.dzongkhags = data.hierarchy || [];
			},
			error: (error: any) => {
				console.error('Error loading hierarchy:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load location hierarchy',
				});
			},
		});
	}

	/**
	 * Handle Dzongkhag selection change
	 */
	onDzongkhagChange() {
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.selectedEA = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.enumerationAreaOptions = [];
		this.householdListings = [];

		if (this.selectedDzongkhag) {
			this.administrativeZones =
				this.selectedDzongkhag.administrativeZones || [];
		}
	}

	/**
	 * Handle Administrative Zone selection change
	 */
	onAdminZoneChange() {
		this.selectedSubAdminZone = null;
		this.selectedEA = null;
		this.subAdministrativeZones = [];
		this.enumerationAreaOptions = [];
		this.householdListings = [];

		if (this.selectedAdminZone) {
			this.subAdministrativeZones =
				this.selectedAdminZone.subAdministrativeZones || [];
		}
	}

	/**
	 * Handle Sub Administrative Zone selection change
	 */
	onSubAdminZoneChange() {
		this.selectedEA = null;
		this.enumerationAreaOptions = [];
		this.householdListings = [];

		if (this.selectedSubAdminZone) {
			this.enumerationAreaOptions =
				this.selectedSubAdminZone.enumerationAreas || [];
		}
	}

	/**
	 * Handle EA selection change
	 */
	onEAChange() {
		this.householdListings = [];
		if (this.selectedEA) {
			this.loadHouseholdListings();
		}
	}

	/**
	 * Load household listings for selected EA
	 */
	loadHouseholdListings() {
		if (!this.selectedEA?.surveyEnumerationAreaId) return;

		this.loadingHouseholds = true;
		this.householdService
			.getBySurveyEA(this.selectedEA.surveyEnumerationAreaId)
			.subscribe({
				next: (data: any[]) => {
					this.calculateStatistics();
					this.loadingHouseholds = false;
				},
				error: (error: any) => {
					console.error('Error loading household listings:', error);
					this.loadingHouseholds = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load household listings',
					});
				},
			});
	}

	/**
	 * Calculate household statistics
	 */
	calculateStatistics() {
		this.totalHouseholds = this.householdListings.length;
		this.totalPopulation = this.householdListings.reduce(
			(sum, h) => sum + (h.totalMale || 0) + (h.totalFemale || 0),
			0
		);

		// Calculate data completeness
		if (this.totalHouseholds > 0) {
			const completeHouseholds = this.householdListings.filter(
				(h) =>
					h.householdIdentification &&
					h.structureNumber &&
					h.nameOfHOH &&
					(h.totalMale !== null || h.totalFemale !== null)
			).length;

			this.dataCompletenessPercentage = Math.round(
				(completeHouseholds / this.totalHouseholds) * 100
			);
		} else {
			this.dataCompletenessPercentage = 0;
		}
	}

	/**
	 * Format date for display
	 */
	formatDate(date: string | Date | undefined): string {
		if (!date) return '-';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Format time for display
	 */
	formatTime(date: string | Date | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	/**
	 * Get the latest update date from household listings
	 */
	getLatestUpdate(): Date | undefined {
		if (this.householdListings.length === 0) return undefined;

		const dates = this.householdListings
			.map((h) => h.updatedAt || h.createdAt)
			.filter((d) => d)
			.map((d) => new Date(d));

		return dates.length > 0
			? new Date(Math.max(...dates.map((d) => d.getTime())))
			: undefined;
	}
}
