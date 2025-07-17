import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { TheatreDataService } from '../../../../../core/dataservice/theatre/theatre.dataservice';
import { Screening } from '../../../../../core/dataservice/screening/screening.interface';
import { Theatre } from '../../../../../core/dataservice/theatre/theatre.interface';
import { PaginatedData } from '../../../../../core/utility/pagination.interface';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
	selector: 'app-admin-screenings-by-theatre',
	templateUrl: './admin-screenings-by-theatre.component.html',
	styleUrls: ['./admin-screenings-by-theatre.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
})
export class AdminScreeningsByTheatreComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	screenings: Screening[] = [];
	theatreId: number | null = null;
	theatreDetails: Theatre | null = null;
	// Pagination
	currentPage = 1;
	pageSize = 10;
	totalRecords = 0;
	loading = false;

	constructor(
		private screeningService: ScreeningDataService,
		private theatreService: TheatreDataService,
		private config: DynamicDialogConfig
	) {
		this.theatreId = this.config.data?.theatreId || null;
	}

	ngOnInit() {
		// this.theatreService
		this.loadScreenings();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadScreenings(): void {
		if (!this.theatreId) return;

		this.loading = true;
		this.screeningService
			.getScreeningsByTheatrePaginated(
				this.theatreId,
				this.currentPage,
				this.pageSize
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: PaginatedData<Screening>) => {
					this.screenings = response.data;
					this.totalRecords = response.pagination.totalCount;
					this.loading = false;
				},
				error: (error: any) => {
					console.error('Error loading screenings:', error);
					this.loading = false;
				},
			});
	}

	onTheatreChange(): void {
		this.currentPage = 1;
		this.loadScreenings();
	}

	onPageChange(event: any): void {
		this.currentPage = event.page + 1;
		this.pageSize = event.rows;
		this.loadScreenings();
	}

	formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	}

	formatTime(timeString: string): string {
		if (!timeString) return '';
		const time = new Date(`1970-01-01T${timeString}`);
		return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
}
