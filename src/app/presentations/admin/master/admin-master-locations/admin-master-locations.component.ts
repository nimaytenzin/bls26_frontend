import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Subject,
	takeUntil,
	debounceTime,
	distinctUntilChanged,
	finalize,
} from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import { DzongkhagDataService } from '../../../../core/dataservice/dzonkhag/dzongkhag.dataservice';
import {
	Dzongkhag,
	CreateDzongkhagDto,
	UpdateDzongkhagDto,
} from '../../../../core/dataservice/dzonkhag/dzongkhag.interface';

interface FilterOptions {
	sortBy: 'name' | 'createdAt';
	sortOrder: 'asc' | 'desc';
}

@Component({
	selector: 'app-admin-master-locations',
	templateUrl: './admin-master-locations.component.html',
	styleUrls: ['./admin-master-locations.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [ConfirmationService, MessageService],
})
export class AdminMasterLocationsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	// Data properties
	locations: Dzongkhag[] = [];
	filteredLocations: Dzongkhag[] = [];
	loading = false;
	searchQuery = '';
	errorMessage = '';
	successMessage = '';

	// UI State
	showFilters = true;
	showAddButton = true;
	currentPage = 1;
	totalRecords = 0;
	pageSize = 20;

	// Dialog states
	showLocationDetail = false;
	showAddEditDialog = false;
	selectedLocation: Dzongkhag | null = null;
	editingLocation: Dzongkhag | null = null;
	showValidationErrors = false;

	// Form properties
	locationForm: Partial<Dzongkhag> = {
		name: '',
	};

	// View Options - removed, keeping only table view

	// Filter options
	filters: FilterOptions = {
		sortBy: 'name',
		sortOrder: 'asc',
	};

	// Dropdown options
	sortOptions = [
		{ label: 'Name', value: 'name' },
		{ label: 'Created Date', value: 'createdAt' },
	];

	sortOrderOptions = [
		{ label: 'Ascending', value: 'asc' },
		{ label: 'Descending', value: 'desc' },
	];

	constructor(
		private dzongkhagDataService: DzongkhagDataService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit() {
		this.initializeData();
		this.setupSearch();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeData() {
		this.loadLocations();
	}

	private setupSearch() {
		this.searchSubject
			.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
			.subscribe((searchTerm) => {
				this.performSearch(searchTerm);
			});
	}

	loadLocations() {
		this.loading = true;
		this.clearMessages();

		this.dzongkhagDataService
			.findAllDzongkhags()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (locations) => {
					this.locations = locations;
					this.filteredLocations = [...locations];
					this.totalRecords = locations.length;
					this.applyFilters();
				},
				error: (error) => {
					console.error('Error loading locations:', error);
					this.errorMessage = 'Failed to load locations. Please try again.';
				},
			});
	}

	onSearch(event: any) {
		const value = event.target.value;
		this.searchQuery = value;
		this.searchSubject.next(value);
	}

	private performSearch(searchTerm: string) {
		if (!searchTerm.trim()) {
			this.filteredLocations = [...this.locations];
		} else {
			this.filteredLocations = this.locations.filter((location) =>
				location.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		this.applyFilters();
	}

	applyFilters() {
		let filtered = [...this.filteredLocations];

		// Apply sorting
		filtered.sort((a, b) => {
			const field = this.filters.sortBy;
			let aValue: any = a[field];
			let bValue: any = b[field];

			if (field === 'createdAt') {
				aValue = new Date(aValue || 0).getTime();
				bValue = new Date(bValue || 0).getTime();
			} else {
				aValue = aValue?.toString().toLowerCase() || '';
				bValue = bValue?.toString().toLowerCase() || '';
			}

			const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			return this.filters.sortOrder === 'asc' ? comparison : -comparison;
		});

		this.filteredLocations = filtered;
		this.totalRecords = filtered.length;
	}

	onFilterChange() {
		this.applyFilters();
	}

	addLocation() {
		this.editingLocation = null;
		this.locationForm = { name: '' };
		this.showValidationErrors = false;
		this.showAddEditDialog = true;
	}

	editLocation(location: Dzongkhag) {
		this.editingLocation = location;
		this.locationForm = { ...location };
		this.showValidationErrors = false;
		this.showAddEditDialog = true;
	}

	deleteLocation(location: Dzongkhag) {
		this.confirmationService.confirm({
			message: `Are you sure you want to delete "${location.name}"?`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.performDelete(location.id);
			},
		});
	}

	private performDelete(id: number) {
		this.loading = true;
		this.clearMessages();

		this.dzongkhagDataService
			.deleteDzongkhag(id)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: () => {
					this.successMessage = 'Location deleted successfully';
					this.loadLocations();
				},
				error: (error) => {
					console.error('Error deleting location:', error);
					this.errorMessage = 'Failed to delete location. Please try again.';
				},
			});
	}

	saveLocation() {
		if (!this.isValidForm()) {
			this.showValidationErrors = true;
			return;
		}

		const isEditing = !!this.editingLocation;
		const operation = isEditing
			? this.dzongkhagDataService.updateDzongkhag(
					this.editingLocation!.id,
					this.locationForm as UpdateDzongkhagDto
			  )
			: this.dzongkhagDataService.createDzongkhag(
					this.locationForm as CreateDzongkhagDto
			  );

		this.loading = true;
		this.clearMessages();

		operation
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: () => {
					this.successMessage = `Location ${
						isEditing ? 'updated' : 'created'
					} successfully`;
					this.showAddEditDialog = false;
					this.loadLocations();
				},
				error: (error) => {
					console.error(
						`Error ${isEditing ? 'updating' : 'creating'} location:`,
						error
					);
					this.errorMessage = `Failed to ${
						isEditing ? 'update' : 'create'
					} location. Please try again.`;
				},
			});
	}

	isValidForm(): boolean {
		return !!(this.locationForm.name && this.locationForm.name.trim());
	}

	refreshData() {
		this.loadLocations();
	}

	exportLocations() {
		// Implement export functionality if needed
		console.log('Export locations functionality');
	}

	trackByLocationId(index: number, location: Dzongkhag): number {
		return location.id;
	}

	private clearMessages() {
		this.errorMessage = '';
		this.successMessage = '';
	}

	// Dialog methods
	hideDialog() {
		this.showAddEditDialog = false;
		this.showLocationDetail = false;
		this.editingLocation = null;
		this.selectedLocation = null;
		this.showValidationErrors = false;
	}

	viewLocationDetail(location: Dzongkhag) {
		this.selectedLocation = location;
		this.showLocationDetail = true;
	}

	formatDate(date: any): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}
}
