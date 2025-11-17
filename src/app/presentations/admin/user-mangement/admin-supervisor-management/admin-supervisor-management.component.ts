import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AuthService } from '../../../../core/dataservice/auth/auth.service';
import {
	User,
	UserRole,
	Supervisor,
} from '../../../../core/dataservice/auth/auth.interface';

// Import shared components
import { AdminAssignDzongkhagComponent } from '../components/admin-assign-dzongkhag/admin-assign-dzongkhag.component';
import { AdminUserCreateComponent } from '../components/admin-user-create/admin-user-create.component';
import { AdminUserUpdateComponent } from '../components/admin-user-update/admin-user-update.component';

@Component({
	selector: 'app-admin-supervisor-management',
	templateUrl: './admin-supervisor-management.component.html',
	styleUrls: ['./admin-supervisor-management.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminSupervisorManagementComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data properties
	supervisors: Supervisor[] = [];
	loading = false;
	totalRecords = 0;

	// Search and filter properties
	searchValue = '';

	// Table properties
	first = 0;
	rows = 10;

	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService
	) {}

	ngOnInit(): void {
		this.loadSupervisors();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load all supervisors with their assigned dzongkhags
	 */
	loadSupervisors(): void {
		this.loading = true;
		this.authService
			.getAllSupervisorsWithDzongkhags()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (supervisors) => {
					this.supervisors = supervisors;
					this.totalRecords = supervisors.length;
				},
				error: (error) => {
					console.error('Error loading supervisors:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load supervisors',
					});
				},
			});
	}

	/**
	 * Open dialog to create new supervisor
	 */
	openCreateDialog(): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserCreateComponent,
			{
				header: 'Create New Supervisor',

				data: {
					userType: UserRole.SUPERVISOR,
				},
			}
		);

		ref.onClose.subscribe((result) => {
			if (result) {
				this.loadSupervisors();
			}
		});
	}

	/**
	 * Open dialog to edit supervisor
	 */
	openEditDialog(supervisor: User): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserUpdateComponent,
			{
				header: 'Edit Supervisor',

				data: {
					user: supervisor,
					userType: UserRole.SUPERVISOR,
				},
			}
		);

		ref.onClose.subscribe((result) => {
			if (result) {
				this.loadSupervisors();
			}
		});
	}

	/**
	 * Open dialog to manage dzongkhag assignments
	 */
	openAssignDzongkhagDialog(supervisor: Supervisor): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminAssignDzongkhagComponent,
			{
				header: 'Manage Dzongkhag Assignments',
				width: '700px',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					supervisor: supervisor,
				},
			}
		);

		ref.onClose.subscribe((result) => {
			if (result) {
				// Reload supervisors to reflect changes
				this.loadSupervisors();
			}
		});
	}

	/**
	 * Delete supervisor with confirmation
	 */
	deleteSupervisor(supervisor: User, event: Event): void {
		this.confirmationService.confirm({
			message: `Are you sure you want to delete ${supervisor.name}? This action cannot be undone.`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.authService
					.deleteUser(supervisor.id)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: () => {
							this.supervisors = this.supervisors.filter(
								(s) => s.id !== supervisor.id
							);
							this.totalRecords = this.supervisors.length;
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: 'Supervisor deleted successfully',
							});
						},
						error: (error) => {
							console.error('Error deleting supervisor:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: error.error?.message || 'Failed to delete supervisor',
							});
						},
					});
			},
		});
	}

	/**
	 * Filter supervisors by search value
	 */
	filterSupervisors(dt: any): void {
		dt.filterGlobal(this.searchValue, 'contains');
	}

	/**
	 * Clear search filter
	 */
	clearSearch(dt: any): void {
		this.searchValue = '';
		dt.clear();
	}

	/**
	 * Format date for display
	 */
	formatDate(date: Date | string | undefined): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get status severity for tags
	 */
	getStatusSeverity(isVerified: boolean | undefined): string {
		return isVerified ? 'success' : 'warning';
	}

	/**
	 * Get access severity for tags
	 */
	getAccessSeverity(hasAccess: boolean | undefined): string {
		return hasAccess ? 'success' : 'danger';
	}

	/**
	 * Get dzongkhag names for display
	 */
	getDzongkhagNames(supervisor: Supervisor): string {
		if (!supervisor.dzongkhags || supervisor.dzongkhags.length === 0) {
			return 'None';
		}
		return supervisor.dzongkhags.map((dz) => dz.name).join(', ');
	}
}
