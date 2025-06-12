import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
	Theatre,
	Hall,
	TheatreStatus,
	TheatreService,
	BHUTANESE_LOCATIONS,
} from '../../../core/dataservice/theatre';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../primeng.modules';
import { AdminTheatreAddComponent } from './components/admin-theatre-add/admin-theatre-add.component';

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
	halls: Hall[] = [];
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

	locationOptions = [
		{ label: 'Thimphu', value: 'Thimphu' },
		{ label: 'Paro', value: 'Paro' },
		{ label: 'Punakha', value: 'Punakha' },
		{ label: 'Phuntsholing', value: 'Phuntsholing' },
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
	readonly LOCATIONS = BHUTANESE_LOCATIONS;

	constructor(
		private theatreService: TheatreService,
		private dialogService: DialogService
	) {}

	ngOnInit(): void {
		this.loadData();
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
		this.theatreService
			.getTheatres()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.theatres = result.data;
					this.applyFiltersAndSearch();
				},
				error: (error) => {
					console.error('Error loading theatres:', error);
					setTimeout(() => {
						this.loading = false;
					}, 1000); // Simulate loading delay
				},
			});

		// Load halls
		this.theatreService
			.getHalls()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.halls = result.data;
					this.loading = false;
					this.applyFiltersAndSearch();
				},
				error: (error) => {
					console.error('Error loading halls:', error);
					this.loading = false;
				},
			});
	}

	ngOnChanges(): void {
		this.applyFiltersAndSearch();
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
					theatre.location.toLowerCase().includes(query) ||
					theatre.city.toLowerCase().includes(query) ||
					theatre.district.toLowerCase().includes(query)
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
				(theatre) => theatre.city === this.selectedLocation
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
					comparison = a.location.localeCompare(b.location);
					break;
				case 'createdAt':
					comparison = a.createdAt.getTime() - b.createdAt.getTime();
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
		// Open edit dialog - would need to create AdminTheatreEditComponent
		console.log('Edit theatre:', theatre);
	}

	onTheatreView(theatre: Theatre): void {
		// Open view dialog - would need to create AdminTheatreViewComponent
		console.log('View theatre:', theatre);
	}

	onTheatreDelete(theatre: Theatre): void {
		if (confirm(`Are you sure you want to delete "${theatre.name}"?`)) {
			this.theatreService
				.deleteTheatre(theatre.id)
				.pipe(takeUntil(this.destroy$))
				.subscribe(() => {
					this.loadData(); // Refresh data
				});
		}
	}

	openAddTheatreDialog(): void {
		this.ref = this.dialogService.open(AdminTheatreAddComponent, {
			header: 'Add New Theatre',
			closable: true,
		});
	}

	onAddHall(theatreId: string): void {
		// Open add hall dialog - would need to create AdminHallAddComponent
		console.log('Add hall for theatre:', theatreId);
	}

	// Bulk Actions
	onBulkStatusUpdate(status: TheatreStatus): void {
		if (this.selectedItems.length === 0) return;

		this.theatreService
			.bulkUpdateTheatreStatus(this.selectedItems, status)
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.loadData();
				this.clearSelection();
			});
	}

	onBulkDelete(): void {
		if (this.selectedItems.length === 0) return;

		const theatreNames = this.theatres
			.filter((t) => this.selectedItems.includes(t.id))
			.map((t) => t.name)
			.join(', ');

		if (
			confirm(
				`Are you sure you want to delete these theatres: ${theatreNames}?`
			)
		) {
			this.theatreService
				.bulkDeleteTheatres(this.selectedItems)
				.pipe(takeUntil(this.destroy$))
				.subscribe(() => {
					this.loadData();
					this.clearSelection();
				});
		}
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

	getTheatreHalls(theatreId: string): Hall[] {
		return this.halls.filter((hall) => hall.theatreId === theatreId);
	}

	getTotalSeatsForTheatre(theatreId: string): number {
		return this.getTheatreHalls(theatreId).reduce(
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

	getTheatreImage(theatre: any): string {
		// Use theatre's image if available, otherwise fallback to default
		// return theatre.image || 'images/theatres/lugartheatre.jpg';
		return 'theatres/lugartheatre.jpg'; // Default image for now
	}
}
