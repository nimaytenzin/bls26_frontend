import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { PrimeNgModules } from '../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import {
	EnumerationArea,
	PaginatedResponse,
} from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

type RbaTab = 'all' | 'urban' | 'rural';

@Component({
	selector: 'app-admin-rba-eas',
	templateUrl: './admin-rba-eas.component.html',
	styleUrls: ['./admin-rba-eas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminRbaEasComponent implements OnInit {
	@ViewChild('dt') table!: Table;

	activeTabIndex = 0;
	activeTab: RbaTab = 'all';
	rbaEas: EnumerationArea[] = [];
	totalRecords = 0;
	loading = false;
	downloadingAll = false;
	downloadingUrban = false;
	downloadingRural = false;

	rowsPerPage = 10;
	rowsPerPageOptions = [10, 25, 50, 100];
	currentPage = 1;
	globalFilterValue = '';

	constructor(
		private eaService: EnumerationAreaDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit(): void {
		this.loadRbaEas();
	}

	onTabChange(event: { index: number }): void {
		const index = event.index;
		this.activeTabIndex = index;
		this.activeTab = index === 0 ? 'all' : index === 1 ? 'urban' : 'rural';
		this.currentPage = 1;
		this.loadRbaEas();
	}

	loadRbaEas(event?: TableLazyLoadEvent): void {
		this.loading = true;

		const page = event ? (event.first! / event.rows!) + 1 : this.currentPage;
		const limit = event ? event.rows! : this.rowsPerPage;

		this.currentPage = page;
		this.rowsPerPage = limit;

		const includeSaz = true;
		const sortBy = 'name';
		const sortOrderStr = 'ASC';
		const search = this.globalFilterValue?.trim() || undefined;
		const req =
			this.activeTab === 'all'
				? this.eaService.findAllRbaPaginated(
						page,
						limit,
						sortBy,
						sortOrderStr,
						includeSaz,
						search
					)
				: this.activeTab === 'urban'
					? this.eaService.findAllUrbanRbaPaginated(
							page,
							limit,
							sortBy,
							sortOrderStr,
							includeSaz,
							search
						)
					: this.eaService.findAllRuralRbaPaginated(
							page,
							limit,
							sortBy,
							sortOrderStr,
							includeSaz,
							search
						);

		req.subscribe({
			next: (res: PaginatedResponse<EnumerationArea>) => {
				this.rbaEas = res.data;
				this.totalRecords = res.meta.totalItems;
				this.loading = false;
			},
			error: (err) => {
				console.error('Error loading RBA EAs:', err);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load RBA enumeration areas',
					life: 3000,
				});
				this.loading = false;
			},
		});
	}

	onLazyLoad(event: TableLazyLoadEvent): void {
		this.loadRbaEas(event);
	}

	onGlobalFilter(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.globalFilterValue = value;
		this.currentPage = 1;
		// Reload from server with search (dzongkhag code, EA name, description)
		this.loadRbaEas({
			first: 0,
			rows: this.rowsPerPage,
		} as TableLazyLoadEvent);
	}

	getZoneTypes(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const types = new Set(
			ea.subAdministrativeZones
				.map((s: SubAdministrativeZone) => s.administrativeZone?.type)
				.filter(Boolean)
		);
		return Array.from(types).join(', ') || '—';
	}

	getDzongkhagNames(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const names = new Set(
			ea.subAdministrativeZones
				.map((s: SubAdministrativeZone) => s.administrativeZone?.dzongkhag?.name)
				.filter(Boolean)
		);
		return Array.from(names).join(', ') || '—';
	}

	getGewogThromde(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const names = new Set(
			ea.subAdministrativeZones
				.map((s: SubAdministrativeZone) => s.administrativeZone?.name)
				.filter(Boolean)
		);
		return Array.from(names).join(', ') || '—';
	}

	getChiwogLap(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const names = ea.subAdministrativeZones.map((s: SubAdministrativeZone) => s.name);
		return names.join(', ') || '—';
	}

	getDzongkhagCodes(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const codes = new Set(
			ea.subAdministrativeZones
				.map((s: SubAdministrativeZone) => s.administrativeZone?.dzongkhag?.areaCode)
				.filter(Boolean)
		);
		return Array.from(codes).join(', ') || '—';
	}

	getGewogThromdeCodes(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const codes = new Set(
			ea.subAdministrativeZones
				.map((s: SubAdministrativeZone) => s.administrativeZone?.areaCode)
				.filter(Boolean)
		);
		return Array.from(codes).join(', ') || '—';
	}

	getChiwogLapCodes(ea: EnumerationArea): string {
		if (!ea.subAdministrativeZones?.length) return '—';
		const codes = ea.subAdministrativeZones
			.map((s: SubAdministrativeZone) => s.areaCode || '—')
			.filter(Boolean);
		return codes.join(', ') || '—';
	}

	confirmUnmarkRba(ea: EnumerationArea, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Remove "${ea.name}" (${ea.areaCode}) from RBA (sensitive) list?`,
			header: 'Unmark as RBA',
			icon: 'pi pi-question-circle',
			acceptButtonStyleClass: 'p-button-warning',
			accept: () => this.unmarkAsRba(ea.id),
		});
	}

	unmarkAsRba(id: number): void {
		this.eaService.unmarkAsRba(id).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'EA unmarked as RBA',
					life: 3000,
				});
				this.loadRbaEas();
			},
			error: (err) => {
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: err.error?.message || 'Failed to unmark EA as RBA',
					life: 3000,
				});
			},
		});
	}

	get tabTitle(): string {
		return this.activeTab === 'all'
			? 'All RBA EAs'
			: this.activeTab === 'urban'
				? 'Urban (Thromde) RBA EAs'
				: 'Rural (Gewog) RBA EAs';
	}

	private triggerBlobDownload(blob: Blob, filename: string): void {
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		window.URL.revokeObjectURL(url);
	}

	downloadRbaExcel(): void {
		this.downloadingAll = true;
		this.eaService.downloadRbaExcel().subscribe({
			next: (blob) => {
				this.triggerBlobDownload(blob, `rba-enumeration-areas-${Date.now()}.xlsx`);
				this.messageService.add({
					severity: 'success',
					summary: 'Downloaded',
					detail: 'All RBA EAs Excel file downloaded',
					life: 3000,
				});
				this.downloadingAll = false;
			},
			error: () => {
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download All RBA Excel',
					life: 3000,
				});
				this.downloadingAll = false;
			},
		});
	}

	downloadUrbanRbaExcel(): void {
		this.downloadingUrban = true;
		this.eaService.downloadUrbanRbaExcel().subscribe({
			next: (blob) => {
				this.triggerBlobDownload(blob, `rba-urban-enumeration-areas-${Date.now()}.xlsx`);
				this.messageService.add({
					severity: 'success',
					summary: 'Downloaded',
					detail: 'Urban RBA EAs Excel file downloaded',
					life: 3000,
				});
				this.downloadingUrban = false;
			},
			error: () => {
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download Urban RBA Excel',
					life: 3000,
				});
				this.downloadingUrban = false;
			},
		});
	}

	downloadRuralRbaExcel(): void {
		this.downloadingRural = true;
		this.eaService.downloadRuralRbaExcel().subscribe({
			next: (blob) => {
				this.triggerBlobDownload(blob, `rba-rural-enumeration-areas-${Date.now()}.xlsx`);
				this.messageService.add({
					severity: 'success',
					summary: 'Downloaded',
					detail: 'Rural RBA EAs Excel file downloaded',
					life: 3000,
				});
				this.downloadingRural = false;
			},
			error: () => {
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download Rural RBA Excel',
					life: 3000,
				});
				this.downloadingRural = false;
			},
		});
	}
}
