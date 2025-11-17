import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import {
	User,
	UserRole,
	UpdateUserDto,
	Supervisor,
} from '../../../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-admin-user-update',
	templateUrl: './admin-user-update.component.html',
	styleUrls: ['./admin-user-update.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminUserUpdateComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	userForm!: FormGroup;
	user!: User | Supervisor;
	userType: UserRole = UserRole.SUPERVISOR;
	saving = false;
	initialFormValue: any;

	// Expose enum to template
	UserRole = UserRole;

	// Role options for admin users
	roleOptions = [
		{ label: 'Admin', value: UserRole.ADMIN },
		{ label: 'Supervisor', value: UserRole.SUPERVISOR },
		{ label: 'Enumerator', value: UserRole.ENUMERATOR },
	];

	constructor(
		private fb: FormBuilder,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private authService: AuthService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		// Get user and userType from dialog config
		this.user = this.config.data?.user;
		this.userType = this.config.data?.userType || this.getUserTypeFromRole();

		if (!this.user) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'User data not provided',
			});
			this.ref.close(false);
			return;
		}

		this.initializeForm();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Get user type from role
	 */
	private getUserTypeFromRole(): UserRole {
		switch (this.user?.role) {
			case UserRole.ADMIN:
				return UserRole.ADMIN;
			case UserRole.SUPERVISOR:
				return UserRole.SUPERVISOR;
			case UserRole.ENUMERATOR:
				return UserRole.ENUMERATOR;
			default:
				return UserRole.SUPERVISOR;
		}
	}

	/**
	 * Initialize the form with user data
	 */
	private initializeForm(): void {
		this.userForm = this.fb.group({
			name: [
				this.user.name || '',
				[Validators.required, Validators.minLength(3)],
			],
			cid: [{ value: this.user.cid || '', disabled: true }], // CID is not editable
			emailAddress: [
				this.user.emailAddress || '',
				[Validators.required, Validators.email],
			],
			phoneNumber: [
				this.user.phoneNumber || '',
				[Validators.required, Validators.pattern(/^[17689]\d{7}$/)],
			],
			role: [
				this.user.role || UserRole.SUPERVISOR,
				this.userType === UserRole.ADMIN ? [Validators.required] : [],
			],
		});

		// Store initial form value for change detection
		this.initialFormValue = this.userForm.getRawValue();
	}

	/**
	 * Check if form field has error
	 */
	hasFormError(field: string): boolean {
		const control = this.userForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	/**
	 * Get form field error message
	 */
	getFormError(field: string): string {
		const control = this.userForm.get(field);
		if (!control) return '';

		if (control.hasError('required')) {
			return `${this.getFieldLabel(field)} is required`;
		}
		if (control.hasError('email')) {
			return 'Please enter a valid email address';
		}
		if (control.hasError('minlength')) {
			const minLength = control.errors?.['minlength'].requiredLength;
			return `Minimum ${minLength} characters required`;
		}
		if (control.hasError('pattern')) {
			if (field === 'phoneNumber') {
				return 'Phone must be 8 digits starting with 1, 7, 6, 8, or 9';
			}
		}

		return 'Invalid input';
	}

	/**
	 * Get field label for display
	 */
	private getFieldLabel(field: string): string {
		const labels: { [key: string]: string } = {
			name: 'Full Name',
			cid: 'CID',
			emailAddress: 'Email Address',
			phoneNumber: 'Phone Number',
			role: 'Role',
		};
		return labels[field] || field;
	}

	/**
	 * Get user type title
	 */
	getUserTypeTitle(): string {
		switch (this.userType) {
			case UserRole.ADMIN:
				return 'Admin User';
			case UserRole.SUPERVISOR:
				return 'Supervisor';
			case UserRole.ENUMERATOR:
				return 'Enumerator';
			default:
				return 'User';
		}
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
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	/**
	 * Check if form has unsaved changes
	 */
	hasUnsavedChanges(): boolean {
		const currentValue = this.userForm.getRawValue();
		return (
			JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue)
		);
	}

	/**
	 * Update user
	 */
	updateUser(): void {
		if (this.userForm.invalid) {
			Object.keys(this.userForm.controls).forEach((key) => {
				this.userForm.get(key)?.markAsTouched();
			});
			this.messageService.add({
				severity: 'error',
				summary: 'Validation Error',
				detail: 'Please fix all form errors before submitting',
			});
			return;
		}

		if (!this.hasUnsavedChanges()) {
			this.messageService.add({
				severity: 'info',
				summary: 'No Changes',
				detail: 'No changes to save',
			});
			return;
		}

		this.saving = true;

		// Prepare update DTO with only changed fields
		const updateDto: UpdateUserDto = {};
		const formValue = this.userForm.value;

		if (formValue.name !== this.user.name) {
			updateDto.name = formValue.name;
		}
		if (formValue.emailAddress !== this.user.emailAddress) {
			updateDto.emailAddress = formValue.emailAddress;
		}
		if (formValue.phoneNumber !== this.user.phoneNumber) {
			updateDto.phoneNumber = formValue.phoneNumber;
		}
		if (this.userType === UserRole.ADMIN && formValue.role !== this.user.role) {
			updateDto.role = formValue.role;
		}

		this.authService
			.updateUser(this.user.id, updateDto)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: (updatedUser) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `${this.getUserTypeTitle()} updated successfully`,
					});
					this.ref.close(true);
				},
				error: (error) => {
					console.error('Error updating user:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to update user',
					});
				},
			});
	}

	/**
	 * Cancel and close dialog
	 */
	cancel(): void {
		this.ref.close(false);
	}

	/**
	 * Get assigned dzongkhags (for supervisors)
	 */
	getAssignedDzongkhags(): string {
		const supervisor = this.user as Supervisor;
		if (supervisor.dzongkhags && supervisor.dzongkhags.length > 0) {
			return supervisor.dzongkhags.map((dz) => dz.name).join(', ');
		}
		return 'None';
	}

	/**
	 * Check if user is a supervisor with dzongkhags
	 */
	isSupervisorWithDzongkhags(): boolean {
		return (
			this.user.role === UserRole.SUPERVISOR &&
			!!(this.user as Supervisor).dzongkhags
		);
	}
}
