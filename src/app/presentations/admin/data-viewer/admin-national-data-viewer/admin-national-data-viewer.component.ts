import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PrimeNgModules } from '../../../../primeng.modules';
import { DzongkhagService } from '../../../../core/dataservice/dzongkhag/dzongkhag.service';
import { EnumerationAreaService } from '../../../../core/dataservice/enumeration-area/enumeration-area.service';
import { StructureService } from '../../../../core/dataservice/structure/structure.service';
import { HouseholdListingService } from '../../../../core/dataservice/household-listing/household-listing.service';
import type { Dzongkhag } from '../../../../core/dataservice/dzongkhag/dzongkhag.service';
import type { EnumerationArea } from '../../../../core/dataservice/enumeration-area/enumeration-area.service';
import type { Structure } from '../../../../core/dataservice/structure/structure.service';
import type { HouseholdListing } from '../../../../core/dataservice/household-listing/household-listing.service';

type ViewMode = 'all' | 'dzongkhag' | 'ea';

@Component({
	selector: 'app-admin-national-data-viewer',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, PrimeNgModules],
	templateUrl: './admin-national-data-viewer.component.html',
	styleUrls: ['./admin-national-data-viewer.component.css'],
})
export class AdminNationalDataViewerComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	viewMode: ViewMode = 'all';

	// Filters
	dzongkhags: Dzongkhag[] = [];
	enumerationAreas: EnumerationArea[] = [];
	selectedDzongkhagId: number | null = null;
	selectedEaId: number | null = null;

	// Data
	structures: Structure[] = [];
	householdListings: HouseholdListing[] = [];
	loadingStructures = false;
	loadingHouseholds = false;
	loadingDzongkhags = false;
	loadingEas = false;

	// Pagination / display
	structurePage = 0;
	householdPage = 0;
	pageSize = 20;

	constructor(
		private dzongkhagService: DzongkhagService,
		private eaService: EnumerationAreaService,
		private structureService: StructureService,
		private householdService: HouseholdListingService
	) {}

	ngOnInit(): void {
		this.loadDzongkhags();
		this.loadDataForMode();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	get isAll(): boolean { return this.viewMode === 'all'; }
	get isDzongkhag(): boolean { return this.viewMode === 'dzongkhag'; }
	get isEa(): boolean { return this.viewMode === 'ea'; }

	setMode(mode: ViewMode): void {
		this.viewMode = mode;
		this.selectedDzongkhagId = null;
		this.selectedEaId = null;
		this.enumerationAreas = [];
		this.loadDataForMode();
	}

	loadDzongkhags(): void {
		this.loadingDzongkhags = true;
		this.dzongkhagService
			.getAll()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingDzongkhags = false))
			)
			.subscribe({
				next: (list) => (this.dzongkhags = list),
				error: () => {},
			});
	}

	onDzongkhagChange(): void {
		this.selectedEaId = null;
		this.enumerationAreas = [];
		if (this.selectedDzongkhagId != null) {
			this.loadingEas = true;
			this.eaService
				.getAll({ dzongkhagId: this.selectedDzongkhagId })
				.pipe(
					takeUntil(this.destroy$),
					finalize(() => (this.loadingEas = false))
				)
				.subscribe({
					next: (list) => (this.enumerationAreas = list),
					error: () => {},
				});
		}
		this.loadDataForMode();
	}

	onEaChange(): void {
		this.loadDataForMode();
	}

	loadDataForMode(): void {
		if (this.viewMode === 'dzongkhag') {
			this.loadStructuresThenHouseholds();
		} else {
			this.loadStructures();
			this.loadHouseholds();
		}
	}

	private loadStructuresThenHouseholds(): void {
		this.loadingStructures = true;
		this.structureService
			.getAll(undefined)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingStructures = false))
			)
			.subscribe({
				next: (list) => {
					if (this.selectedDzongkhagId != null && this.enumerationAreas.length) {
						const eaIds = this.enumerationAreas.map((e) => e.id);
						this.structures = list.filter((s) => eaIds.includes(s.enumerationAreaId));
					} else {
						this.structures = list;
					}
					this.loadHouseholds();
				},
				error: () => {
					this.structures = [];
					this.loadHouseholds();
				},
			});
	}

	loadStructures(): void {
		this.loadingStructures = true;
		let req = this.structureService.getAll(undefined);
		if (this.viewMode === 'ea' && this.selectedEaId != null) {
			req = this.structureService.getAll(this.selectedEaId);
		}
		req
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingStructures = false))
			)
			.subscribe({
				next: (list) => (this.structures = list),
				error: () => (this.structures = []),
			});
	}

	loadHouseholds(): void {
		this.loadingHouseholds = true;
		const params: { eaId?: number; structureId?: number } = {};
		if (this.viewMode === 'ea' && this.selectedEaId != null) {
			params.eaId = this.selectedEaId;
		}
		this.householdService
			.getAll(params)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingHouseholds = false))
			)
			.subscribe({
				next: (list) => {
					if (this.viewMode === 'dzongkhag' && this.structures.length) {
						const structureIds = new Set(this.structures.map((s) => s.id));
						this.householdListings = list.filter((h) => structureIds.has(h.structureId));
					} else {
						this.householdListings = list;
					}
				},
				error: () => (this.householdListings = []),
			});
	}

	refresh(): void {
		this.loadDzongkhags();
		if (this.selectedDzongkhagId != null) {
			this.eaService
				.getAll({ dzongkhagId: this.selectedDzongkhagId })
				.pipe(takeUntil(this.destroy$))
				.subscribe({ next: (list) => (this.enumerationAreas = list), error: () => {} });
		}
		this.loadDataForMode();
	}

	getStructurePaginated(): Structure[] {
		const start = this.structurePage * this.pageSize;
		return this.structures.slice(start, start + this.pageSize);
	}

	getHouseholdPaginated(): HouseholdListing[] {
		const start = this.householdPage * this.pageSize;
		return this.householdListings.slice(start, start + this.pageSize);
	}

	get totalStructurePages(): number {
		return Math.ceil(this.structures.length / this.pageSize) || 1;
	}
	get totalHouseholdPages(): number {
		return Math.ceil(this.householdListings.length / this.pageSize) || 1;
	}
}
