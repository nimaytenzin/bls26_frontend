import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AdminLayoutService } from '../service/admin-layout.service';
import { Router, RouterModule } from '@angular/router';
import { Popover } from 'primeng/popover';
import { Subscription } from 'rxjs';

import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';
import {
	User,
	UpdateProfileDto,
	ChangePasswordDto,
	UserRole,
} from '../../core/dataservice/auth/auth.interface';
import { DzongkhagService } from '../../core/dataservice/dzongkhag/dzongkhag.service';
import type { Dzongkhag } from '../../core/dataservice/dzongkhag/dzongkhag.service';
import { AuthService } from '../../core/dataservice/auth/auth.service';

@Component({
	selector: 'app-admin-topbar',
	templateUrl: './admin-topbar.component.html',
	styleUrls: ['./admin-topbar.component.css'],
	standalone: true,
	imports: [
		OverlayPanelModule,
		CommonModule,
		DividerModule,
		ButtonModule,
		PasswordModule,
		ToastModule,
		ConfirmPopupModule,
		PopoverModule,
		DialogModule,
		FormsModule,
		InputTextModule,
		AvatarModule,
		RouterModule,
	],
	providers: [ConfirmationService, MessageService],
})
export class AdminTopbarComponent implements OnInit, OnDestroy {
	items!: MenuItem[];
	@ViewChild('menubutton') menuButton!: ElementRef;

	@ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

	@ViewChild('topbarmenu') menu!: ElementRef;

	@ViewChild('profilePopover') profilePopover!: Popover;

	isNotVerified: boolean = false;
	isLoggingOut: boolean = false;

	// User profile
	userProfile: User | null = null;
	private authStateSubscription?: Subscription;

	// Supervisor dzongkhags
	assignedDzongkhags: Dzongkhag[] = [];
	loadingDzongkhags: boolean = false;

	// Edit Profile Dialog
	showEditProfileDialog: boolean = false;
	editProfileForm: UpdateProfileDto = {
		name: '',
		phoneNumber: '',
	};
	isUpdatingProfile: boolean = false;

	// Change Password Dialog
	showChangePasswordDialog: boolean = false;
	changePasswordForm: ChangePasswordDto = {
		currentPassword: '',
		newPassword: '',
	};
	confirmNewPassword: string = '';
	isChangingPassword: boolean = false;

	constructor(
		public layoutService: AdminLayoutService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService,
		private authService: AuthService,
		private router: Router,
		private dzongkhagService: DzongkhagService
	) {}

	ngOnInit(): void {
		this.userProfile = this.authService.getCurrentUser();
		this.authStateSubscription = this.authService.getCurrentUser$().subscribe(
			(user: User | null) => {
				this.userProfile = user;
				this.assignedDzongkhags = [];
			}
		);
	}

	ngOnDestroy(): void {
		if (this.authStateSubscription) {
			this.authStateSubscription.unsubscribe();
		}
	}

	/**
	 * Get avatar label (first letter of name) if no profile image
	 */
	getAvatarLabel(): string {
		return this.userProfile?.name?.charAt(0)?.toUpperCase() || 'U';
	}

