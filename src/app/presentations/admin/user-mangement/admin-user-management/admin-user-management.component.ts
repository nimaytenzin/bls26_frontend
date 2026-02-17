import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { AdminUserResetPasswordComponent } from '../components/admin-user-reset-password/admin-user-reset-password.component';
import { AdminUserProfileViewComponent } from '../components/admin-user-profile-view/admin-user-profile-view.component';
import { AdminUserAdminListComponent } from '../components/admin-user-admin-list/admin-user-admin-list.component';
import { AdminUserSupervisorListComponent } from '../components/admin-user-supervisor-list/admin-user-supervisor-list.component';
import { AdminUserEnumeratorListComponent } from '../components/admin-user-enumerator-list/admin-user-enumerator-list.component';
import { AdminUserGeneralListComponent } from '../components/admin-user-general-list/admin-user-general-list.component';

@Component({
	selector: 'app-admin-user-management',
	templateUrl: './admin-user-management.component.html',
	styleUrls: ['./admin-user-management.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		PrimeNgModules,
		AdminUserAdminListComponent,
		AdminUserSupervisorListComponent,
		AdminUserEnumeratorListComponent,
		AdminUserGeneralListComponent,
	],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminUserManagementComponent implements OnInit, OnDestroy, AfterViewInit {
	private destroy$ = new Subject<void>();

	@ViewChild(AdminUserAdminListComponent) adminListRef!: AdminUserAdminListComponent;
	@ViewChild(AdminUserSupervisorListComponent) supervisorListRef!: AdminUserSupervisorListComponent;
	@ViewChild(AdminUserEnumeratorListComponent) enumeratorListRef!: AdminUserEnumeratorListComponent;
	@ViewChild(AdminUserGeneralListComponent) generalListRef!: AdminUserGeneralListComponent;

	selectedUser: User | Supervisor | null = null;

	// Counts and loading from child components (for header stats and Refresh button)
	adminsCount = 0;
	supervisorsCount = 0;
	enumeratorsCount = 0;
	generalUsersCount = 0;
	loadingAdmins = false;
	loadingSupervisors = false;
	loadingEnumerators = false;
	loadingGeneralUsers = false;

	// Search and filter
	searchValue = '';
	selectedRole: UserRole | null = null;

	// Active tab
	activeTabIndex = 0;

	// Expose enum to template
	UserRole = UserRole;

	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService,
		private cdr: ChangeDetectorRef
	) {}

	/** Defer child loading/count updates to next tick to avoid NG0100 ExpressionChangedAfterItHasBeenCheckedError */
	private deferUpdate(fn: () => void): void {
		setTimeout(fn, 0);
	}

	onLoadingAdminsChange(value: boolean): void {
		this.deferUpdate(() => {
			this.loadingAdmins = value;
			this.cdr.markForCheck();
		});
	}
	onLoadingSupervisorsChange(value: boolean): void {
		this.deferUpdate(() => {
			this.loadingSupervisors = value;
			this.cdr.markForCheck();
		});
	}
	onLoadingEnumeratorsChange(value: boolean): void {
		this.deferUpdate(() => {
			this.loadingEnumerators = value;
			this.cdr.markForCheck();
		});
	}
	onLoadingGeneralUsersChange(value: boolean): void {
		this.deferUpdate(() => {
			this.loadingGeneralUsers = value;
			this.cdr.markForCheck();
		});
	}
	onAdminsCountChange(value: number): void {
		this.deferUpdate(() => {
			this.adminsCount = value;
			this.cdr.markForCheck();
		});
	}
	onSupervisorsCountChange(value: number): void {
		this.deferUpdate(() => {
			this.supervisorsCount = value;
			this.cdr.markForCheck();
		});
	}
	onEnumeratorsCountChange(value: number): void {
		this.deferUpdate(() => {
			this.enumeratorsCount = value;
			this.cdr.markForCheck();
		});
	}
	onGeneralUsersCountChange(value: number): void {
		this.deferUpdate(() => {
			this.generalUsersCount = value;
			this.cdr.markForCheck();
		});
	}

	ngOnInit(): void {
		this.loadAllUsers();
	}

	ngAfterViewInit(): void {
		// Tables are now available
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Refresh all role lists (each component loads its own data)
	 */
	loadAllUsers(): void {
		this.adminListRef?.refresh();
		this.supervisorListRef?.refresh();
		this.enumeratorListRef?.refresh();
		this.generalListRef?.refresh();
	}

	/**
	 * Open dialog to create a new general user
	 */
	openCreateGeneralUserDialog(): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserCreateComponent,
			{
				header: 'Create New General User',
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					userType: UserRole.GENERAL_USER,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe((result) => {
				if (result) {
					this.generalListRef?.refresh();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'General user created successfully',
						life: 3000,
					});
				}
			});
	}

	/**
	 * Open dialog to create new supervisor
	 */
	/**
	 * Open dialog to create a new admin
	 */
	openCreateAdminDialog(): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserCreateComponent,
			{
				header: 'Create New Admin',
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					userType: UserRole.ADMIN,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe((result) => {
				if (result) {
					this.adminListRef?.refresh();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Admin created successfully',
						life: 3000,
					});
				}
			});
	}

	/**
	 * Open dialog to create a new supervisor
	 */
	openCreateSupervisorDialog(): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserCreateComponent,
			{
				header: 'Create New Supervisor',
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					userType: UserRole.SUPERVISOR,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe((result) => {
				if (result) {
					this.supervisorListRef?.refresh();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Supervisor created successfully',
						life: 3000,
					});
				}
			});
	}

	/**
	 * Open dialog to edit user
	 */
	openEditDialog(user: User | Supervisor): void {
		const userType = user.role;
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserUpdateComponent,
			{
				header: `Edit ${this.getRoleTitle(userType)}`,
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					user: user,
					userType: userType,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe((result) => {
				if (result) {
					this.loadAllUsers();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `${this.getRoleTitle(userType)} updated successfully`,
						life: 3000,
					});
				}
			});
	}

	/**
	 * Open dialog to manage dzongkhag assignments (supervisors only)
	 */
	openAssignDzongkhagDialog(supervisor: Supervisor): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminAssignDzongkhagComponent,
			{
				header: 'Manage Dzongkhag Assignments',
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					supervisor: supervisor,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe((result) => {
				if (result) {
					this.supervisorListRef?.refresh();
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Dzongkhag assignments updated successfully',
						life: 3000,
					});
				}
			});
	}

	/**
	 * Open reset password dialog
	 */
	openResetPasswordDialog(user: User | Supervisor): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserResetPasswordComponent,
			{
				header: 'Reset Password',
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto' },
				baseZIndex: 10000,
				data: {
					user: user,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe((result) => {
				if (result) {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Password reset successfully',
						life: 3000,
					});
				}
			});
	}

	/**
	 * Open user profile view dialog
	 */
	openProfileViewDialog(user: User | Supervisor): void {
		const ref: DynamicDialogRef = this.dialogService.open(
			AdminUserProfileViewComponent,
			{
				header: `View ${this.getRoleTitle(user.role)} Profile`,
				modal: true,
				dismissableMask: true,
				styleClass: 'p-fluid',
				contentStyle: { overflow: 'auto', maxHeight: '90vh' },
				baseZIndex: 10000,
				maximizable: true,
				data: {
					user: user,
				},
			}
		);

		ref.onClose
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				// Profile view is read-only, no refresh needed
			});
	}

	/**
	 * Delete supervisor with confirmation
	 */
	deleteSupervisor(supervisor: User, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
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
							this.supervisorListRef?.refresh();
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
	 * Get dzongkhag names for display
	 */
	getDzongkhagNames(supervisor: Supervisor): string {
		if (!supervisor.dzongkhags || supervisor.dzongkhags.length === 0) {
			return 'None';
		}
		return supervisor.dzongkhags.map((dz) => dz.name).join(', ');
	}

	/**
	 * Get role title
	 */
	getRoleTitle(role: UserRole): string {
		switch (role) {
			case UserRole.ADMIN:
				return 'Admin';
			case UserRole.SUPERVISOR:
				return 'Supervisor';
			case UserRole.ENUMERATOR:
				return 'Enumerator';
			case UserRole.GENERAL_USER:
				return 'General User';
			default:
				return 'User';
		}
	}

	/**
	 * Check if user is supervisor
	 */
	isSupervisor(user: User | Supervisor): user is Supervisor {
		return user.role === UserRole.SUPERVISOR;
	}

	/**
	 * Get first character of name for avatar
	 */
	getAvatarInitial(name: string | undefined): string {
		if (!name) return 'U';
		return name.charAt(0).toUpperCase();
	}

	/**
	 * Get avatar color based on name for consistency
	 */
	getAvatarColor(name: string | undefined): string {
		if (!name) return '#6366f1'; // Default indigo
		
		// Generate a consistent color based on the name
		const colors = [
			'#6366f1', // indigo
			'#8b5cf6', // violet
			'#ec4899', // pink
			'#f59e0b', // amber
			'#10b981', // emerald
			'#3b82f6', // blue
			'#ef4444', // red
			'#14b8a6', // teal
			'#f97316', // orange
			'#06b6d4', // cyan
		];
		
		// Simple hash function to get consistent color
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	}

	/**
	 * Activate user account
	 * @param user - User to activate
	 * @param event - Event object for confirmation dialog
	 */
	activateUser(user: User | Supervisor, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Are you sure you want to activate ${user.name}? They will be able to log in to the system.`,
			header: 'Confirm Activation',
			icon: 'pi pi-check-circle',
			acceptButtonStyleClass: 'p-button-success',
			accept: () => {
				this.authService
					.activateUser(user.id)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (response) => {
							this.refreshListByRole(response.user.role);
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: response.message || 'User activated successfully',
								life: 3000,
							});
						},
						error: (error) => {
							console.error('Error activating user:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: error.error?.message || 'Failed to activate user',
								life: 3000,
							});
						},
					});
			},
		});
	}

	/**
	 * Deactivate user account
	 * @param user - User to deactivate
	 * @param event - Event object for confirmation dialog
	 */
	deactivateUser(user: User | Supervisor, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Are you sure you want to deactivate ${user.name}? They will not be able to log in to the system, and any existing authentication tokens will become invalid.`,
			header: 'Confirm Deactivation',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.authService
					.deactivateUser(user.id)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (response) => {
							this.refreshListByRole(response.user.role);
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: response.message || 'User deactivated successfully',
								life: 3000,
							});
						},
						error: (error) => {
							console.error('Error deactivating user:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: error.error?.message || 'Failed to deactivate user',
								life: 3000,
							});
						},
					});
			},
		});
	}

	/**
	 * Refresh the list component for the given role after activate/deactivate
	 */
	private refreshListByRole(role: UserRole): void {
		switch (role) {
			case UserRole.ADMIN:
				this.adminListRef?.refresh();
				break;
			case UserRole.SUPERVISOR:
				this.supervisorListRef?.refresh();
				break;
			case UserRole.ENUMERATOR:
				this.enumeratorListRef?.refresh();
				break;
			case UserRole.GENERAL_USER:
				this.generalListRef?.refresh();
				break;
		}
	}
}

