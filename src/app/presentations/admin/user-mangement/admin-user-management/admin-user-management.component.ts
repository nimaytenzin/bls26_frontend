import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../../primeng.modules';
import { UserDataService } from '../../../../core/dataservice/user/user.dataservice';
import { AuthDataService } from '../../../../core/dataservice/auth/auth.api';
import {
	User,
	UserRoleEnum,
	UserQueryParams,
} from '../../../../core/dataservice/user/user.interface';
import { AdminResetPassword } from '../../../../core/dataservice/auth/auth.interface';
import { AdminCreateUserComponent } from '../components/admin-create-user/admin-create-user.component';
import { AdminUpdateUserComponent } from '../components/admin-update-user/admin-update-user.component';

@Component({
	selector: 'app-admin-user-management',
	templateUrl: './admin-user-management.component.html',
	styleUrls: ['./admin-user-management.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminUserManagementComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private dialogRef: DynamicDialogRef | undefined;

	users: User[] = [];
	loading = false;
	totalRecords = 0;

	// Dialog states
	resetPasswordDialog = false;
	selectedUser: User | null = null;
	resetPasswordLoading = false;

	// Reset password form
	resetPasswordForm: AdminResetPassword = {
		newPassword: '',
		newPasswordAgain: '',
	};

	// Filters
	selectedRole: UserRoleEnum | null = null;
	searchText = '';
	showVerifiedOnly = false;
	showActiveOnly = false;

	// Options
	roleOptions = [
		{ label: 'All Roles', value: null },
		{ label: 'Admin', value: UserRoleEnum.ADMIN },
		{ label: 'Theatre Manager', value: UserRoleEnum.THEATRE_MANAGER },
		{ label: 'Executive Producer', value: UserRoleEnum.EXECUTIVE_PRODUCER },
		{ label: 'Counter Staff', value: UserRoleEnum.COUNTER_STAFF },
	];

	userRoleOptions = [
		{ label: 'Admin', value: UserRoleEnum.ADMIN },
		{ label: 'Theatre Manager', value: UserRoleEnum.THEATRE_MANAGER },
		{ label: 'Executive Producer', value: UserRoleEnum.EXECUTIVE_PRODUCER },
		{ label: 'Counter Staff', value: UserRoleEnum.COUNTER_STAFF },
	];

	// Table columns
	cols = [
		{ field: 'id', header: 'ID' },
		{ field: 'fullName', header: 'Name' },
		{ field: 'email', header: 'Email' },
		{ field: 'phoneNumber', header: 'Phone' },
		{ field: 'role', header: 'Role' },
		{ field: 'isVerified', header: 'Verified' },
		{ field: 'hasLoginAccess', header: 'Access' },
		{ field: 'lastLoginAt', header: 'Last Login' },
	];

	constructor(
		private userDataService: UserDataService,
		private authDataService: AuthDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService
	) {}

	ngOnInit() {
		this.loadUsers();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.dialogRef) {
			this.dialogRef.close();
		}
	}

	loadUsers() {
		this.loading = true;

		const params: UserQueryParams = {
			page: 1,
			limit: 100,
		};

		if (this.selectedRole) {
			params.role = this.selectedRole;
		}

		if (this.searchText) {
			params.search = this.searchText;
		}

		if (this.showVerifiedOnly) {
			params.isVerified = true;
		}

		if (this.showActiveOnly) {
			params.hasLoginAccess = true;
		}

		this.userDataService
			.findAllUsers(params)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.users = response.data;
					this.totalRecords = response.pagination.totalItems;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading users:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load users',
					});
					this.loading = false;
				},
			});
	}

	openNew() {
		this.dialogRef = this.dialogService.open(AdminCreateUserComponent, {
			header: 'Add New User',
			modal: true,
			closable: true,
			dismissableMask: true,
		});

		this.dialogRef.onClose.subscribe((result) => {
			if (result) {
				this.loadUsers(); // Refresh the user list
			}
		});
	}

	editUser(user: User) {
		this.dialogRef = this.dialogService.open(AdminUpdateUserComponent, {
			header: 'Edit User',
			modal: true,
			closable: true,
			dismissableMask: true,
			data: { user },
		});

		this.dialogRef.onClose.subscribe((result) => {
			if (result) {
				this.loadUsers(); // Refresh the user list
			}
		});
	}

	toggleLoginAccess(user: User) {
		const action = user.hasLoginAccess ? 'disable' : 'enable';
		const message = `Are you sure you want to ${action} login access for ${this.getFullName(
			user
		)}?`;

		this.confirmationService.confirm({
			message: message,
			header: 'Confirm Action',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				this.authDataService
					.adminToggleLoginAccess(user.id)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (response: any) => {
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: `Login access ${action}d successfully`,
							});
							this.loadUsers(); // Refresh the list
						},
						error: (error: any) => {
							console.error('Error toggling login access:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail:
									error.error?.message || `Failed to ${action} login access`,
							});
						},
					});
			},
		});
	}

	resetPassword(user: User) {
		this.openResetPasswordDialog(user);
	}

	openResetPasswordDialog(user: User) {
		this.selectedUser = user;
		this.resetPasswordForm = {
			newPassword: '',
			newPasswordAgain: '',
		};
		this.resetPasswordDialog = true;
	}

	closeResetPasswordDialog() {
		this.resetPasswordDialog = false;
		this.selectedUser = null;
		this.resetPasswordForm = {
			newPassword: '',
			newPasswordAgain: '',
		};
		this.resetPasswordLoading = false;
	}

	confirmResetPassword() {
		if (!this.selectedUser) {
			return;
		}

		// Validate passwords
		if (
			!this.resetPasswordForm.newPassword ||
			!this.resetPasswordForm.newPasswordAgain
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please fill in both password fields',
			});
			return;
		}

		if (
			this.resetPasswordForm.newPassword !==
			this.resetPasswordForm.newPasswordAgain
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Passwords do not match',
			});
			return;
		}

		if (this.resetPasswordForm.newPassword.length < 6) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Password must be at least 6 characters long',
			});
			return;
		}

		this.resetPasswordLoading = true;

		this.authDataService
			.adminResetPassword(this.selectedUser.id, this.resetPasswordForm)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Password reset successfully for ${this.getFullName(
							this.selectedUser!
						)}`,
					});
					this.closeResetPasswordDialog();
				},
				error: (error) => {
					console.error('Error resetting password:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to reset password',
					});
					this.resetPasswordLoading = false;
				},
			});
	}

	onRoleFilterChange() {
		this.loadUsers();
	}

	onSearchChange() {
		// Debounce search
		setTimeout(() => {
			this.loadUsers();
		}, 500);
	}

	refreshUsers() {
		this.loadUsers();
	}

	getRoleSeverity(role: UserRoleEnum): string {
		switch (role) {
			case UserRoleEnum.ADMIN:
				return 'danger';
			case UserRoleEnum.THEATRE_MANAGER:
				return 'success';
			case UserRoleEnum.EXECUTIVE_PRODUCER:
				return 'info';
			case UserRoleEnum.COUNTER_STAFF:
				return 'warning';
			default:
				return 'secondary';
		}
	}

	formatDate(date: any): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	getFullName(user: User): string {
		return `${user.firstName} ${user.lastName}`;
	}
}
