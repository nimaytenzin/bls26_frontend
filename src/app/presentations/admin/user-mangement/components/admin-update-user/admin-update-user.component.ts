import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	OnDestroy,
	Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../../../core/dataservice/auth/auth.interface';
import { UserDataService } from '../../../../../core/dataservice/user/user.dataservice';
import {
	UpdateUserDto,
	UserRoleEnum,
} from '../../../../../core/dataservice/user/user.interface';
import { PrimeNgModules } from '../../../../../primeng.modules';

@Component({
	selector: 'app-admin-update-user',
	templateUrl: './admin-update-user.component.html',
	styleUrls: ['./admin-update-user.component.css'],
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminUpdateUserComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	@Input() user: User | null = null;
	@Output() userUpdated = new EventEmitter<void>();

	userForm: UpdateUserDto = {};
	loading = false;

	// Options
	userRoleOptions = [
		{ label: 'Admin', value: UserRoleEnum.ADMIN },
		{ label: 'Theatre Manager', value: UserRoleEnum.THEATRE_MANAGER },
		{ label: 'Executive Producer', value: UserRoleEnum.EXECUTIVE_PRODUCER },
		{ label: 'Counter Staff', value: UserRoleEnum.COUNTER_STAFF },
	];

	constructor(
		private userDataService: UserDataService,
		private messageService: MessageService,
		private ref?: DynamicDialogRef,
		private config?: DynamicDialogConfig
	) {
		// Get user from dialog config if available
		if (this.config?.data?.user) {
			this.user = this.config.data.user;
		}
	}

	ngOnInit() {
		if (this.user) {
			this.populateForm();
		} else {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No user selected for editing',
			});
			this.onClose();
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	populateForm() {
		if (this.user) {
			this.userForm = {
				firstName: this.user.firstName,
				lastName: this.user.lastName,
				email: this.user.email || '',
				phoneNumber: Number(this.user.phoneNumber),
				role: this.user.role,
				profileImage: this.user.profileImage,
			};
		}
	}

	updateUser() {
		if (!this.user || !this.isValidForm()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please fill in all required fields',
			});
			return;
		}

		this.loading = true;

		this.userDataService
			.updateUser(this.user.id, this.userForm)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'User updated successfully',
					});
					this.userUpdated.emit();
					if (this.ref) {
						this.ref.close(true); // Pass true to indicate success
					}
				},
				error: (error) => {
					console.error('Error updating user:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to update user',
					});
					this.loading = false;
				},
			});
	}

	onClose() {
		if (this.ref) {
			this.ref.close();
		}
	}

	onCancel() {
		this.populateForm(); // Reset to original values
		this.onClose();
	}

	isValidForm(): boolean {
		return !!(
			this.userForm.firstName &&
			this.userForm.lastName &&
			this.userForm.phoneNumber &&
			this.userForm.role
		);
	}

	getFullName(): string {
		if (this.user) {
			return `${this.user.firstName} ${this.user.lastName}`;
		}
		return '';
	}
}
