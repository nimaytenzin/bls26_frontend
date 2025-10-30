import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { CurrentHouseholdListingDataService } from '../../../../core/dataservice/household-listings/current-household-listing/current-household-listing.dataservice';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import {
	CurrentHouseholdListing,
	CreateCurrentHouseholdListingDto,
	UpdateCurrentHouseholdListingDto,
} from '../../../../core/dataservice/household-listings/current-household-listing/current-household-listing.dto';
import { EnumerationArea } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Table } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
	selector: 'app-admin-master-current-household-listings',
	templateUrl: './admin-master-current-household-listings.component.html',
	styleUrls: ['./admin-master-current-household-listings.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterCurrentHouseholdListingsComponent implements OnInit {
	// Table references
	@ViewChild('dt') dt!: Table;

	// Data properties
	householdListings: CurrentHouseholdListing[] = [];
	selectedHousehold: CurrentHouseholdListing | null = null;
	enumerationAreas: EnumerationArea[] = [];
	loading = false;

	// Dialog states
	householdDialog = false;
	deleteDialog = false;
	isEditMode = false;

	// Form
	householdForm: FormGroup;

	// Table properties
	globalFilterValue = '';

	// Filter by enumeration area
	selectedEAFilter: number | null = null;

	constructor(
		private householdService: CurrentHouseholdListingDataService,
		private enumerationAreaService: EnumerationAreaDataService,
		private fb: FormBuilder,
		private messageService: MessageService
	) {
		this.householdForm = this.fb.group({
			eaId: [null, [Validators.required]],
			structureNumber: ['', [Validators.required]],
			householdIdentification: ['', [Validators.required]],
			householdSerialNumber: [null, [Validators.required, Validators.min(1)]],
			nameOfHOH: ['', [Validators.required]],
			totalMale: [0, [Validators.required, Validators.min(0)]],
			totalFemale: [0, [Validators.required, Validators.min(0)]],
			phoneNumber: [''],
			remarks: [''],
		});
	}

	ngOnInit() {
		this.loadEnumerationAreas();
		this.loadHouseholdListings();
	}

	loadEnumerationAreas() {
		this.enumerationAreaService.findAllEnumerationAreas().subscribe({
			next: (data) => {
				this.enumerationAreas = data;
			},
			error: (error) => {
				console.error('Error loading enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
					life: 3000,
				});
			},
		});
	}

	loadHouseholdListings() {
		this.loading = true;
		this.householdService.findAllHouseholdListings().subscribe({
			next: (data) => {
				this.householdListings = data;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading household listings:', error);
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load household listings',
					life: 3000,
				});
			},
		});
	}

	loadHouseholdListingsByEA(eaId: number) {
		this.loading = true;
		this.householdService
			.findHouseholdListingsByEnumerationArea(eaId)
			.subscribe({
				next: (data) => {
					this.householdListings = data;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading household listings by EA:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load household listings',
						life: 3000,
					});
				},
			});
	}

	onEAFilterChange(event: any) {
		if (event.value) {
			this.loadHouseholdListingsByEA(event.value);
		} else {
			this.loadHouseholdListings();
		}
	}

	openNew() {
		this.selectedHousehold = null;
		this.isEditMode = false;
		this.householdForm.reset({
			totalMale: 0,
			totalFemale: 0,
		});
		this.householdDialog = true;
	}

	editHousehold(household: CurrentHouseholdListing) {
		this.selectedHousehold = household;
		this.isEditMode = true;
		this.householdForm.patchValue({
			eaId: household.eaId,
			structureNumber: household.structureNumber,
			householdIdentification: household.householdIdentification,
			householdSerialNumber: household.householdSerialNumber,
			nameOfHOH: household.nameOfHOH,
			totalMale: household.totalMale,
			totalFemale: household.totalFemale,
			phoneNumber: household.phoneNumber || '',
			remarks: household.remarks || '',
		});
		this.householdDialog = true;
	}

	saveHousehold() {
		if (this.householdForm.invalid) return;

		const formData = this.householdForm.value;

		if (this.isEditMode && this.selectedHousehold) {
			const updateData: UpdateCurrentHouseholdListingDto = formData;
			this.householdService
				.updateHouseholdListing(this.selectedHousehold.id, updateData)
				.subscribe({
					next: () => {
						this.loadHouseholdListings();
						this.householdDialog = false;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household listing updated successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error updating household listing:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to update household listing',
							life: 3000,
						});
					},
				});
		} else {
			const createData: CreateCurrentHouseholdListingDto = formData;
			this.householdService.createHouseholdListing(createData).subscribe({
				next: () => {
					this.loadHouseholdListings();
					this.householdDialog = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Household listing created successfully',
						life: 3000,
					});
				},
				error: (error) => {
					console.error('Error creating household listing:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to create household listing',
						life: 3000,
					});
				},
			});
		}
	}

	confirmDelete(household: CurrentHouseholdListing) {
		this.selectedHousehold = household;
		this.deleteDialog = true;
	}

	deleteHousehold() {
		if (this.selectedHousehold) {
			this.householdService
				.deleteHouseholdListing(this.selectedHousehold.id)
				.subscribe({
					next: () => {
						this.loadHouseholdListings();
						this.deleteDialog = false;
						this.selectedHousehold = null;
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Household listing deleted successfully',
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error deleting household listing:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete household listing',
							life: 3000,
						});
					},
				});
		}
	}

	// Utility functions
	clear(table: Table) {
		table.clear();
		this.globalFilterValue = '';
	}

	onGlobalFilter(event: Event) {
		const target = event.target as HTMLInputElement;
		this.globalFilterValue = target.value;
		if (this.dt) {
			this.dt.filterGlobal(target.value, 'contains');
		}
	}

	getTotalMembers(household: CurrentHouseholdListing): number {
		return this.householdService.getTotalMembers(household);
	}

	getGenderRatio(household: CurrentHouseholdListing): {
		malePercentage: number;
		femalePercentage: number;
	} {
		return this.householdService.getGenderRatio(household);
	}

	getEnumerationAreaName(eaId: number): string {
		const ea = this.enumerationAreas.find((e) => e.id === eaId);
		return ea?.name || 'N/A';
	}

	get totalHouseholds(): number {
		return this.householdListings.length;
	}

	get totalMembers(): number {
		return this.householdListings.reduce(
			(sum, h) => sum + this.getTotalMembers(h),
			0
		);
	}

	get averageMembersPerHousehold(): number {
		return this.totalHouseholds > 0
			? this.totalMembers / this.totalHouseholds
			: 0;
	}

	get totalMaleMembers(): number {
		return this.householdListings.reduce((sum, h) => sum + h.totalMale, 0);
	}

	get totalFemaleMembers(): number {
		return this.householdListings.reduce((sum, h) => sum + h.totalFemale, 0);
	}

	hasFormError(field: string): boolean {
		const control = this.householdForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.householdForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['min'])
				return `${field} must be at least ${control.errors['min'].min}`;
		}
		return '';
	}
}
