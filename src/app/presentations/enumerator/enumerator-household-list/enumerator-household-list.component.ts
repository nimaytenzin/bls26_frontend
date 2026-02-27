import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EnumerationAreaService } from '../../../core/dataservice/enumeration-area/enumeration-area.service';
import { StructureService } from '../../../core/dataservice/structure/structure.service';
import { HouseholdListingService } from '../../../core/dataservice/household-listing/household-listing.service';
import type { Structure } from '../../../core/dataservice/structure/structure.service';
import type { HouseholdListing } from '../../../core/dataservice/household-listing/household-listing.service';

interface StructureWithHouseholds extends Structure {
	householdListings: HouseholdListing[];
}

@Component({
	selector: 'app-enumerator-household-list',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
	templateUrl: './enumerator-household-list.component.html',
	styleUrls: ['./enumerator-household-list.component.scss'],
})
export class EnumeratorHouseholdListComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	eaId!: number;
	eaName = '';
	structures: StructureWithHouseholds[] = [];
	loading = true;
	searchQuery = '';
	filterStructureId: number | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private eaService: EnumerationAreaService,
		private structureService: StructureService,
		private householdService: HouseholdListingService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit(): void {
		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			this.eaId = +params['eaId'];
			this.filterStructureId = this.route.snapshot.queryParams['structureId']
				? +this.route.snapshot.queryParams['structureId']
				: null;
			if (this.eaId) this.load();
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	load(): void {
		this.loading = true;
		this.eaService
			.getById(this.eaId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (ea) => (this.eaName = ea.name),
				error: () => {},
			});

		this.structureService
			.getAll(this.eaId)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (structs) => {
					const withHouseholds: StructureWithHouseholds[] = structs.map((s) => ({
						...s,
						householdListings: [],
					}));
					if (withHouseholds.length === 0) {
						this.structures = [];
						return;
					}
					this.householdService
						.getAll({ eaId: this.eaId })
						.pipe(takeUntil(this.destroy$))
						.subscribe({
							next: (listings) => {
								withHouseholds.forEach((s) => {
									s.householdListings = listings.filter((h) => h.structureId === s.id);
								});
								this.structures = withHouseholds;
							},
							error: () => {
								this.structures = withHouseholds;
							},
						});
				},
				error: () => (this.structures = []),
			});
	}

	get filteredStructures(): StructureWithHouseholds[] {
		let list = this.structures;
		if (this.filterStructureId != null) {
			list = list.filter((s) => s.id === this.filterStructureId);
		}
		if (!this.searchQuery?.trim()) return list;
		const q = this.searchQuery.toLowerCase();
		return list
			.map((s) => ({
				...s,
				householdListings: s.householdListings.filter(
					(h) =>
						h.nameOfHOH?.toLowerCase().includes(q) ||
						h.householdIdentification?.toLowerCase().includes(q) ||
						String(h.householdSerialNumber).includes(q) ||
						h.phoneNumber?.toLowerCase().includes(q)
				),
			}))
			.filter((s) => s.householdListings.length > 0 || s.structureNumber?.toLowerCase().includes(q));
	}

	goBack(): void {
		this.router.navigate(['/enumerator/ea', this.eaId, 'map']);
	}

	goToMap(): void {
		this.router.navigate(['/enumerator/ea', this.eaId, 'map']);
	}

	addHousehold(structureId: number): void {
		this.router.navigate(['/enumerator/ea', this.eaId, 'household', 'new', structureId]);
	}

	editHousehold(householdId: number): void {
		this.router.navigate(['/enumerator/ea', this.eaId, 'household', householdId]);
	}

	deleteHousehold(h: HouseholdListing): void {
		this.confirmationService.confirm({
			message: `Delete household "${h.nameOfHOH}"?`,
			header: 'Confirm',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.householdService.delete(h.id).pipe(takeUntil(this.destroy$)).subscribe({
					next: () => {
						this.messageService.add({ severity: 'success', summary: 'Deleted', life: 3000 });
						this.load();
					},
					error: (err) =>
						this.messageService.add({
							severity: 'error',
							summary: err.error?.message || 'Delete failed',
							life: 3000,
						}),
				});
			},
				});
	}

	totalHouseholds(): number {
		return this.filteredStructures.reduce((sum, s) => sum + s.householdListings.length, 0);
	}

	totalPopulation(): number {
		return this.filteredStructures.reduce(
			(sum, s) =>
				sum + s.householdListings.reduce((s2, h) => s2 + (h.totalMale || 0) + (h.totalFemale || 0), 0),
			0
		);
	}
}
