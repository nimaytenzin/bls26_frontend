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
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SurveyEnumerationArea } from '../../../core/dataservice/survey/survey.dto';
import { ScrollerModule } from 'primeng/scroller';
import { PrimeNgModules } from '../../../primeng.modules';

@Component({
	selector: 'app-survey-enumeration-area-detail',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './survey-enumeration-area-detail.component.html',
	styleUrls: ['./survey-enumeration-area-detail.component.scss'],
})
export class SurveyEnumerationAreaDetailComponent implements OnInit {
	surveyEnumerationAreaId!: number;
	surveyEnumerationArea: SurveyEnumerationArea | null = null;
	surveyEnumerationAreaDetail: SurveyEnumerationArea | null = null; // Alias for template compatibility
	householdListings: HouseholdListing[] = [];
	filteredHouseholdListings: HouseholdListing[] = [];
	loading = true;
	loadingHouseholds = false;
	error: string | null = null;

	// Search and filter
	searchQuery = '';
	filterDialogVisible = false;
	statusFilter: string[] = [];

	// User info (would come from auth service in real app)
	collectorName = 'John Doe';

	// Add/Edit dialog
	householdDialogVisible = false;
	isEditMode = false;
	selectedHousehold: HouseholdListing | null = null;
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
			this.loadSurveyEnumerationAreaDetails();
			this.loadHouseholdListings();
		});
	}

	/**
	 * Get empty form
	 */
	getEmptyForm(): CreateHouseholdListingDto {
		return {
			surveyEnumerationAreaId: this.surveyEnumerationAreaId,
			structureNumber: '',
			householdIdentification: '',
			householdSerialNumber: this.getNextSerialNumber(),
			nameOfHOH: '',
			totalMale: 0,
			totalFemale: 0,
			phoneNumber: '',
			remarks: '',
		};
	}

	/**
	 * Get next serial number
	 */
	getNextSerialNumber(): number {
		if (this.householdListings.length === 0) return 1;
		const maxSerial = Math.max(
			...this.householdListings.map((h) => h.householdSerialNumber)
		);
		return maxSerial + 1;
	}

	/**
	 * Load survey enumeration area details from API
	 */
	loadSurveyEnumerationAreaDetails(): void {
		this.loading = true;
		this.error = null;

		this.enumeratorService
			.getSurveyEnumerationAreaDetails(this.surveyEnumerationAreaId)
			.subscribe({
				next: (data: any) => {
					this.surveyEnumerationArea = data;
					this.surveyEnumerationAreaDetail = data; // Alias for template
					this.loading = false;
				},
				error: (error: any) => {
					console.error(
						'Error loading survey enumeration area details:',
						error
					);
					this.error = 'Failed to load survey enumeration area details';
					this.loading = false;
				},
			});
	}

	/**
	 * Load household listings
	 */
	loadHouseholdListings(): void {
		this.loadingHouseholds = true;

		this.enumeratorService
			.getHouseholdListings(this.surveyEnumerationAreaId)
			.subscribe({
				next: (data: HouseholdListing[]) => {
					this.householdListings = data.sort(
						(a, b) => a.householdSerialNumber - b.householdSerialNumber
					);
					this.filteredHouseholdListings = [...this.householdListings];
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
	 * Filter households based on search query and status
	 */
	filterHouseholds(): void {
		let filtered = [...this.householdListings];

		// Apply search filter
		if (this.searchQuery.trim()) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(h) =>
					h.structureNumber.toLowerCase().includes(query) ||
					h.nameOfHOH.toLowerCase().includes(query)
			);
		}

		// Apply status filter
		if (this.statusFilter.length > 0) {
			filtered = filtered.filter((h) => {
				const status = this.getHouseholdStatus(h);
				return this.statusFilter.includes(status);
			});
		}

		this.filteredHouseholdListings = filtered;
	}

	/**
	 * Get household status
	 */
	getHouseholdStatus(household: HouseholdListing): string {
		// This is a placeholder - adjust based on your actual status logic
		if (
			household.remarks &&
			household.remarks.toLowerCase().includes('complete')
		) {
			return 'Complete';
		}
		if (household.totalMale > 0 || household.totalFemale > 0) {
			return 'In Progress';
		}
		return 'Pending';
	}

	/**
	 * Get status icon class
	 */
	getStatusIconClass(household: HouseholdListing): string {
		const status = this.getHouseholdStatus(household);
		switch (status) {
			case 'Complete':
				return 'pi pi-check-circle text-green-600';
			case 'In Progress':
				return 'pi pi-clock text-yellow-600';
			default:
				return 'pi pi-exclamation-circle text-red-600';
		}
	}

	/**
	 * Get status color class
	 */
	getStatusColorClass(household: HouseholdListing): string {
		const status = this.getHouseholdStatus(household);
		switch (status) {
			case 'Complete':
				return 'bg-green-100 text-green-700 border-green-300';
			case 'In Progress':
				return 'bg-yellow-100 text-yellow-700 border-yellow-300';
			default:
				return 'bg-red-100 text-red-700 border-red-300';
		}
	}

	/**
	 * Toggle status filter
	 */
	toggleStatusFilter(status: string): void {
		const index = this.statusFilter.indexOf(status);
		if (index > -1) {
			this.statusFilter.splice(index, 1);
		} else {
			this.statusFilter.push(status);
		}
		this.filterHouseholds();
	}

	/**
	 * Clear all filters
	 */
	clearFilters(): void {
		this.statusFilter = [];
		this.filterHouseholds();
		this.filterDialogVisible = false;
	}

	/**
	 * Make phone call
	 */
	callPhone(phoneNumber: string): void {
		if (phoneNumber) {
			window.location.href = `tel:${phoneNumber}`;
		}
	}

	/**
	 * TrackBy function for performance
	 */
	trackByHouseholdId(index: number, household: HouseholdListing): number {
		return household.id;
	}

	/**
	 * Get survey name from the detail object
	 */
	getSurveyName(): string {
		const detail: any = this.surveyEnumerationAreaDetail;
		return detail?.survey?.name || 'N/A';
	}

	/**
	 * Get survey year from the detail object
	 */
	getSurveyYear(): number | null {
		const detail: any = this.surveyEnumerationAreaDetail;
		return detail?.survey?.year || null;
	}

	/**
	 * Navigate back to survey detail
	 */
	goBack(): void {
		if (this.surveyEnumerationArea?.surveyId) {
			this.router.navigate([
				'/enumerator/survey',
				this.surveyEnumerationArea.surveyId,
			]);
		} else {
			this.router.navigate(['/enumerator']);
		}
	}

	/**
	 * Navigate to add household form
	 */
	navigateToAddHousehold(): void {
		this.router.navigate([
			'/enumerator/household-listing-form',
			this.surveyEnumerationAreaId,
		]);
	}

	/**
	 * Navigate to edit household form
	 */
	navigateToEditHousehold(householdId: number): void {
		this.router.navigate([
			'/enumerator/household-listing-form',
			this.surveyEnumerationAreaId,
			householdId,
		]);
	}

	/**
	 * Navigate to add household
	 */
	addHousehold(): void {
		this.isEditMode = false;
		this.selectedHousehold = null;
		this.householdForm = this.getEmptyForm();
		this.householdDialogVisible = true;
	}

	/**
	 * Open edit household dialog
	 */
	editHousehold(household: HouseholdListing): void {
		this.isEditMode = true;
		this.selectedHousehold = household;
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
		this.householdDialogVisible = true;
	}

	/**
	 * Close household dialog
	 */
	closeHouseholdDialog(): void {
		this.householdDialogVisible = false;
		this.isEditMode = false;
		this.selectedHousehold = null;
		this.householdForm = this.getEmptyForm();
	}

	/**
	 * Save household (create or update)
	 */
	saveHousehold(): void {
		if (this.isEditMode && this.selectedHousehold) {
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
				.updateHouseholdListing(this.selectedHousehold.id, updateDto)
				.subscribe({
					next: (updated: HouseholdListing) => {
						// Update in list
						const index = this.householdListings.findIndex(
							(h) => h.id === updated.id
						);
						if (index !== -1) {
							this.householdListings[index] = updated;
						}

						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household listing updated successfully',
						});

						this.closeHouseholdDialog();
					},
					error: (error: any) => {
						console.error('Error updating household:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail:
								error.error?.message || 'Failed to update household listing',
						});
					},
				});
		} else {
			// Create new household
			this.enumeratorService
				.createHouseholdListing(this.householdForm)
				.subscribe({
					next: (created: HouseholdListing) => {
						this.householdListings.push(created);
						this.householdListings.sort(
							(a, b) => a.householdSerialNumber - b.householdSerialNumber
						);

						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household listing created successfully',
						});

						this.closeHouseholdDialog();
					},
					error: (error: any) => {
						console.error('Error creating household:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail:
								error.error?.message || 'Failed to create household listing',
						});
					},
				});
		}
	}

	/**
	 * Delete household
	 */
	deleteHousehold(household: HouseholdListing): void {
		if (
			!confirm(
				`Are you sure you want to delete household ${household.householdSerialNumber}?`
			)
		) {
			return;
		}

		this.enumeratorService.deleteHouseholdListing(household.id).subscribe({
			next: () => {
				this.householdListings = this.householdListings.filter(
					(h) => h.id !== household.id
				);

				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Household listing deleted successfully',
				});
			},
			error: (error: any) => {
				console.error('Error deleting household:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error.error?.message || 'Failed to delete household listing',
				});
			},
		});
	}

	/**
	 * Calculate total population for a household
	 */
	getTotalPopulation(household: HouseholdListing): number {
		return household.totalMale + household.totalFemale;
	}

	/**
	 * Check if form is valid
	 */
	isFormValid(): boolean {
		return !!(
			this.householdForm.structureNumber &&
			this.householdForm.householdIdentification &&
			this.householdForm.householdSerialNumber &&
			this.householdForm.nameOfHOH &&
			this.householdForm.totalMale >= 0 &&
			this.householdForm.totalFemale >= 0
		);
	}

	/**
	 * Check if can add/edit households
	 */
	canModifyHouseholds(): boolean {
		return !(
			this.surveyEnumerationArea?.isSubmitted ||
			this.surveyEnumerationArea?.isValidated
		);
	}

	/**
	 * Get status tag severity based on submission/validation status
	 */
	getStatusSeverity(): string {
		if (this.surveyEnumerationArea?.isValidated) return 'success';
		if (this.surveyEnumerationArea?.isSubmitted) return 'warning';
		return 'info';
	}

	/**
	 * Get status text
	 */
	getStatusText(): string {
		if (this.surveyEnumerationArea?.isValidated) return 'Validated';
		if (this.surveyEnumerationArea?.isSubmitted) return 'Submitted';
		return 'In Progress';
	}

	/**
	 * Get location hierarchy string
	 */
	getLocationHierarchy(): string {
		const ea = this.surveyEnumerationArea?.enumerationArea;
		if (!ea) return '';

		const parts = [];
		if (ea.subAdministrativeZone?.administrativeZone?.dzongkhag?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.dzongkhag.name);
		}
		if (ea.subAdministrativeZone?.administrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.administrativeZone.name);
		}
		if (ea.subAdministrativeZone?.name) {
			parts.push(ea.subAdministrativeZone.name);
		}
		if (ea.name) {
			parts.push(ea.name);
		}

		return parts.join(' → ');
	}
}
