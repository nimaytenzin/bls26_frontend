import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { SurveyEnumerationAreaStructureDataService } from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dataservice';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { SurveyEnumerationAreaHouseholdListing } from '../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SurveyEnumerationAreaStructure } from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dto';

@Component({
	selector: 'app-household-by-structure',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './household-by-structure.component.html',
	styleUrls: ['./household-by-structure.component.scss'],
})
export class HouseholdByStructureComponent implements OnInit {
	structureId!: number;
	structure: SurveyEnumerationAreaStructure | null = null;
	householdListings: SurveyEnumerationAreaHouseholdListing[] = [];
	loading = true;

	constructor(
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig,
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private structureService: SurveyEnumerationAreaStructureDataService,
		private messageService: MessageService
	) {
		// Get structureId from dialog config
		this.structureId = this.config.data?.structureId;
	}

	ngOnInit(): void {
		if (this.structureId) {
			this.loadStructure();
			this.loadHouseholdListings();
		} else {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Structure ID is required',
			});
			this.ref.close();
		}
	}

	/**
	 * Load structure details
	 */
	loadStructure(): void {
		this.structureService.findOne(this.structureId).subscribe({
			next: (structure) => {
				this.structure = structure;
			},
			error: (error) => {
				console.error('Error loading structure:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load structure details',
				});
			},
		});
	}

	/**
	 * Load household listings for structure
	 */
	loadHouseholdListings(): void {
		this.loading = true;
		this.householdService.findByStructure(this.structureId).subscribe({
			next: (listings) => {
				this.householdListings = listings;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
				});
			},
		});
	}


	/**
	 * Track by household ID
	 */
	trackByHouseholdId(index: number, household: SurveyEnumerationAreaHouseholdListing): number {
		return household.id;
	}
}

