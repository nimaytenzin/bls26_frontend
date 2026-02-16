import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
	AbstractControl,
	ValidationErrors,
} from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import {
	UserRole,
	CreateSupervisorDto,
	CreateEnumeratorDto,
	AdminSignupDto,
} from '../../../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-admin-user-create',
	templateUrl: './admin-user-create.component.html',
	styleUrls: ['./admin-user-create.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminUserCreateComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	userForm!: FormGroup;
	userType: UserRole = UserRole.SUPERVISOR;
	saving = false;

	// Expose enum to template
	UserRole = UserRole;

	// Role options for admin users
	roleOptions = [
		{ label: 'Admin', value: UserRole.ADMIN },
		{ label: 'Supervisor', value: UserRole.SUPERVISOR },
		{ label: 'Enumerator', value: UserRole.ENUMERATOR },
		{ label: 'General User', value: UserRole.GENERAL_USER },
	];

	constructor(
		private fb: FormBuilder,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private authService: AuthService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		// Get userType from dialog config
		this.userType = this.config.data?.userType || UserRole.SUPERVISOR;
		this.initializeForm();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Initialize the form with appropriate validators
	 */
	private initializeForm(): void {
		this.userForm = this.fb.group(
			{
				name: ['', [Validators.required, Validators.minLength(3)]],
				cid: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
				emailAddress: ['', [Validators.required, Validators.email]],
				phoneNumber: [
					'',
					[Validators.required, Validators.pattern(/^[17689]\d{7}$/)],
				],
				password: ['', [Validators.required, Validators.minLength(6)]],
				confirmPassword: ['', [Validators.required]],
				role: [
					this.getDefaultRole(),
					this.userType === UserRole.ADMIN ? [Validators.required] : [],
				],
			},
			{ validators: this.passwordMatchValidator }
		);
	}

	/**
	 * Get default role based on user type
	 */
	private getDefaultRole(): UserRole {
		switch (this.userType) {
			case UserRole.ADMIN:
				return UserRole.ADMIN;
			case UserRole.SUPERVISOR:
				return UserRole.SUPERVISOR;
			case UserRole.ENUMERATOR:
				return UserRole.ENUMERATOR;
			case UserRole.GENERAL_USER:
				return UserRole.GENERAL_USER;
			default:
				return UserRole.SUPERVISOR;
		}
	}

	/**
	 * Custom validator to check if passwords match
	 */
	private passwordMatchValidator(
		control: AbstractControl
	): ValidationErrors | null {
		const password = control.get('password');
		const confirmPassword = control.get('confirmPassword');

		if (!password || !confirmPassword) {
			return null;
		}

		return password.value === confirmPassword.value
			? null
			: { passwordMismatch: true };
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
			if (field === 'cid') {
				return 'CID must be exactly 11 digits';
			}
			if (field === 'phoneNumber') {
				return 'Phone must be 8 digits starting with 1, 7, 6, 8, or 9';
			}
		}

		return 'Invalid input';
	}

	/**
	 * Get password mismatch error
	 */
	getPasswordMismatchError(): string {
		return this.userForm.hasError('passwordMismatch') &&
			this.userForm.get('confirmPassword')?.touched
			? 'Passwords do not match'
			: '';
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
			password: 'Password',
			confirmPassword: 'Confirm Password',
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
			case UserRole.GENERAL_USER:
				return 'General User';
			default:
				return 'User';
		}
	}

	/**
	 * Create user based on type
	 */
	createUser(): void {
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

		this.saving = true;
		const formValue = this.userForm.value;

		// Remove confirmPassword from payload
		const { confirmPassword, ...userData } = formValue;

		switch (this.userType) {
			case UserRole.SUPERVISOR:
				this.createSupervisor(userData as CreateSupervisorDto);
				break;
			case UserRole.ENUMERATOR:
				this.createEnumerator(userData as CreateEnumeratorDto);
				break;
			case UserRole.ADMIN:
				this.createAdmin(userData as AdminSignupDto);
				break;
			case UserRole.GENERAL_USER:
				this.createGeneralUser(userData);
				break;
		}
	}

	/**
	 * Create supervisor
	 */
	private createSupervisor(data: CreateSupervisorDto): void {
		this.authService
			.createSupervisor(data)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: (user) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Supervisor ${user.name} created successfully`,
					});
					this.ref.close(true);
				},
				error: (error) => {
					console.error('Error creating supervisor:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to create supervisor',
					});
				},
			});
	}

	/**
	 * Create enumerator
	 */
	private createEnumerator(data: CreateEnumeratorDto): void {
		this.authService
			.createEnumerator(data)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: (user) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Enumerator ${user.name} created successfully`,
					});
					this.ref.close(true);
				},
				error: (error) => {
					console.error('Error creating enumerator:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to create enumerator',
					});
				},
			});
	}

	/**
	 * Create admin
	 */
	private createAdmin(data: AdminSignupDto): void {
		this.authService
			.adminSignup(data)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Admin user created successfully`,
					});
					this.ref.close(true);
				},
				error: (error) => {
					console.error('Error creating admin:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to create admin user',
					});
				},
			});
	}

	/**
	 * Create general user (uses admin signup with role GENERAL_USER)
	 */
	private createGeneralUser(data: Record<string, unknown>): void {
		const payload = { ...data, role: UserRole.GENERAL_USER } as AdminSignupDto;
		this.authService
			.adminSignup(payload)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'General user created successfully',
					});
					this.ref.close(true);
				},
				error: (error) => {
					console.error('Error creating general user:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to create general user',
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
	 * Check if form has unsaved changes
	 */
	hasUnsavedChanges(): boolean {
		return this.userForm.dirty;
	}
}
