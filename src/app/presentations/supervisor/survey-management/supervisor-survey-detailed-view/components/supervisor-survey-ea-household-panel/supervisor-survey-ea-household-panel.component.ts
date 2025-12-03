import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import {
	SurveyEnumerationAreaHouseholdListing,
	HouseholdListingStatisticsResponseDto,
} from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SurveyEnumerationArea } from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';

@Component({
	selector: 'app-supervisor-survey-ea-household-panel',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './supervisor-survey-ea-household-panel.component.html',
	styleUrls: ['./supervisor-survey-ea-household-panel.component.scss'],
	providers: [MessageService],
})
export class SupervisorSurveyEaHouseholdPanelComponent implements OnInit {
	surveyEA!: SurveyEnumerationArea;
	surveyId!: number;

	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	statistics: HouseholdListingStatisticsResponseDto | null = null;
	loading = false;
	loadingStatistics = false;

	constructor(
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private messageService: MessageService,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig
	) {
		// Get data from dialog config
		if (this.config.data) {
			this.surveyEA = this.config.data.surveyEA;
			this.surveyId = this.config.data.surveyId;
		}
	}

	ngOnInit() {
		if (this.surveyEA?.id) {
			this.loadHouseholdListings();
			this.loadStatistics();
		}
	}

	loadHouseholdListings() {
		if (!this.surveyEA?.id) return;
		
		this.loading = true;
		this.householdService.getBySurveyEA(this.surveyEA.id).subscribe({
			next: (listings) => {
				this.householdListings = listings;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
					life: 3000,
				});
				this.loading = false;
			},
		});
	}

	loadStatistics() {
		if (!this.surveyEA?.id) return;
		
		this.loadingStatistics = true;
		this.householdService.getStatisticsByEnumerationArea(this.surveyEA.id).subscribe({
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

	getTotalPopulation(listing: SurveyEnumerationAreaHouseholdListing): number {
		return (listing.totalMale || 0) + (listing.totalFemale || 0);
	}

	getLocationHierarchy(): string {
		if (!this.surveyEA?.enumerationArea) return 'N/A';
		const ea = this.surveyEA.enumerationArea;
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

	closePanel() {
		this.ref.close();
	}
}

