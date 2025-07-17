import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntil, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../primeng.modules';
import { TheatreDataService } from '../../../../core/dataservice/theatre/theatre.dataservice';
import { HallDataService } from '../../../../core/dataservice/hall/hall.dataservice';
import { BASEAPI_URL } from '../../../../core/constants/constants';

// Import component dialogs
import { AdminTheatreAddWithImageComponent } from '../admin-theatre-listing/components/admin-theatre-add-with-image/admin-theatre-add-with-image.component';
import { AdminTheatreEditComponent } from '../admin-theatre-listing/components/admin-theatre-edit/admin-theatre-edit.component';
import { AdminHallAddComponent } from '../admin-theatre-listing/components/admin-hall-add/admin-hall-add.component';
import { AdminHallEditComponent } from '../admin-theatre-listing/components/admin-hall-edit/admin-hall-edit.component';

import { Theatre } from '../../../../core/dataservice/theatre/theatre.interface';
import { Hall } from '../../../../core/dataservice/hall/hall.interface';
import { AdminTheatreListingComponent } from '../admin-theatre-listing/admin-theatre-listing.component';

interface Statistics {
	totalTheatres: number;
	totalHalls: number;
	totalSeats: number;
	activeTheatres: number;
}

@Component({
	selector: 'app-admin-master-theatre',
	templateUrl: './admin-master-theatre.component.html',
	styleUrls: ['./admin-master-theatre.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		PrimeNgModules,
		AdminTheatreListingComponent,
	],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminMasterTheatreComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	ref: DynamicDialogRef | undefined;

	// Data
	theatres: Theatre[] = [];
	halls: Hall[] = [];
	filteredTheatres: Theatre[] = [];
	filteredHalls: Hall[] = [];

	// UI State
	loading = false;
	activeTabIndex = 0; // 0 = Theatres, 1 = Halls

	// Forms
	filterForm!: FormGroup;

	// Statistics
	statistics: Statistics = {
		totalTheatres: 0,
		totalHalls: 0,
		totalSeats: 0,
		activeTheatres: 0,
	};

	// Filter options
	statusOptions = [
		{ label: 'All Statuses', value: '' },
		{ label: 'Active', value: 'ACTIVE' },
		{ label: 'Inactive', value: 'INACTIVE' },
		{ label: 'Maintenance', value: 'MAINTENANCE' },
	];

	dzongkhags: any[] = [];

	constructor(
		private fb: FormBuilder,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService
	) {}

	ngOnInit(): void {}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
