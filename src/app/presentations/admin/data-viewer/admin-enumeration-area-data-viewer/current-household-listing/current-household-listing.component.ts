import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { CurrentHouseholdListingDataService } from '../../../../../core/dataservice/household-listings/current-household-listing/current-household-listing.dataservice';
import {
	CurrentHouseholdListing,
	CreateCurrentHouseholdListingDto,
} from '../../../../../core/dataservice/household-listings/current-household-listing/current-household-listing.dto';
import { MessageService } from 'primeng/api';

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

	date = new Date();
	householdListings: CurrentHouseholdListing[] = [];
	loading = false;
	showAddDialog = false;
	submitting = false;

	// Form data for adding new household
	newHousehold: CreateCurrentHouseholdListingDto = {
		eaId: 0,
		structureNumber: '',
		householdIdentification: '',
		householdSerialNumber: 1,
		nameOfHOH: '',
		totalMale: 0,
		totalFemale: 0,
		phoneNumber: '',
		remarks: '',
	};

	// Summary statistics
	get totalHouseholds(): number {
		return this.householdListings.length;
	}

	get totalPopulation(): number {
		return this.householdListings.reduce(
			(sum, listing) => sum + listing.totalMale + listing.totalFemale,
			0
		);
	}

	get totalMale(): number {
		return this.householdListings.reduce(
			(sum, listing) => sum + listing.totalMale,
			0
		);
	}

	get totalFemale(): number {
		return this.householdListings.reduce(
			(sum, listing) => sum + listing.totalFemale,
			0
		);
	}

	constructor(
		private householdService: CurrentHouseholdListingDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		if (this.enumerationAreaId) {
			this.loadHouseholdListings();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['enumerationAreaId'] && this.enumerationAreaId) {
			this.loadHouseholdListings();
			this.resetForm();
		}
	}

	loadHouseholdListings(): void {
		if (!this.enumerationAreaId) return;

		this.loading = true;
		this.householdService
			.findHouseholdListingsByEnumerationArea(this.enumerationAreaId)
			.subscribe({
				next: (listings) => {
					this.householdListings = listings.sort(
						(a, b) => a.householdSerialNumber - b.householdSerialNumber
					);
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading household listings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load household listings',
					});
					this.loading = false;
				},
			});
	}

	addHousehold(): void {
		this.resetForm();
		this.showAddDialog = true;
	}

	resetForm(): void {
		if (this.enumerationAreaId) {
			this.newHousehold = {
				eaId: this.enumerationAreaId,
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
	}

	getNextSerialNumber(): number {
		if (this.householdListings.length === 0) return 1;
		const maxSerial = Math.max(
			...this.householdListings.map((h) => h.householdSerialNumber)
		);
		return maxSerial + 1;
	}

	submitHousehold(): void {
		if (!this.validateForm()) return;

		this.submitting = true;
		this.householdService.createHouseholdListing(this.newHousehold).subscribe({
			next: (response) => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Household added successfully',
				});
				this.showAddDialog = false;
				this.submitting = false;
				this.loadHouseholdListings(); // Reload the list
			},
			error: (error) => {
				console.error('Error creating household:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to add household',
				});
				this.submitting = false;
			},
		});
	}

	validateForm(): boolean {
		if (!this.newHousehold.structureNumber.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Structure number is required',
			});
			return false;
		}
		if (!this.newHousehold.householdIdentification.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Household identification is required',
			});
			return false;
		}
		if (!this.newHousehold.nameOfHOH.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Head of household name is required',
			});
			return false;
		}
		if (this.newHousehold.totalMale < 0 || this.newHousehold.totalFemale < 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Member counts cannot be negative',
			});
			return false;
		}
		if (this.newHousehold.totalMale + this.newHousehold.totalFemale === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Total members must be greater than 0',
			});
			return false;
		}
		return true;
	}

	editHousehold(listing: CurrentHouseholdListing): void {
		// TODO: Implement edit functionality
		console.log('Edit household:', listing);
		this.messageService.add({
			severity: 'info',
			summary: 'Feature Coming Soon',
			detail: 'Edit household functionality will be available soon',
		});
	}

	deleteHousehold(listing: CurrentHouseholdListing): void {
		// TODO: Implement delete functionality with confirmation
		console.log('Delete household:', listing);
		this.messageService.add({
			severity: 'warn',
			summary: 'Feature Coming Soon',
			detail: 'Delete household functionality will be available soon',
		});
	}

	viewHouseholdDetails(listing: CurrentHouseholdListing): void {
		// TODO: Implement view details functionality
		console.log('View household details:', listing);
		this.messageService.add({
			severity: 'info',
			summary: 'Feature Coming Soon',
			detail: 'Household details view will be available soon',
		});
	}

	getTotalMembers(listing: CurrentHouseholdListing): number {
		return this.householdService.getTotalMembers(listing);
	}

	getGenderRatio(listing: CurrentHouseholdListing): {
		malePercentage: number;
		femalePercentage: number;
	} {
		return this.householdService.getGenderRatio(listing);
	}
}