	/**
	 * Show logout confirmation dialog and execute logout if confirmed
	 */
	confirmLogout(event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: 'Are you sure you want to sign out?',
			header: 'Sign Out',
			icon: 'pi pi-sign-out',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.profilePopover.hide();
				this.isLoggingOut = true;
				this.authService.signOut();
				this.authService.forceLogout();
				this.router.navigate(['/auth/login']);
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'You have been signed out successfully',
				});
				this.isLoggingOut = false;
			},
			reject: () => {
				// User cancelled, keep profile popover open
			},
		});
	}

	/**
	 * Open Edit Profile dialog and initialize form with current user data
	 */
	openEditProfileDialog(): void {
		if (this.userProfile) {
			this.editProfileForm = {
				name: this.userProfile.name || '',
				phoneNumber: this.userProfile.phoneNumber || '',
			};
			this.showEditProfileDialog = true;
			this.profilePopover.hide();
		}
	}

	closeEditProfileDialog(): void {
		this.showEditProfileDialog = false;
		this.editProfileForm = { name: '', phoneNumber: '' };
	}

	/**
	 * Submit profile update
	 */
	updateProfile(): void {
		if (!this.userProfile) {
			return;
		}

		const hasChanges =
			(this.editProfileForm.name && this.editProfileForm.name !== this.userProfile.name) ||
			(this.editProfileForm.phoneNumber && this.editProfileForm.phoneNumber !== this.userProfile.phoneNumber);

		if (!hasChanges) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Changes',
				detail: 'Please make at least one change to update your profile.',
			});
			return;
		}

		// Build update payload with only changed fields
		const updatePayload: UpdateProfileDto = {};
		if (this.editProfileForm.name && this.editProfileForm.name !== this.userProfile.name) {
			updatePayload.name = this.editProfileForm.name;
		}
		if (this.editProfileForm.phoneNumber !== undefined && this.editProfileForm.phoneNumber !== this.userProfile.phoneNumber) {
			updatePayload.phoneNumber = this.editProfileForm.phoneNumber;
		}

		this.isUpdatingProfile = true;
		this.authService.updateProfile(updatePayload).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Profile updated successfully',
				});
				this.closeEditProfileDialog();
			},
			error: (error) => {
				console.error('Profile update error:', error);
				const errorMessage =
					error?.error?.message ||
					error?.message ||
					'Failed to update profile. Please try again.';
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
				});
			},
			complete: () => {
				this.isUpdatingProfile = false;
			},
		});
	}

	/**
	 * Open Change Password dialog
	 */
	openChangePasswordDialog(): void {
		this.changePasswordForm = {
			currentPassword: '',
			newPassword: '',
		};
		this.confirmNewPassword = '';
		this.showChangePasswordDialog = true;
		this.profilePopover.hide();
	}

	/**
	 * Close Change Password dialog and reset form
	 */
	closeChangePasswordDialog(): void {
		this.showChangePasswordDialog = false;
		this.changePasswordForm = {
			currentPassword: '',
			newPassword: '',
		};
		this.confirmNewPassword = '';
	}

	/**
	 * Submit password change
	 */
	changePassword(): void {
		// Validate form
		if (!this.changePasswordForm.currentPassword) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please enter your current password.',
			});
			return;
		}

		if (!this.changePasswordForm.newPassword) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please enter a new password.',
			});
			return;
		}

		if (this.changePasswordForm.newPassword.length < 6) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'New password must be at least 6 characters long.',
			});
			return;
		}

		if (this.changePasswordForm.newPassword !== this.confirmNewPassword) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'New password and confirmation do not match.',
			});
			return;
		}

		if (
			this.changePasswordForm.currentPassword ===
			this.changePasswordForm.newPassword
		) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'New password must be different from current password.',
			});
			return;
		}

		this.isChangingPassword = true;
		this.authService.changePassword(this.changePasswordForm).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Password changed successfully',
				});
				this.closeChangePasswordDialog();
			},
			error: (error: any) => {
				console.error('Password change error:', error);
				const errorMessage =
					error?.error?.message ||
					error?.message ||
					'Failed to change password. Please check your current password and try again.';
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
				});
			},
			complete: () => {
				this.isChangingPassword = false;
			},
		});
	}

	/**
	 * Legacy method - now opens change password dialog
	 */
	resetPassword(): void {
		this.openChangePasswordDialog();
	}

	isSupervisor(): boolean {
		return false; // Livability backend has only ADMIN | ENUMERATOR
	}

	getDzongkhagsDisplay(): string {
		if (this.assignedDzongkhags.length === 0) return '';
		return this.assignedDzongkhags.map((dz) => dz.name + ' Dzongkhag').join(', ');
	}
}
