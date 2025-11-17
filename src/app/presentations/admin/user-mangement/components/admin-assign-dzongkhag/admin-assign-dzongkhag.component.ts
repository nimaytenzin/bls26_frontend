import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import {
	User,
	SupervisorDzongkhagAssignment,
	Supervisor,
} from '../../../../../core/dataservice/auth/auth.interface';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';

@Component({
	selector: 'app-admin-assign-dzongkhag',
	templateUrl: './admin-assign-dzongkhag.component.html',
	styleUrls: ['./admin-assign-dzongkhag.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
})
export class AdminAssignDzongkhagComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	supervisor!: Supervisor;
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhags: Dzongkhag[] = [];
	initialAssignments: number[] = [];
	loading = false;
	saving = false;

	constructor(
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private authService: AuthService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		this.supervisor = this.config.data.supervisor;
		this.loadData();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load dzongkhags and current assignments
	 */
	private loadData(): void {
		this.loading = true;

		// Load all dzongkhags
		this.dzongkhagService
			.findAllDzongkhags()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (dzongkhags) => {
					this.dzongkhags = dzongkhags;

					// If supervisor has dzongkhags already loaded, use them
					if (
						this.supervisor.dzongkhags &&
						this.supervisor.dzongkhags.length > 0
					) {
						const assignedIds = this.supervisor.dzongkhags.map((dz) => dz.id);
						this.initialAssignments = [...assignedIds];

						// Set selected dzongkhags based on supervisor's assignments
						this.selectedDzongkhags = this.dzongkhags.filter((dz) =>
							assignedIds.includes(dz.id)
						);
					} else {
						// Fallback: Load assignments from API
						this.loadAssignments();
					}
				},
				error: (error) => {
					console.error('Error loading dzongkhags:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load dzongkhags',
					});
				},
			});
	}

	/**
	 * Load current dzongkhag assignments for supervisor from API
	 */
	private loadAssignments(): void {
		this.authService
			.getSupervisorDzongkhagAssignments(this.supervisor.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (assignments: SupervisorDzongkhagAssignment[]) => {
					const assignedDzongkhagIds = assignments.map((a) => a.dzongkhagId);
					this.initialAssignments = [...assignedDzongkhagIds];

					// Set initial selected dzongkhags
					this.selectedDzongkhags = this.dzongkhags.filter((dz) =>
						assignedDzongkhagIds.includes(dz.id)
					);
				},
				error: (error) => {
					console.error('Error loading assignments:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load current assignments',
					});
				},
			});
	}

	/**
	 * Save dzongkhag assignments
	 */
	saveAssignments(): void {
		const selectedIds = this.selectedDzongkhags.map((d) => d.id);
		const toAssign = selectedIds.filter(
			(id) => !this.initialAssignments.includes(id)
		);
		const toRemove = this.initialAssignments.filter(
			(id) => !selectedIds.includes(id)
		);

		// If no changes, just close
		if (toAssign.length === 0 && toRemove.length === 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'No Changes',
				detail: 'No changes to save',
			});
			return;
		}

		this.saving = true;

		// Process removals first, then assignments
		const removePromise =
			toRemove.length > 0
				? this.authService
						.removeDzongkhagsFromSupervisor(this.supervisor.id, toRemove)
						.pipe(takeUntil(this.destroy$))
						.toPromise()
				: Promise.resolve(null);

		removePromise
			.then(() => {
				if (toAssign.length > 0) {
					return this.authService
						.assignDzongkhagsToSupervisor(this.supervisor.id, toAssign)
						.pipe(takeUntil(this.destroy$))
						.toPromise();
				}
				return null;
			})
			.then(() => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Dzongkhag assignments updated successfully',
				});
				this.ref.close(true);
			})
			.catch((error) => {
				console.error('Error saving assignments:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error.error?.message || 'Failed to update assignments',
				});
			})
			.finally(() => {
				this.saving = false;
			});
	}

	/**
	 * Cancel and close dialog
	 */
	cancel(): void {
		this.ref.close(false);
	}

	/**
	 * Check if there are unsaved changes
	 */
	hasUnsavedChanges(): boolean {
		const selectedIds = this.selectedDzongkhags.map((d) => d.id);
		const currentIds = this.initialAssignments;

		if (selectedIds.length !== currentIds.length) {
			return true;
		}

		return !selectedIds.every((id) => currentIds.includes(id));
	}

	/**
	 * Check if a dzongkhag is currently assigned
	 */
	isAssigned(dzongkhag: Dzongkhag): boolean {
		return this.initialAssignments.includes(dzongkhag.id);
	}
}
