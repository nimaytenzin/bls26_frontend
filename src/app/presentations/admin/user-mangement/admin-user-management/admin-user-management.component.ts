import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
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

@Component({
	selector: 'app-admin-user-management',
	templateUrl: './admin-user-management.component.html',
	styleUrls: ['./admin-user-management.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminUserManagementComponent implements OnInit, OnDestroy, AfterViewInit {
	private destroy$ = new Subject<void>();

	// Table references
	@ViewChild('adminTable') adminTable!: Table;
	@ViewChild('supervisorTable') supervisorTable!: Table;
	@ViewChild('enumeratorTable') enumeratorTable!: Table;

	// Data properties
	admins: User[] = [];
	supervisors: Supervisor[] = [];
	enumerators: User[] = [];
	selectedUser: User | Supervisor | null = null;

	// Loading states
	loadingAdmins = false;
	loadingSupervisors = false;
	loadingEnumerators = false;

	// Search and filter
	searchValue = '';
	selectedRole: UserRole | null = null;

	// Table properties
	firstAdmins = 0;
	firstSupervisors = 0;
	firstEnumerators = 0;
	rows = 10;

	// Active tab
	activeTabIndex = 0;

	// Expose enum to template
	UserRole = UserRole;

	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService
	) {}

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
	 * Load all users for all roles
	 */
	loadAllUsers(): void {
		this.loadAdmins();
		this.loadSupervisors();
		this.loadEnumerators();
	}

	/**
	 * Load all admins
	 */
	loadAdmins(): void {
		this.loadingAdmins = true;
		this.authService
			.getAllUsers(UserRole.ADMIN)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingAdmins = false))
			)
			.subscribe({
				next: (admins) => {
					this.admins = admins;
				},
				error: (error) => {
					console.error('Error loading admins:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load admins',
					});
				},
			});
	}

	/**
	 * Load all supervisors with their assigned dzongkhags
	 */
	loadSupervisors(): void {
		this.loadingSupervisors = true;
		this.authService
			.getAllSupervisorsWithDzongkhags()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingSupervisors = false))
			)
			.subscribe({
				next: (supervisors) => {
					this.supervisors = supervisors;
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
	 * Load all enumerators
	 */
	loadEnumerators(): void {
		this.loadingEnumerators = true;
		this.authService
			.getAllEnumerators()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingEnumerators = false))
			)
			.subscribe({
				next: (enumerators) => {
					this.enumerators = enumerators;
				},
				error: (error) => {
					console.error('Error loading enumerators:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumerators',
					});
				},
			});
	}

	/**
	 * Get current users based on active tab
	 */
	getCurrentUsers(): User[] | Supervisor[] {
		switch (this.activeTabIndex) {
			case 0:
				return this.admins;
			case 1:
				return this.supervisors;
			case 2:
				return this.enumerators;
			default:
				return [];
		}
	}

	/**
	 * Get loading state for current tab
	 */
	getCurrentLoading(): boolean {
		switch (this.activeTabIndex) {
			case 0:
				return this.loadingAdmins;
			case 1:
				return this.loadingSupervisors;
			case 2:
				return this.loadingEnumerators;
			default:
				return false;
		}
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
					this.loadAdmins();
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
					this.loadSupervisors();
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
					this.loadSupervisors();
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
							this.supervisors = this.supervisors.filter(
								(s) => s.id !== supervisor.id
							);
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
	 * Handle global filter for tables
	 */
	onGlobalFilter(event: Event): void {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		// Apply filter to all tables
		if (this.adminTable) {
			this.adminTable.filterGlobal(value, 'contains');
		}
		if (this.supervisorTable) {
			this.supervisorTable.filterGlobal(value, 'contains');
		}
		if (this.enumeratorTable) {
			this.enumeratorTable.filterGlobal(value, 'contains');
		}
	}

	/**
	 * Clear search and reset filters
	 */
	clearSearch(): void {
		this.searchValue = '';
		// Clear filters on all tables
		if (this.adminTable) {
			this.adminTable.filterGlobal('', 'contains');
		}
		if (this.supervisorTable) {
			this.supervisorTable.filterGlobal('', 'contains');
		}
		if (this.enumeratorTable) {
			this.enumeratorTable.filterGlobal('', 'contains');
		}
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
	 * Download admins data as CSV
	 */
	downloadAdminsCSV(): void {
		if (this.admins.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No admins available to export',
				life: 3000,
			});
			return;
		}

		// Create CSV header
		const headers = ['Role', 'Name', 'CID', 'Email', 'Phone Number'];
		const csvRows = [headers.join(',')];

		// Add data rows with proper escaping
		this.admins.forEach((admin) => {
			const row = [
				'"Admin"',
				`"${(admin.name || '').replace(/"/g, '""')}"`,
				`"${(admin.cid || '').replace(/"/g, '""')}"`,
				`"${(admin.emailAddress || '').replace(/"/g, '""')}"`,
				`"${(admin.phoneNumber || '').replace(/"/g, '""')}"`,
			];
			csvRows.push(row.join(','));
		});

		// Create and download file
		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const dateStr = new Date().toISOString().split('T')[0];
		link.download = `admins_export_${dateStr}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: `Admins CSV downloaded successfully (${this.admins.length} admins)`,
			life: 3000,
		});
	}

	/**
	 * Download supervisors data as CSV
	 */
	downloadSupervisorsCSV(): void {
		if (this.supervisors.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No supervisors available to export',
				life: 3000,
			});
			return;
		}

		// Create CSV header
		const headers = ['Role', 'Name', 'CID', 'Email', 'Phone Number'];
		const csvRows = [headers.join(',')];

		// Add data rows with proper escaping
		this.supervisors.forEach((supervisor) => {
			const row = [
				'"Supervisor"',
				`"${(supervisor.name || '').replace(/"/g, '""')}"`,
				`"${(supervisor.cid || '').replace(/"/g, '""')}"`,
				`"${(supervisor.emailAddress || '').replace(/"/g, '""')}"`,
				`"${(supervisor.phoneNumber || '').replace(/"/g, '""')}"`,
			];
			csvRows.push(row.join(','));
		});

		// Create and download file
		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const dateStr = new Date().toISOString().split('T')[0];
		link.download = `supervisors_export_${dateStr}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: `Supervisors CSV downloaded successfully (${this.supervisors.length} supervisors)`,
			life: 3000,
		});
	}

	/**
	 * Download enumerators data as CSV
	 */
	downloadEnumeratorsCSV(): void {
		if (this.enumerators.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No enumerators available to export',
				life: 3000,
			});
			return;
		}

		// Create CSV header
		const headers = ['Role', 'Name', 'CID', 'Email', 'Phone Number'];
		const csvRows = [headers.join(',')];

		// Add data rows with proper escaping
		this.enumerators.forEach((enumerator) => {
			const row = [
				'"Enumerator"',
				`"${(enumerator.name || '').replace(/"/g, '""')}"`,
				`"${(enumerator.cid || '').replace(/"/g, '""')}"`,
				`"${(enumerator.emailAddress || '').replace(/"/g, '""')}"`,
				`"${(enumerator.phoneNumber || '').replace(/"/g, '""')}"`,
			];
			csvRows.push(row.join(','));
		});

		// Create and download file
		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const dateStr = new Date().toISOString().split('T')[0];
		link.download = `enumerators_export_${dateStr}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: `Enumerators CSV downloaded successfully (${this.enumerators.length} enumerators)`,
			life: 3000,
		});
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
							// Update the user in the appropriate array
							this.updateUserInArray(response.user);
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
							// Update the user in the appropriate array
							this.updateUserInArray(response.user);
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
	 * Update user in the appropriate array after activation/deactivation
	 * @param updatedUser - Updated user object
	 */
	private updateUserInArray(updatedUser: User): void {
		// Update in admins array
		const adminIndex = this.admins.findIndex((u) => u.id === updatedUser.id);
		if (adminIndex !== -1) {
			this.admins[adminIndex] = { ...this.admins[adminIndex], ...updatedUser };
		}

		// Update in supervisors array
		const supervisorIndex = this.supervisors.findIndex((u) => u.id === updatedUser.id);
		if (supervisorIndex !== -1) {
			this.supervisors[supervisorIndex] = {
				...this.supervisors[supervisorIndex],
				...updatedUser,
			};
		}

		// Update in enumerators array
		const enumeratorIndex = this.enumerators.findIndex((u) => u.id === updatedUser.id);
		if (enumeratorIndex !== -1) {
			this.enumerators[enumeratorIndex] = {
				...this.enumerators[enumeratorIndex],
				...updatedUser,
			};
		}
	}
}

