import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import { DzongkhagService } from '../../../../core/dataservice/dzongkhag/dzongkhag.service';
import { EnumerationAreaService } from '../../../../core/dataservice/enumeration-area/enumeration-area.service';
import type { Dzongkhag } from '../../../../core/dataservice/dzongkhag/dzongkhag.service';
import type { EnumerationArea, CreateEaDto, EaStatus } from '../../../../core/dataservice/enumeration-area/enumeration-area.service';

@Component({
	selector: 'app-admin-master-enumeration-areas',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
	templateUrl: './admin-master-enumeration-areas.component.html',
	styleUrls: ['./admin-master-enumeration-areas.component.css'],
})
export class AdminMasterEnumerationAreasComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	dzongkhags: Dzongkhag[] = [];
	enumerationAreas: EnumerationArea[] = [];
	selectedDzongkhagId: number | null = null;
	loading = false;
	showCreateDialog = false;
	showEditDialog = false;
	editingEa: EnumerationArea | null = null;
	saving = false;

	createForm: CreateEaDto = {
		name: '',
		description: '',
		areaCode: '',
		status: 'incomplete',
	};
	statusOptions: { label: string; value: EaStatus }[] = [
		{ label: 'Incomplete', value: 'incomplete' },
		{ label: 'In Progress', value: 'in_progress' },
		{ label: 'Completed', value: 'completed' },
	];

	constructor(
		private dzongkhagService: DzongkhagService,
		private eaService: EnumerationAreaService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit(): void {
		this.loadDzongkhags();
		this.load();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadDzongkhags(): void {
		this.dzongkhagService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
			next: (list) => (this.dzongkhags = list),
			error: () => {},
		});
	}

	load(): void {
		this.loading = true;
		const params = this.selectedDzongkhagId != null
			? { dzongkhagId: this.selectedDzongkhagId }
			: undefined;
		this.eaService
			.getAll(params)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (list) => (this.enumerationAreas = list),
				error: () => (this.enumerationAreas = []),
			});
	}

	onDzongkhagFilter(): void {
		this.load();
	}

	openCreate(): void {
		this.createForm = {
			dzongkhagId: this.selectedDzongkhagId ?? undefined,
			name: '',
			description: '',
			areaCode: '',
			status: 'incomplete',
		};
		this.showCreateDialog = true;
	}

	openEdit(ea: EnumerationArea): void {
		this.editingEa = ea;
		this.showEditDialog = true;
	}

	createEa(): void {
		if (!this.createForm.name?.trim() || !this.createForm.areaCode?.trim()) {
			this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and Area Code required' });
			return;
		}
		this.saving = true;
		this.eaService
			.create(this.createForm)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: () => {
					this.messageService.add({ severity: 'success', summary: 'Success', detail: 'EA created' });
					this.showCreateDialog = false;
					this.load();
				},
				error: (err) => {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: err.error?.message || 'Failed to create EA',
					});
				},
			});
	}

	updateStatus(ea: EnumerationArea, status: EaStatus): void {
		this.eaService
			.updateStatus(ea.id, status)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Status updated' });
					this.load();
				},
				error: (err) => {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: err.error?.message || 'Failed to update status',
					});
				},
			});
	}

	completeEa(ea: EnumerationArea, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Mark "${ea.name}" as completed?`,
			header: 'Complete EA',
			icon: 'pi pi-check',
			accept: () => {
				this.eaService.complete(ea.id).pipe(takeUntil(this.destroy$)).subscribe({
					next: () => {
						this.messageService.add({ severity: 'success', summary: 'Success', detail: 'EA completed' });
						this.load();
					},
					error: (err) => {
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: err.error?.message || 'Failed to complete EA',
						});
					},
				});
			},
		});
	}

	deleteEa(ea: EnumerationArea, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Delete "${ea.name}"? This cannot be undone.`,
			header: 'Delete EA',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.eaService.delete(ea.id).pipe(takeUntil(this.destroy$)).subscribe({
					next: () => {
						this.messageService.add({ severity: 'success', summary: 'Success', detail: 'EA deleted' });
						this.load();
					},
					error: (err) => {
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: err.error?.message || 'Failed to delete EA',
						});
					},
				});
			},
		});
	}

	getStatusSeverity(s: EaStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
		switch (s) {
			case 'completed': return 'success';
			case 'in_progress': return 'info';
			case 'incomplete': return 'warn';
			default: return 'secondary';
		}
	}
}
