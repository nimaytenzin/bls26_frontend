import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import { SurveyEnumerationAreaStructureDataService } from '../../../core/dataservice/survey-enumeration-area-structure/survey-enumeration-area-structure.dataservice';
import { EnumeratorMapStateService } from '../../../core/utility/enumerator-map-state.service';
import {
	HouseholdListing,
	CreateHouseholdListingDto,
	UpdateHouseholdListingDto,
} from '../../../core/dataservice/household-listing/household-listing.interface';
import {
	CreateSurveyEnumerationAreaHouseholdListingDto,
} from '../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-household-listing-form',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ProgressSpinnerModule,
		InputTextModule,
		InputNumberModule,
		ToastModule,
		ButtonModule,
	],
	providers: [MessageService],
	templateUrl: './household-listing-form.component.html',
	styleUrls: ['./household-listing-form.component.scss'],
})
export class HouseholdListingFormComponent implements OnInit {
	surveyEnumerationAreaId!: number;
	householdId?: number;
	structureId?: number;
	isEditMode = false;
	loading = false;
	submitting = false;

	householdForm: CreateHouseholdListingDto = {
		surveyEnumerationAreaId: 0,
		structureNumber: '',
		householdIdentification: '',
		householdSerialNumber: 1,
		nameOfHOH: '',
		totalMale: 0,
		totalFemale: 0,
		phoneNumber: '',
		remarks: '',
	};
	
