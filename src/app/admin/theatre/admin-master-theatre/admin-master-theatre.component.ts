// Admin Master Theatre Component - Tab Container for Theatre and Hall Management

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../primeng.modules';
import { AdminTheatreListingComponent } from '../admin-theatre-listing/admin-theatre-listing.component';
import { AdminHallListingComponent } from '../admin-hall-listing/admin-hall-listing.component';

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
	selector: 'app-admin-master-theatre',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
		AdminTheatreListingComponent,
		AdminHallListingComponent,
	],
	templateUrl: './admin-master-theatre.component.html',
	styleUrls: ['./admin-master-theatre.component.scss'],
	providers: [DialogService],
})
export class AdminMasterTheatreComponent implements OnInit, OnDestroy {
	ref: DynamicDialogRef | undefined;

	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	// UI State
	searchQuery = '';
	activeTab: 'theatres' | 'halls' = 'theatres';
	viewMode: 'grid' | 'list' | 'table' = 'grid';
	showFilters = false;
	activeFiltersCount = 0;

	// View Options
	viewModeOptions: ViewModeOption[] = [
		{ label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
		{ label: 'List', value: 'list', icon: 'pi pi-list' },
		{ label: 'Table', value: 'table', icon: 'pi pi-table' },
	];

	tabOptions = [
		{ label: 'Theaters', value: 'theatres', icon: 'fas fa-building' },
		{ label: 'Halls', value: 'halls', icon: 'fas fa-door-open' },
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

	selectedSort = 'name_asc';

	// Dialog States
	showTheatreDialog = false;
	showHallDialog = false;
	showTheatreDetail = false;
	showHallDetail = false;
	isEditMode = false;

	// UI State Properties for template
	searchTerm = '';
	selectedStatus = '';
	selectedLocation = '';
	selectedTheatreId = '';
	viewModeTemplate: 'grid' | 'list' | 'table' = 'grid';
	selectedItems: string[] = [];
	contextMenu = {
		visible: false,
		x: 0,
		y: 0,
		item: null as any,
	};
	showCreateEditDialog = false;
	statistics = {
		totalTheatres: 2,
		totalHalls: 4,
		totalSeats: 332,
		averageRating: 3.2,
	};

	//

	constructor() {}

	ngOnInit(): void {}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	// Search Setup

	onSearchChange(query: string): void {
		this.searchSubject.next(query);
	}

	// UI Actions
	onTabChange(tab: 'theatres' | 'halls'): void {
		this.activeTab = tab;
	}

	onViewModeChange(): void {
		// Handle view mode change
	}

	toggleFilters(): void {
		this.showFilters = !this.showFilters;
	}

	clearSearch(): void {
		this.searchQuery = '';
		this.searchSubject.next('');
	}

	// Template Methods
	setActiveTab(tab: 'theatres' | 'halls'): void {
		this.activeTab = tab;
	}

	onSearch(): void {
		this.searchSubject.next(this.searchTerm);
	}

	clearSearchTemplate(): void {
		this.searchTerm = '';
		this.onSearch();
	}
}
