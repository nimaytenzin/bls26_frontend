import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

import {
	Theatre,
	Hall,
	HallStatus,
	HallType,
	HallFeature,
	SoundSystem,
	ProjectionType,
	TheatreService,
	CreateHallDTO,
	UpdateHallDTO,
} from '../../../core/dataservice/theatre';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AdminHallViewLayoutComponent } from '../admin-hall-view-layout/admin-hall-view-layout.component';
import { PrimeNgModules } from '../../../primeng.modules';

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
	selector: 'app-admin-hall-listing',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules
	],
	templateUrl: './admin-hall-listing.component.html',
	styleUrls: ['./admin-hall-listing.component.scss'],
	providers: [DialogService],
})
export class AdminHallListingComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	ref: DynamicDialogRef | undefined;

	// Data
	halls: Hall[] = [];
	theatres: Theatre[] = [];
	loading = false;
	searchQuery = '';
	viewMode: 'grid' | 'list' | 'table' = 'grid';
	selectedItems: string[] = [];
	showBulkActions = true;
	showFilters = true;
	showViewModeToggle = true;
	showAddButton = true;

	filteredHalls: Hall[] = [];
	searchTerm = '';
	selectedStatus = '';
	selectedTheatreId = '';
	selectedType = '';
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
		{ label: 'Cleaning', value: 'CLEANING' },
		{ label: 'Booked', value: 'BOOKED' },
	];

	typeOptions = [
		{ label: 'Standard', value: 'STANDARD' },
		{ label: 'Premium', value: 'PREMIUM' },
		{ label: 'IMAX', value: 'IMAX' },
		{ label: 'Dolby Atmos', value: 'DOLBY_ATMOS' },
		{ label: 'VIP', value: 'VIP' },
		{ label: 'Drive-In', value: 'DRIVE_IN' },
	];

	sortOptions: SortOption[] = [
		{ label: 'Name A-Z', value: 'name_asc' },
		{ label: 'Name Z-A', value: 'name_desc' },
		{ label: 'Capacity', value: 'capacity_desc' },
		{ label: 'Type', value: 'type_asc' },
		{ label: 'Newest', value: 'createdAt_desc' },
		{ label: 'Oldest', value: 'createdAt_asc' },
	];

	// Constants for template
	readonly HallStatus = HallStatus;
	readonly HallType = HallType;
	readonly HallFeature = HallFeature;
	readonly SoundSystem = SoundSystem;
	readonly ProjectionType = ProjectionType;

	get theatreOptions() {
		return this.theatres.map((theatre) => ({
			name: theatre.name,
			id: theatre.id,
		}));
	}

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

		// Load theatres first
		this.theatreService
			.getTheatres()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					this.theatres = result.data;
				},
				error: (error) => {
					console.error('Error loading theatres:', error);
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
		let filtered = [...this.halls];

		// Apply search
		if (this.searchTerm.trim()) {
			const query = this.searchTerm.toLowerCase();
			filtered = filtered.filter(
				(hall) =>
					hall.name.toLowerCase().includes(query) ||
					hall.type.toLowerCase().includes(query) ||
					this.getTheatreById(hall.theatreId)
						?.name.toLowerCase()
						.includes(query)
			);
		}

		// Apply filters
		if (this.selectedStatus) {
			filtered = filtered.filter((hall) => hall.status === this.selectedStatus);
		}

		if (this.selectedTheatreId) {
			filtered = filtered.filter(
				(hall) => hall.theatreId === this.selectedTheatreId
			);
		}

		if (this.selectedType) {
			filtered = filtered.filter((hall) => hall.type === this.selectedType);
		}

		// Apply sorting
		filtered = this.sortHalls(filtered);

		this.filteredHalls = filtered;
	}

	private sortHalls(halls: Hall[]): Hall[] {
		const [field, order] = this.selectedSort.split('_');

		return halls.sort((a, b) => {
			let comparison = 0;

			switch (field) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'capacity':
					comparison = a.capacity - b.capacity;
					break;
				case 'type':
					comparison = a.type.localeCompare(b.type);
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

	toggleSelection(id: string): void {
		const newSelection = [...this.selectedItems];
		const index = newSelection.indexOf(id);

		if (index > -1) {
			newSelection.splice(index, 1);
		} else {
			newSelection.push(id);
		}

		this.selectedItems = newSelection;
	}

	areAllItemsSelected(): boolean {
		return (
			this.filteredHalls.length > 0 &&
			this.filteredHalls.every((hall) => this.isSelected(hall.id))
		);
	}

	areSomeItemsSelected(): boolean {
		return (
			this.filteredHalls.some((hall) => this.isSelected(hall.id)) &&
			!this.areAllItemsSelected()
		);
	}

	toggleAllSelection(): void {
		let newSelection = [...this.selectedItems];

		if (this.areAllItemsSelected()) {
			// Remove all filtered halls from selection
			newSelection = newSelection.filter(
				(id) => !this.filteredHalls.find((hall) => hall.id === id)
			);
		} else {
			// Add all filtered halls to selection
			this.filteredHalls.forEach((hall) => {
				if (!this.isSelected(hall.id)) {
					newSelection.push(hall.id);
				}
			});
		}

		this.selectedItems = newSelection;
	}

	clearSelection(): void {
		this.selectedItems = [];
	}

	// Hall Actions
	onHallEdit(hall: Hall): void {
		// Open edit dialog - would need to create AdminHallEditComponent
		console.log('Edit hall:', hall);
	}

	onHallView(hall: Hall): void {
		// Open view dialog - would need to create AdminHallViewComponent
		console.log('View hall:', hall);
	}

	onHallDelete(hall: Hall): void {
		if (confirm(`Are you sure you want to delete "${hall.name}"?`)) {
			this.theatreService
				.deleteHall(hall.id)
				.pipe(takeUntil(this.destroy$))
				.subscribe(() => {
					this.loadData(); // Refresh data
				});
		}
	}

	onAddHall(theatreId: string = ''): void {
		// Open add hall dialog - would need to create AdminHallAddComponent
		console.log('Add new hall for theatre:', theatreId);
	}

	// Bulk Actions
	onBulkStatusUpdate(status: HallStatus): void {
		if (this.selectedItems.length === 0) return;

		this.theatreService
			.bulkUpdateHallStatus(this.selectedItems, status)
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.loadData();
				this.clearSelection();
			});
	}

	onBulkDelete(): void {
		if (this.selectedItems.length === 0) return;

		const hallNames = this.halls
			.filter((h) => this.selectedItems.includes(h.id))
			.map((h) => h.name)
			.join(', ');

		if (confirm(`Are you sure you want to delete these halls: ${hallNames}?`)) {
			// Delete each hall individually since there's no bulk delete method
			const deletePromises = this.selectedItems.map((id) =>
				this.theatreService.deleteHall(id).toPromise()
			);

			Promise.all(deletePromises)
				.then(() => {
					console.log(
						`${this.selectedItems.length} halls deleted successfully`
					);
					this.loadData();
					this.clearSelection();
				})
				.catch((error) => {
					console.error('Error deleting halls:', error);
				});
		}
	}

	onViewHallLayout(hall: Hall): void {
		this.ref = this.dialogService.open(AdminHallViewLayoutComponent, {
			header: hall.name,
			showHeader: false,
			dismissableMask: true,
			closable: true,
			data: {
				...hall,
			},
		});
	}

	// Utility Methods
	getHallStatusSeverity(status: HallStatus): string {
		switch (status) {
			case HallStatus.ACTIVE:
				return 'success';
			case HallStatus.INACTIVE:
				return 'secondary';
			case HallStatus.MAINTENANCE:
				return 'warning';
			case HallStatus.CLEANING:
				return 'help';
			case HallStatus.BOOKED:
				return 'contrast';
			default:
				return 'secondary';
		}
	}

	getHallTypeSeverity(type: HallType): string {
		switch (type) {
			case HallType.STANDARD:
				return 'secondary';
			case HallType.PREMIUM:
				return 'warning';
			case HallType.IMAX:
				return 'danger';
			case HallType.DOLBY_ATMOS:
				return 'info';
			case HallType.VIP:
				return 'success';
			case HallType.DRIVE_IN:
				return 'help';
			default:
				return 'secondary';
		}
	}

	getTheatreById(id: string): Theatre | undefined {
		return this.theatres.find((theatre) => theatre.id === id);
	}

	getSeatCategoryColor(category: string): string {
		const colors: { [key: string]: string } = {
			ECONOMY: '#10b981',
			PREMIUM: '#f59e0b',
			EXECUTIVE: '#8b5cf6',
			VIP: '#ef4444',
			RECLINER: '#06b6d4',
		};
		return colors[category] || '#94a3b8';
	}

	trackByHallId(index: number, hall: Hall): string {
		return hall.id;
	}

	hasFeature(hall: Hall, feature: HallFeature): boolean {
		return hall.features.includes(feature);
	}

	getProjectionTypeDisplayName(type: ProjectionType): string {
		return type
			.replace('_', ' ')
			.toLowerCase()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	getSoundSystemDisplayName(system: SoundSystem): string {
		return system
			.replace('_', ' ')
			.toLowerCase()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
}