	// Store structureNumber separately for display (read-only)
	structureNumberDisplay: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private location: Location,
		private enumeratorService: EnumeratorDataService,
		private structureService: SurveyEnumerationAreaStructureDataService,
		private messageService: MessageService,
		private mapStateService: EnumeratorMapStateService
	) {}

	ngOnInit(): void {
		// Subscribe to route params
		this.route.params.subscribe((params) => {
			this.surveyEnumerationAreaId = +params['surveyEnumerationAreaId'];
			this.householdId = params['householdId']
				? +params['householdId']
				: undefined;

			this.householdForm.surveyEnumerationAreaId = this.surveyEnumerationAreaId;

			if (this.householdId) {
				this.isEditMode = true;
				this.loadHouseholdDetails();
			} else {
				this.loadNextSerialNumber();
			}
		});

		// Load structureId from service if available
		const savedStructureId = this.mapStateService.getSelectedStructure(this.surveyEnumerationAreaId);
		if (savedStructureId) {
			this.structureId = savedStructureId;
			this.loadStructureDetails();
		}
	}

	/**
	 * Load household details for editing
	 */
	loadHouseholdDetails(): void {
		if (!this.householdId) return;

		this.loading = true;

		// Get all households for this SEA to find the one we need
		this.enumeratorService
			.getHouseholdListings(this.surveyEnumerationAreaId)
			.subscribe({
				next: (households: any[]) => {
					const household = households.find((h) => h.id === this.householdId);

					if (household) {
						// Store structureId if available (for updates) - check multiple possible locations
						if (household.structureId) {
							this.structureId = household.structureId;
						} else if (household.structure?.id) {
							this.structureId = household.structure.id;
						}
						
						this.householdForm = {
							surveyEnumerationAreaId: household.surveyEnumerationAreaId,
							structureNumber: household.structureNumber || household.structure?.structureNumber || '',
							householdIdentification: household.householdIdentification,
							householdSerialNumber: household.householdSerialNumber,
							nameOfHOH: household.nameOfHOH,
							totalMale: household.totalMale,
							totalFemale: household.totalFemale,
							phoneNumber: household.phoneNumber || '',
							remarks: household.remarks || '',
						};
						
						// Set structureNumber display
						this.structureNumberDisplay = this.householdForm.structureNumber;
					} else {
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Household not found',
						});
						this.goBack();
					}

					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading household:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load household details',
					});
					this.loading = false;
					this.goBack();
				},
			});
	}

	/**
	 * Load next serial number for new household
	 */
	loadNextSerialNumber(): void {
		this.loading = true;

		this.enumeratorService
			.getHouseholdListings(this.surveyEnumerationAreaId)
			.subscribe({
				next: (households: HouseholdListing[]) => {
					if (households.length > 0) {
						const maxSerial = Math.max(
							...households.map((h) => h.householdSerialNumber)
						);
						this.householdForm.householdSerialNumber = maxSerial + 1;
					} else {
						this.householdForm.householdSerialNumber = 1;
					}
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading households:', error);
					this.loading = false;
					// Default to 1 if error
					this.householdForm.householdSerialNumber = 1;
				},
			});
	}

	/**
	 * Submit form (create or update)
	 */
	submitForm(): void {
		// Validate form
		if (!this.isFormValid()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please fill all required fields',
			});
			return;
		}

		// Prevent double submission
		if (this.submitting) return;

		this.submitting = true;

		if (this.isEditMode && this.householdId) {
			// Update existing household - ensure structureId is preserved
			this.resolveStructureId().then((resolvedStructureId) => {
				const updateDto: any = {
					structureNumber: this.householdForm.structureNumber,
					householdIdentification: this.householdForm.householdIdentification,
					householdSerialNumber: this.householdForm.householdSerialNumber,
					nameOfHOH: this.householdForm.nameOfHOH,
					totalMale: this.householdForm.totalMale,
					totalFemale: this.householdForm.totalFemale,
					phoneNumber: this.householdForm.phoneNumber,
					remarks: this.householdForm.remarks,
				};
				
				// Include structureId if available (to prevent it from becoming null)
				if (resolvedStructureId) {
					updateDto.structureId = resolvedStructureId;
				}

				this.enumeratorService
					.updateHouseholdListing(this.householdId!, updateDto)
					.subscribe({
					next: () => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household updated successfully. You can continue editing.',
						});
						this.submitting = false;
						// Don't navigate away - allow continued editing
					},
					error: (error: any) => {
						console.error('Error updating household:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail:
								error.error?.message || 'Failed to update household listing',
						});
						this.submitting = false;
					},
					});
			});
		} else {
			// Create new household - need to include structureId
			// Try to get structureId if not already set
			this.resolveStructureId().then((resolvedStructureId) => {
				if (!resolvedStructureId) {
					this.messageService.add({
						severity: 'warn',
						summary: 'Validation Error',
						detail: 'Structure ID is required. Please select a structure from the map or ensure structure number is valid.',
					});
					this.submitting = false;
					return;
				}

				// Build DTO with structureId
				const createDto: CreateSurveyEnumerationAreaHouseholdListingDto = {
					surveyEnumerationAreaId: this.householdForm.surveyEnumerationAreaId,
					structureId: resolvedStructureId,
					householdIdentification: this.householdForm.householdIdentification,
					householdSerialNumber: this.householdForm.householdSerialNumber,
					nameOfHOH: this.householdForm.nameOfHOH,
					totalMale: this.householdForm.totalMale || 0,
					totalFemale: this.householdForm.totalFemale || 0,
					phoneNumber: this.householdForm.phoneNumber || undefined,
					remarks: this.householdForm.remarks || undefined,
				};

				this.enumeratorService
					.createHouseholdListing(createDto)
					.subscribe({
						next: (createdHousehold) => {
							// Update to edit mode after creation
							if (createdHousehold && createdHousehold.id) {
								this.householdId = createdHousehold.id;
								this.isEditMode = true;
							}
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: 'Household created successfully. You can continue editing.',
							});
							this.submitting = false;
							// Don't navigate away - allow continued editing
						},
						error: (error: any) => {
							console.error('Error creating household:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail:
									error.error?.message || 'Failed to create household listing',
							});
							this.submitting = false;
						},
					});
			});
		}
	}

	/**
	 * Resolve structure ID from available sources
	 * Returns structureId if already set, or tries to find it from structureNumber
	 */
	private resolveStructureId(): Promise<number | null> {
		// If structureId is already available, return it
		if (this.structureId) {
			return Promise.resolve(this.structureId);
		}

		// If structureNumber is provided, try to find structure by number
		if (this.householdForm.structureNumber) {
			return new Promise((resolve) => {
				// Load all structures for this survey enumeration area
				this.structureService.getBySurveyEA(this.surveyEnumerationAreaId).subscribe({
					next: (structures) => {
						const structure = structures.find(
							(s) => s.structureNumber === this.householdForm.structureNumber
						);
						if (structure) {
							this.structureId = structure.id;
							resolve(structure.id);
						} else {
							resolve(null);
						}
					},
					error: () => {
						resolve(null);
					},
				});
			});
		}

		// No structureId and no structureNumber
		return Promise.resolve(null);
	}

	/**
	 * Calculate total population
	 */
	getTotalPopulation(): number {
		return (
			(this.householdForm.totalMale || 0) +
			(this.householdForm.totalFemale || 0)
		);
	}

	/**
	 * Check if form is valid
	 */
	isFormValid(): boolean {
		return !!(
			this.householdForm.structureNumber &&
			this.householdForm.householdIdentification &&
			this.householdForm.householdSerialNumber
		);
	}

	/**
	 * Load structure details to get structure number
	 */
	loadStructureDetails(): void {
		if (!this.structureId) return;

		this.structureService.findOne(this.structureId).subscribe({
			next: (structure) => {
				this.householdForm.structureNumber = structure.structureNumber;
				this.structureNumberDisplay = structure.structureNumber;
			},
			error: (error) => {
				console.error('Error loading structure:', error);
				this.messageService.add({
					severity: 'warn',
					summary: 'Warning',
					detail: 'Could not load structure details. Please enter structure number manually.',
				});
			},
		});
	}

	/**
	 * Navigate back to previous page
	 */
	goBack(): void {
		// Use browser back - map state is already persisted in service
		this.location.back();
	}
}
