import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PrimeNgModules } from '../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import { StructureService } from '../../../core/dataservice/structure/structure.service';
import { HouseholdListingService } from '../../../core/dataservice/household-listing/household-listing.service';
import type { Structure } from '../../../core/dataservice/structure/structure.service';
import type { CreateHouseholdListingDto } from '../../../core/dataservice/household-listing/household-listing.service';

@Component({
	selector: 'app-enumerator-household-form',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './enumerator-household-form.component.html',
	styleUrls: ['./enumerator-household-form.component.scss'],
})
export class EnumeratorHouseholdFormComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	eaId!: number;
	householdId: number | null = null;
	structureId: number | null = null;
	structures: Structure[] = [];
	loading = true;
	submitting = false;

	form: CreateHouseholdListingDto = {
		structureId: 0,
		userId: 0,
		householdIdentification: '',
		householdSerialNumber: 1,
		nameOfHOH: '',
		totalMale: 0,
		totalFemale: 0,
		phoneNumber: '',
		remarks: '',
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private authService: AuthService,
		private structureService: StructureService,
		private householdService: HouseholdListingService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		const user = this.authService.getCurrentUser();
		if (!user) {
			this.router.navigate(['/auth/login']);
			return;
		}
		this.form.userId = user.id;

		this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
			this.eaId = +params['eaId'];
			this.structureId = params['structureId'] ? +params['structureId'] : null;
			this.householdId = params['householdId'] && params['householdId'] !== 'new' ? +params['householdId'] : null;
			if (this.eaId) this.load();
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	load(): void {
		this.loading = true;
		this.structureService
			.getAll(this.eaId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (list) => {
					this.structures = list;
					if (this.householdId) {
						this.loadHousehold();
					} else {
						this.form.structureId = this.structureId ?? (this.structures[0]?.id ?? 0);
						this.loadNextSerial();
						this.loading = false;
					}
				},
				error: () => {
					this.loading = false;
				},
			});
	}

	loadHousehold(): void {
		if (!this.householdId) return;
		this.householdService
			.getById(this.householdId)
			.pipe(takeUntil(this.destroy$), finalize(() => (this.loading = false)))
			.subscribe({
				next: (h) => {
					this.form = {
						structureId: h.structureId,
						userId: h.userId,
						householdIdentification: h.householdIdentification ?? '',
						householdSerialNumber: h.householdSerialNumber,
						nameOfHOH: h.nameOfHOH ?? '',
						totalMale: h.totalMale ?? 0,
						totalFemale: h.totalFemale ?? 0,
						phoneNumber: h.phoneNumber ?? '',
						remarks: h.remarks ?? '',
					};
				},
				error: (err) => {
					this.messageService.add({ severity: 'error', summary: err.error?.message || 'Failed to load household', life: 3000 });
				},
			});
	}

	loadNextSerial(): void {
		const sid = this.form.structureId || this.structureId;
		if (!sid) return;
		this.householdService
			.getByStructure(sid)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (list) => {
					const max = list.length ? Math.max(...list.map((h) => h.householdSerialNumber)) : 0;
					this.form.householdSerialNumber = max + 1;
				},
			});
	}

	onStructureChange(): void {
		if (!this.householdId) this.loadNextSerial();
	}

	submit(): void {
		if (!this.form.structureId || !this.form.householdIdentification?.trim() || !this.form.nameOfHOH?.trim()) {
			this.messageService.add({ severity: 'warn', summary: 'Fill required fields', life: 3000 });
			return;
		}
		this.submitting = true;
		if (this.householdId) {
			this.householdService
				.update(this.householdId, {
					structureId: this.form.structureId,
					householdIdentification: this.form.householdIdentification.trim(),
					householdSerialNumber: this.form.householdSerialNumber,
					nameOfHOH: this.form.nameOfHOH.trim(),
					totalMale: this.form.totalMale,
					totalFemale: this.form.totalFemale,
					phoneNumber: this.form.phoneNumber || undefined,
					remarks: this.form.remarks || undefined,
				})
				.pipe(takeUntil(this.destroy$), finalize(() => (this.submitting = false)))
				.subscribe({
					next: () => {
						this.messageService.add({ severity: 'success', summary: 'Household updated', life: 3000 });
						this.router.navigate(['/enumerator/ea', this.eaId, 'households']);
					},
					error: (err) =>
						this.messageService.add({ severity: 'error', summary: err.error?.message || 'Update failed', life: 3000 }),
				});
		} else {
			this.householdService
				.create({
					structureId: this.form.structureId,
					userId: this.form.userId,
					householdIdentification: this.form.householdIdentification.trim(),
					householdSerialNumber: this.form.householdSerialNumber,
					nameOfHOH: this.form.nameOfHOH.trim(),
					totalMale: this.form.totalMale,
					totalFemale: this.form.totalFemale,
					phoneNumber: this.form.phoneNumber || undefined,
					remarks: this.form.remarks || undefined,
				})
				.pipe(takeUntil(this.destroy$), finalize(() => (this.submitting = false)))
				.subscribe({
					next: () => {
						this.messageService.add({ severity: 'success', summary: 'Household added', life: 3000 });
						this.router.navigate(['/enumerator/ea', this.eaId, 'households']);
					},
					error: (err) =>
						this.messageService.add({ severity: 'error', summary: err.error?.message || 'Create failed', life: 3000 }),
				});
		}
	}

	cancel(): void {
		this.router.navigate(['/enumerator/ea', this.eaId, 'households']);
	}

	get isEdit(): boolean {
		return this.householdId != null;
	}
}
