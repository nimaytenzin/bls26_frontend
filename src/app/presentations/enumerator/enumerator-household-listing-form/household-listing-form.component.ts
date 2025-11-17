import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EnumeratorDataService } from '../../../core/dataservice/enumerator-service/enumerator.dataservice';
import {
	HouseholdListing,
	CreateHouseholdListingDto,
	UpdateHouseholdListingDto,
} from '../../../core/dataservice/household-listing/household-listing.interface';
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

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private enumeratorService: EnumeratorDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
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
				next: (households: HouseholdListing[]) => {
					const household = households.find((h) => h.id === this.householdId);

					if (household) {
						this.householdForm = {
							surveyEnumerationAreaId: household.surveyEnumerationAreaId,
							structureNumber: household.structureNumber,
							householdIdentification: household.householdIdentification,
							householdSerialNumber: household.householdSerialNumber,
							nameOfHOH: household.nameOfHOH,
							totalMale: household.totalMale,
							totalFemale: household.totalFemale,
							phoneNumber: household.phoneNumber || '',
							remarks: household.remarks || '',
						};
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
			// Update existing household
			const updateDto: UpdateHouseholdListingDto = {
				structureNumber: this.householdForm.structureNumber,
				householdIdentification: this.householdForm.householdIdentification,
				householdSerialNumber: this.householdForm.householdSerialNumber,
				nameOfHOH: this.householdForm.nameOfHOH,
				totalMale: this.householdForm.totalMale,
				totalFemale: this.householdForm.totalFemale,
				phoneNumber: this.householdForm.phoneNumber,
				remarks: this.householdForm.remarks,
			};

			this.enumeratorService
				.updateHouseholdListing(this.householdId, updateDto)
				.subscribe({
					next: () => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household updated successfully',
						});
						setTimeout(() => this.goBack(), 1000);
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
		} else {
			// Create new household
			this.enumeratorService
				.createHouseholdListing(this.householdForm)
				.subscribe({
					next: () => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household created successfully',
						});
						setTimeout(() => this.goBack(), 1000);
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
		}
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
	 * Navigate back
	 */
	goBack(): void {
		this.router.navigate([
			'/enumerator/survey-enumeration-area',
			this.surveyEnumerationAreaId,
		]);
	}
}
