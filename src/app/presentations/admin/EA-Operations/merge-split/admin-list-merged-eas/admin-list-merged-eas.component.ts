import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { PrimeNgModules } from '../../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { PaginatedResponse } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { EaMergeOperationComponent } from '../ea-merge-operation/ea-merge-operation.component';
import { EaHistoryViewerComponent } from '../../history-tracking/ea-history-viewer/ea-history-viewer.component';

@Component({
	selector: 'app-admin-list-merged-eas',
	templateUrl: './admin-list-merged-eas.component.html',
	styleUrls: ['./admin-list-merged-eas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, PrimeNgModules],
	providers: [MessageService, DialogService],
})
export class AdminListMergedEasComponent implements OnInit {
	@ViewChild('dt') table!: Table;

	// Data
	mergedEas: EnumerationArea[] = [];
	totalRecords = 0;
	loading = false;

	// Pagination
	rowsPerPage = 10;
	rowsPerPageOptions = [10, 25, 50, 100];
	currentPage = 1;

	// Sorting
	sortField = 'operationDate';
	sortOrder: number = -1; // -1 for DESC, 1 for ASC

	// Filter
	globalFilterValue = '';

	// Dialog refs
	mergeEaDialogRef: DynamicDialogRef | undefined;
	historyDialogRef: DynamicDialogRef | undefined;

	constructor(
		private enumerationAreaService: EnumerationAreaDataService,
		private messageService: MessageService,
		private dialogService: DialogService
	) {}

	ngOnInit() {
		// Initial load will be triggered by table lazy load
	}

	loadMergedEAs(event?: TableLazyLoadEvent) {
		this.loading = true;

		// Extract pagination and sorting from event
		const page = event ? (event.first! / event.rows!) + 1 : this.currentPage;
		const limit = event ? event.rows! : this.rowsPerPage;
		const sortField = event?.sortField || this.sortField;
		const sortOrder = event?.sortOrder === 1 ? 'ASC' : 'DESC';

		this.currentPage = page;
		this.rowsPerPage = limit;
		this.sortField = sortField as string;
		this.sortOrder = event?.sortOrder || this.sortOrder;

		this.enumerationAreaService
			.getMergedEAs(
				page,
				limit,
				sortField as string,
				sortOrder,
			)
			.subscribe({
				next: (response: PaginatedResponse<EnumerationArea>) => {
					this.mergedEas = response.data;
					this.totalRecords = response.meta.totalItems;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading merged EAs:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load merged enumeration areas',
						life: 3000,
					});
					this.loading = false;
				},
			});
	}

	onLazyLoad(event: TableLazyLoadEvent) {
		this.loadMergedEAs(event);
	}

	onGlobalFilter(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		this.globalFilterValue = value;
		this.table.filterGlobal(value, 'contains');
	}

	openMergeEaDialog() {
		this.mergeEaDialogRef = this.dialogService.open(EaMergeOperationComponent, {
			header: 'Merge Enumeration Areas',
			width: '90vw',
			style: { 'max-width': '1200px' },
			modal: true,
			dismissableMask: true,
			styleClass: 'p-fluid',
			data: {
				asDialog: true,
			},
		});

		this.mergeEaDialogRef.onClose.subscribe((result: any) => {
			if (result) {
				// Reload the table
				this.loadMergedEAs();
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Enumeration areas merged successfully',
					life: 3000,
				});
			}
		});
	}

	getSazNames(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones || ea.subAdministrativeZones.length === 0) {
			return '-';
		}
		return ea.subAdministrativeZones.map((saz) => saz.name).join(', ');
	}

	openHistoryDialog(eaId: number) {
		this.historyDialogRef = this.dialogService.open(EaHistoryViewerComponent, {
			header: 'EA History Viewer',
			modal: true,
			dismissableMask: true,
			styleClass: 'p-fluid',
			data: {
				eaId: eaId,
			},
		});
	}
}

