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
import { User, UserRole } from '../../../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-admin-user-reset-password',
	templateUrl: './admin-user-reset-password.component.html',
	styleUrls: ['./admin-user-reset-password.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminUserResetPasswordComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	passwordForm!: FormGroup;
	user!: User;
	saving = false;

	// Expose enum to template
	UserRole = UserRole;

	constructor(
		private fb: FormBuilder,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private authService: AuthService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		// Get user from dialog config
		this.user = this.config.data?.user;
		if (!this.user) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'User information not provided',
			});
			this.ref.close(false);
			return;
		}

		this.initForm();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Initialize form
	 */
	private initForm(): void {
		this.passwordForm = this.fb.group(
			{
				newPassword: [
					'',
					[
						Validators.required,
						Validators.minLength(8),
						this.passwordStrengthValidator,
					],
				],
				confirmPassword: ['', [Validators.required]],
			},
			{ validators: this.passwordMatchValidator }
		);
	}

	/**
	 * Password strength validator
	 */
	private passwordStrengthValidator(
		control: AbstractControl
	): ValidationErrors | null {
		const value = control.value;
		if (!value) {
			return null;
		}

		const hasUpperCase = /[A-Z]/.test(value);
		const hasLowerCase = /[a-z]/.test(value);
		const hasNumeric = /[0-9]/.test(value);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

		const strength =
			(hasUpperCase ? 1 : 0) +
			(hasLowerCase ? 1 : 0) +
			(hasNumeric ? 1 : 0) +
			(hasSpecialChar ? 1 : 0);

		if (strength < 3) {
			return { weakPassword: true };
		}

		return null;
	}

	/**
	 * Password match validator
	 */
	private passwordMatchValidator(
		group: AbstractControl
	): ValidationErrors | null {
		const newPassword = group.get('newPassword')?.value;
		const confirmPassword = group.get('confirmPassword')?.value;

		if (newPassword && confirmPassword && newPassword !== confirmPassword) {
			return { passwordMismatch: true };
		}

		return null;
	}

	/**
	 * Check if form field has error
	 */
	hasFormError(fieldName: string): boolean {
		const field = this.passwordForm.get(fieldName);
		return !!(field && field.invalid && (field.dirty || field.touched));
	}

	/**
	 * Get form error message
	 */
	getFormError(fieldName: string): string {
		const field = this.passwordForm.get(fieldName);
		if (!field || !field.errors) {
			return '';
		}

		if (field.errors['required']) {
			return `${this.getFieldLabel(fieldName)} is required`;
		}

		if (field.errors['minlength']) {
			return `${this.getFieldLabel(fieldName)} must be at least 8 characters`;
		}

		if (field.errors['weakPassword']) {
			return 'Password must contain at least 3 of: uppercase, lowercase, number, special character';
		}

		return 'Invalid value';
	}

	/**
	 * Get password mismatch error
	 */
	getPasswordMismatchError(): string {
		if (this.passwordForm.errors?.['passwordMismatch']) {
			return 'Passwords do not match';
		}
		return '';
	}

	/**
	 * Get field label
	 */
	private getFieldLabel(fieldName: string): string {
		const labels: { [key: string]: string } = {
			newPassword: 'New Password',
			confirmPassword: 'Confirm Password',
		};
		return labels[fieldName] || fieldName;
	}

	/**
	 * Get password strength indicator
	 */
	getPasswordStrength(): string {
		const password = this.passwordForm.get('newPassword')?.value;
		if (!password) {
			return '';
		}

		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumeric = /[0-9]/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		const strength =
			(hasUpperCase ? 1 : 0) +
			(hasLowerCase ? 1 : 0) +
			(hasNumeric ? 1 : 0) +
			(hasSpecialChar ? 1 : 0);

		if (strength === 4) {
			return 'strong';
		} else if (strength === 3) {
			return 'medium';
		} else if (strength >= 1) {
			return 'weak';
		}

		return '';
	}

	/**
	 * Get password strength color
	 */
	getPasswordStrengthColor(): string {
		const strength = this.getPasswordStrength();
		switch (strength) {
			case 'strong':
				return 'text-green-600';
			case 'medium':
				return 'text-yellow-600';
			case 'weak':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	/**
	 * Reset password
	 */
	resetPassword(): void {
		if (this.passwordForm.invalid) {
			Object.keys(this.passwordForm.controls).forEach((key) => {
				this.passwordForm.get(key)?.markAsTouched();
			});
			this.messageService.add({
				severity: 'error',
				summary: 'Validation Error',
				detail: 'Please fix all form errors before submitting',
			});
			return;
		}

		this.saving = true;
		const newPassword = this.passwordForm.value.newPassword;

		// Use the admin reset password API
		this.authService
			.adminResetPassword(this.user.id, { newPassword })
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.saving = false))
			)
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Password reset successfully',
					});
					this.ref.close(true);
				},
				error: (error) => {
					console.error('Error resetting password:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to reset password',
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
}

