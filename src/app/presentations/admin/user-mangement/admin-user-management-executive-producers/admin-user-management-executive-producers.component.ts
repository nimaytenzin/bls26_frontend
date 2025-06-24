import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../../core/dataservice/auth/auth.interface';
import { UserDataService } from '../../../../core/dataservice/user/user.dataservice';
import {
	CreateUserDto,
	UserRoleEnum,
	UserQueryParams,
	UpdateUserDto,
} from '../../../../core/dataservice/user/user.interface';
import { PrimeNgModules } from '../../../../primeng.modules';

@Component({
	selector: 'app-admin-user-management-executive-producers',
	templateUrl: './admin-user-management-executive-producers.component.html',
	styleUrls: ['./admin-user-management-executive-producers.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminUserManagementExecutiveProducersComponent implements OnInit {
	private destroy$ = new Subject<void>();

	users: User[] = [];
	loading = false;
	totalRecords = 0;

	// Dialog states
	userDialog = false;
	deleteUserDialog = false;
	selectedUser: User | null = null;
	isEditMode = false;

	// Form data
	userForm: CreateUserDto = {
		firstName: '',
		lastName: '',
		phoneNumber: 0,
		password: '',
		role: UserRoleEnum.COUNTER_STAFF,
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
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit() {
		this.loadUsers();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
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
					this.users = response.data.map((user: any) => ({
						...user,
						email: user.email ?? '',
					}));
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
		this.selectedUser = null;
		this.isEditMode = false;
		this.resetForm();
		this.userDialog = true;
	}

	editUser(user: User) {
		this.selectedUser = user;
		this.isEditMode = true;
		this.userForm = {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email || '',
			phoneNumber: user.phoneNumber,
			password: '', // Don't populate password for editing
			role: user.role,
			profileImage: user.profileImage,
		};
		this.userDialog = true;
	}

	deleteUser(user: User) {
		this.selectedUser = user;
		this.deleteUserDialog = true;
	}

	confirmDelete() {}

	saveUser() {
		if (this.isValidForm()) {
			if (this.isEditMode && this.selectedUser) {
				this.updateUser();
			} else {
				this.createUser();
			}
		}
	}

	createUser() {}

	updateUser() {}

	toggleVerification(user: User) {}

	toggleLoginAccess(user: User) {}

	resetPassword(user: User) {}

	hideDialog() {
		this.userDialog = false;
		this.resetForm();
	}

	resetForm() {
		this.userForm = {
			firstName: '',
			lastName: '',
			phoneNumber: 0,
			password: '',
			role: UserRoleEnum.COUNTER_STAFF,
		};
	}

	isValidForm(): boolean {
		return !!(
			(
				this.userForm.firstName &&
				this.userForm.lastName &&
				this.userForm.phoneNumber &&
				this.userForm.role &&
				(this.isEditMode || this.userForm.password)
			) // Password required only for new users
		);
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
