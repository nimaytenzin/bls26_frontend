import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../../primeng.modules';
import { TheatreDataService } from '../../../../core/dataservice/theatre/theatre.dataservice';
import {
	Theatre,
	TheatreStatus,
} from '../../../../core/dataservice/theatre/theatre.interface';
import { DzongkhagDataService } from '../../../../core/dataservice/dzonkhag/dzongkhag.dataservice';
import { AdminTheatreAddWithImageComponent } from './components/admin-theatre-add-with-image/admin-theatre-add-with-image.component';
import { AdminTheatreEditComponent } from './components/admin-theatre-edit/admin-theatre-edit.component';
import { AdminHallAddComponent } from './components/admin-hall-add/admin-hall-add.component';
import { AdminHallListComponent } from './components/admin-hall-list/admin-hall-list.component';

interface ViewModeOption {
	label: string;
	value: 'grid' | 'list' | 'table';
	icon: string;
}

interface SortOption {
	label: string;
	value: string;
}

@Component({
	selector: 'app-admin-theatre-listing',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-theatre-listing.component.html',
	styleUrls: ['./admin-theatre-listing.component.scss'],
	providers: [DialogService],
})
export class AdminTheatreListingComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	ref: DynamicDialogRef | undefined;

	// Data
	theatres: Theatre[] = [];
	loading = false;
	searchQuery = '';
	viewMode: 'grid' | 'list' | 'table' = 'grid';
	selectedItems: string[] = [];
	showBulkActions = true;
	showFilters = true;
	showViewModeToggle = true;
	showAddButton = true;

	filteredTheatres: Theatre[] = [];
	searchTerm = '';
	selectedStatus = '';
	selectedLocation = '';
	selectedSort = 'name_asc';

	// Dynamic location options populated from API
	locationOptions: { label: string; value: string }[] = [];

	// View Options
	viewModeOptions: ViewModeOption[] = [
		{ label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
		{ label: 'List', value: 'list', icon: 'pi pi-list' },
		{ label: 'Table', value: 'table', icon: 'pi pi-table' },
	];

	statusOptions = [
		{ label: 'Active', value: 'ACTIVE' },
		{ label: 'Inactive', value: 'INACTIVE' },
		{ label: 'Maintenance', value: 'MAINTENANCE' },
	];

	sortOptions: SortOption[] = [
		{ label: 'Name A-Z', value: 'name_asc' },
		{ label: 'Name Z-A', value: 'name_desc' },
		{ label: 'Location', value: 'location_asc' },
		{ label: 'Newest', value: 'createdAt_desc' },
		{ label: 'Oldest', value: 'createdAt_asc' },
	];

	// Constants for template
	readonly TheatreStatus = TheatreStatus;

	constructor(
		private theatreService: TheatreDataService,
		private dzongkhagService: DzongkhagDataService,
		private dialogService: DialogService
	) {}

	ngOnInit(): void {
		this.loadData();
		this.loadDzongkhags();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.ref) {
			this.ref.close();
		}
	}

	// Data Loading
	private loadData(): void {
		this.loading = true;

		// Load theatres
		this.theatreService.findAllTheatres().subscribe({
			next: (theatres: Theatre[]) => {
				this.theatres = theatres;
				this.applyFiltersAndSearch();
				this.loading = false;
			},
			error: (error: any) => {
				this.loading = false;
			},
		});
	}

	// Load dzongkhags for location options
	private loadDzongkhags(): void {
		this.dzongkhagService
			.findAllDzongkhags()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (dzongkhags) => {
					this.locationOptions = dzongkhags.map((dzongkhag) => ({
						label: dzongkhag.name,
						value: dzongkhag.name,
					}));
				},
				error: (error: any) => {
					console.error('Error loading dzongkhags:', error);
					// Fallback to static locations if API fails
				},
			});
	}

	// Search and Filter
	onSearchChange(): void {
		this.applyFiltersAndSearch();
	}

	clearSearch(): void {
		this.searchTerm = '';
		this.onSearchChange();
	}

	applyFilters(): void {
		this.applyFiltersAndSearch();
	}

	private applyFiltersAndSearch(): void {
		let filtered = [...this.theatres];

		// Apply search
		if (this.searchTerm.trim()) {
			const query = this.searchTerm.toLowerCase();
			filtered = filtered.filter(
				(theatre) =>
					theatre.name.toLowerCase().includes(query) ||
					theatre.address.toLowerCase().includes(query) ||
					(theatre.dzongkhag?.name || '').toLowerCase().includes(query)
			);
		}

		// Apply filters
		if (this.selectedStatus) {
			filtered = filtered.filter(
				(theatre) => theatre.status === this.selectedStatus
			);
		}

		if (this.selectedLocation) {
			filtered = filtered.filter(
				(theatre) => theatre.dzongkhag?.name === this.selectedLocation
			);
		}

		// Apply sorting
		filtered = this.sortTheatres(filtered);

		this.filteredTheatres = filtered;
	}

	private sortTheatres(theatres: Theatre[]): Theatre[] {
		const [field, order] = this.selectedSort.split('_');

		return theatres.sort((a, b) => {
			let comparison = 0;

			switch (field) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'location':
					comparison = a.address.localeCompare(b.address);
					break;
				case 'createdAt':
					const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					comparison = aDate - bDate;
					break;
				default:
					comparison = 0;
			}

			return order === 'desc' ? -comparison : comparison;
		});
	}

	// View Mode
	onViewModeChange(): void {}

	// Selection
	isSelected(id: string): boolean {
		return this.selectedItems.includes(id);
	}

	areAllItemsSelected(): boolean {
		return (
			this.filteredTheatres.length > 0 &&
			this.filteredTheatres.every((theatre) => this.isSelected(theatre.id))
		);
	}

	areSomeItemsSelected(): boolean {
		return (
			this.filteredTheatres.some((theatre) => this.isSelected(theatre.id)) &&
			!this.areAllItemsSelected()
		);
	}

	toggleAllSelection(): void {
		let newSelection = [...this.selectedItems];

		if (this.areAllItemsSelected()) {
			// Remove all filtered theatres from selection
			newSelection = newSelection.filter(
				(id) => !this.filteredTheatres.find((theatre) => theatre.id === id)
			);
		} else {
			// Add all filtered theatres to selection
			this.filteredTheatres.forEach((theatre) => {
				if (!this.isSelected(theatre.id)) {
					newSelection.push(theatre.id);
				}
			});
		}

		this.selectedItems = newSelection;
	}

	clearSelection(): void {
		this.selectedItems = [];
	}

	// Theatre Actions
	onTheatreEdit(theatre: Theatre): void {
		this.ref = this.dialogService.open(AdminTheatreEditComponent, {
			header: `Edit Theatre: ${theatre.name}`,

			closable: true,
			dismissableMask: true,
			data: { theatre },
		});

		this.ref.onClose.subscribe((result: any) => {
			if (result?.success) {
				console.log('Theatre updated successfully:', result.data);
				this.loadData(); // Refresh the theatre list
			}
		});
	}

	onTheatreDelete(theatre: Theatre): void {
		if (confirm(`Are you sure you want to delete "${theatre.name}"?`)) {
			this.theatreService
				.deleteTheatre(theatre.id)
				.pipe(takeUntil(this.destroy$))
				.subscribe(() => {
					this.loadData();
				});
		}
	}

	openAddTheatreDialog(): void {
		this.ref = this.dialogService.open(AdminTheatreAddWithImageComponent, {
			header: 'Add New Theatre',

			closable: true,
			dismissableMask: true,
			maximizable: true,
		});

		this.ref.onClose.subscribe((result: any) => {
			if (result?.success) {
				console.log('Theatre added successfully:', result.data);
				this.loadData(); // Refresh the theatre list
			}
		});
	}

	onManageHalls(theatreId: string): void {
		// Find the theatre object
		const theatre = this.theatres.find((t) => t.id === theatreId);

		if (!theatre) {
			console.error('Theatre not found');
			return;
		}

		this.ref = this.dialogService.open(AdminHallListComponent, {
			header: `Manage Halls - ${theatre.name}`,

			closable: true,
			dismissableMask: true,
			maximizable: true,
			data: { theatre },
		});

		this.ref.onClose.subscribe((result: any) => {
			if (result?.success || result?.dataChanged) {
				console.log('Hall management completed, refreshing theatre data');
				this.loadData(); // Refresh the theatre list to show updated hall information
			}
		});
	}

	onAddHall(theatreId: string): void {
		// Find the theatre object
		const theatre = this.theatres.find((t) => t.id === theatreId);

		if (!theatre) {
			console.error('Theatre not found');
			return;
		}

		this.ref = this.dialogService.open(AdminHallAddComponent, {
			header: `Add Hall to ${theatre.name}`,
			width: '90%',
			height: '90%',
			closable: true,
			dismissableMask: true,
			maximizable: true,
			data: { theatre },
		});

		this.ref.onClose.subscribe((result: any) => {
			if (result?.success) {
				console.log('Hall added successfully:', result.data);
				this.loadData(); // Refresh the theatre list to show updated hall count
			}
		});
	}

	// Utility Methods
	getStatusSeverity(status: TheatreStatus): string {
		switch (status) {
			case TheatreStatus.ACTIVE:
				return 'success';
			case TheatreStatus.INACTIVE:
				return 'secondary';
			case TheatreStatus.MAINTENANCE:
				return 'warning';
			case TheatreStatus.RENOVATION:
				return 'info';
			case TheatreStatus.TEMPORARILY_CLOSED:
				return 'danger';
			default:
				return 'secondary';
		}
	}

	getTotalSeatsForTheatre(theatre: Theatre): number {
		return (theatre.halls ?? []).reduce(
			(total, hall) => total + hall.capacity,
			0
		);
	}

	trackByTheatreId(index: number, theatre: Theatre): string {
		return theatre.id;
	}

	handleImageError(event: any): void {
		event.target.src = '/assets/images/theater-placeholder.jpg';
	}

	getTheatreImage(theatre: Theatre): string {
		return this.theatreService.getTheatreImageUrlOrDefault(theatre);
	}
}
