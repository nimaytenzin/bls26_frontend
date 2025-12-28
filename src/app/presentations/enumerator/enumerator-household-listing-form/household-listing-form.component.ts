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
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
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
		InputGroupModule,
		InputGroupAddonModule,
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
	phoneNumberInvalid = false;
	
	// Store original household data to detect changes
	private originalHouseholdData: CreateHouseholdListingDto | null = null;

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
				this.originalHouseholdData = null;
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
						
						// Store original data to detect changes
						this.originalHouseholdData = { ...this.householdForm };
						
						// Set structureNumber display
						this.structureNumberDisplay = this.householdForm.structureNumber;
						// Validate phone number if it exists
						this.validatePhoneNumber();
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
	 * Serial numbers are unique per structure within a survey enumeration area
	 * Each structure has its own running serial numbers starting from 1
	 */
	loadNextSerialNumber(): void {
		// Need structureId to filter households by structure
		if (!this.structureId) {
			// If no structureId, try to resolve it first
			if (this.householdForm.structureNumber) {
				this.resolveStructureId().then((resolvedStructureId) => {
					if (resolvedStructureId) {
						this.structureId = resolvedStructureId;
						this.loadNextSerialNumberForStructure();
					} else {
						// Can't resolve structureId, default to 1
						this.householdForm.householdSerialNumber = 1;
					}
				});
			} else {
				this.householdForm.householdSerialNumber = 1;
			}
			return;
		}

		this.loadNextSerialNumberForStructure();
	}

	/**
	 * Load next serial number for the current structure
	 * Filters households by structureId to get running numbers per structure
	 */
	private loadNextSerialNumberForStructure(): void {
		if (!this.structureId) {
			this.householdForm.householdSerialNumber = 1;
			return;
		}

		this.loading = true;

		this.enumeratorService
			.getHouseholdListings(this.surveyEnumerationAreaId)
			.subscribe({
				next: (households: any[]) => {
					// Filter households by structureId (not structureNumber)
					// This ensures each structure has its own running serial numbers
					const structureHouseholds = households.filter((h) => {
						// Check both structureId and structure?.id to handle different response formats
						const hStructureId = h.structureId || h.structure?.id;
						return hStructureId === this.structureId;
					});

					if (structureHouseholds.length > 0) {
						// Find max serial number for this structure
						const maxSerial = Math.max(
							...structureHouseholds.map((h) => h.householdSerialNumber)
						);
						this.householdForm.householdSerialNumber = maxSerial + 1;
					} else {
						// No households for this structure yet, start at 1
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
				// Recalculate serial number for this structure
				if (!this.isEditMode) {
					this.loadNextSerialNumber();
				}
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
	 * Save and create new form for same structure
	 */
	saveAndNext(): void {
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

		// Check if there are changes before saving
		const hasChanges = this.hasChanges();

		// Create new household - need to include structureId
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
					next: () => {
						if (hasChanges) {
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: 'Details saved, moving to next household',
							});
						} else {
							this.messageService.add({
								severity: 'info',
								summary: 'Info',
								detail: 'Moving to next household',
							});
						}
						
						// Reset form for new household in same structure
						this.resetFormForNewHousehold();
						this.submitting = false;
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

	/**
	 * Reset form for new household in same structure
	 */
	private resetFormForNewHousehold(): void {
		// Keep structureId and structureNumber, reset everything else
		const currentStructureNumber = this.householdForm.structureNumber;
		
		// Reset edit mode first
		this.householdId = undefined;
		this.isEditMode = false;
		this.originalHouseholdData = null;
		
		// Reset form fields but keep structure info
		this.householdForm = {
			surveyEnumerationAreaId: this.surveyEnumerationAreaId,
			structureNumber: currentStructureNumber,
			householdIdentification: '',
			householdSerialNumber: 1, // Will be updated by loadNextSerialNumber
			nameOfHOH: '',
			totalMale: 0,
			totalFemale: 0,
			phoneNumber: '',
			remarks: '',
		};
		
		// Load next serial number (this will update householdSerialNumber asynchronously)
		this.loadNextSerialNumber();
	}

	/**
	 * Save current household and navigate to map view for next structure
	 */
	nextStructure(): void {
		// Validate form if there's data to save
		if (this.hasFormData() && !this.isFormValid()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please fill all required fields before saving',
			});
			return;
		}

		// Prevent double submission
		if (this.submitting) return;

		// If no data to save, just navigate
		if (!this.hasFormData()) {
			this.messageService.add({
				severity: 'info',
				summary: 'Info',
				detail: 'Moving to next structure',
			});
			// Add delay to allow toast to display before navigation
			setTimeout(() => {
				this.navigateToMapView();
			}, 300);
			return;
		}

		this.submitting = true;

		// Check if there are changes before saving
		const hasChanges = this.hasChanges();

		if (this.isEditMode && this.householdId) {
			// Update existing household
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
				
				if (resolvedStructureId) {
					updateDto.structureId = resolvedStructureId;
				}

				this.enumeratorService
					.updateHouseholdListing(this.householdId!, updateDto)
					.subscribe({
						next: () => {
							if (hasChanges) {
								this.messageService.add({
									severity: 'success',
									summary: 'Success',
									detail: 'Details saved, moving to next structure',
								});
							} else {
								this.messageService.add({
									severity: 'info',
									summary: 'Info',
									detail: 'Moving to next structure',
								});
							}
							this.submitting = false;
							// Add delay to allow toast to display before navigation
							setTimeout(() => {
								this.navigateToMapView();
							}, 300);
						},
						error: (error: any) => {
							console.error('Error updating household:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: error.error?.message || 'Failed to save household listing',
							});
							this.submitting = false;
						},
					});
			});
		} else {
			// Create new household
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
						next: () => {
							if (hasChanges) {
								this.messageService.add({
									severity: 'success',
									summary: 'Success',
									detail: 'Details saved, moving to next structure',
								});
							} else {
								this.messageService.add({
									severity: 'info',
									summary: 'Info',
									detail: 'Moving to next structure',
								});
							}
							this.submitting = false;
							// Add delay to allow toast to display before navigation
							setTimeout(() => {
								this.navigateToMapView();
							}, 300);
						},
						error: (error: any) => {
							console.error('Error creating household:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: error.error?.message || 'Failed to save household listing',
							});
							this.submitting = false;
						},
					});
			});
		}
	}

	/**
	 * Navigate to map view
	 */
	private navigateToMapView(): void {
		this.router.navigate([
			'/enumerator',
			'survey-enumeration-area',
			this.surveyEnumerationAreaId,
			'map',
		]);
	}

	/**
	 * Check if form has any data entered
	 */
	private hasFormData(): boolean {
		return !!(
			this.householdForm.householdIdentification?.trim() ||
			this.householdForm.nameOfHOH?.trim() ||
			this.householdForm.totalMale ||
			this.householdForm.totalFemale ||
			this.householdForm.phoneNumber?.trim() ||
			this.householdForm.remarks?.trim()
		);
	}

	/**
	 * Check if there are any changes from the original data
	 */
	private hasChanges(): boolean {
		if (!this.originalHouseholdData) {
			// For new households, check if there's any data entered
			return this.hasFormData();
		}

		// Compare current form with original data
		return !!(
			this.householdForm.structureNumber !== this.originalHouseholdData.structureNumber ||
			this.householdForm.householdIdentification !== this.originalHouseholdData.householdIdentification ||
			this.householdForm.householdSerialNumber !== this.originalHouseholdData.householdSerialNumber ||
			this.householdForm.nameOfHOH !== this.originalHouseholdData.nameOfHOH ||
			this.householdForm.totalMale !== this.originalHouseholdData.totalMale ||
			this.householdForm.totalFemale !== this.originalHouseholdData.totalFemale ||
			(this.householdForm.phoneNumber || '') !== (this.originalHouseholdData.phoneNumber || '') ||
			(this.householdForm.remarks || '') !== (this.originalHouseholdData.remarks || '')
		);
	}

	/**
	 * Navigate back to previous page
	 */
	goBack(): void {
		// Use browser back - map state is already persisted in service
		this.location.back();
	}

	/**
	 * Validate phone number format (only if value is entered)
	 * Valid format: 8 digits starting with 1, 7, 6, 8, or 9
	 */
	validatePhoneNumber(): void {
		const phoneNumber = this.householdForm.phoneNumber?.trim() || '';
		if (phoneNumber === '') {
			// If empty, no validation needed (field is optional)
			this.phoneNumberInvalid = false;
			return;
		}
		// Validate format: 8 digits starting with 1, 7, 6, 8, or 9
		const phonePattern = /^[17689]\d{7}$/;
		this.phoneNumberInvalid = !phonePattern.test(phoneNumber);
	}

	/**
	 * Handle structure number change - recalculate serial number for the new structure
	 */
	onStructureNumberChange(): void {
		// Only recalculate if not in edit mode (to avoid changing serial number of existing household)
		if (!this.isEditMode) {
			// Reset structureId so it gets resolved from the new structureNumber
			this.structureId = undefined;
			// Resolve structureId and then load next serial number
			this.resolveStructureId().then((resolvedStructureId) => {
				if (resolvedStructureId) {
					this.structureId = resolvedStructureId;
					this.loadNextSerialNumber();
				} else {
					// If can't resolve, default to 1
					this.householdForm.householdSerialNumber = 1;
				}
			});
		}
	}
}
