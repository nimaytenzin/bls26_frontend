import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AdminLayoutService } from '../service/admin-layout.service';
import { Router } from '@angular/router';
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
import { AuthService } from '../../core/dataservice/auth/auth.service';
import { User } from '../../core/dataservice/auth/auth.interface';

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

	constructor(
		public layoutService: AdminLayoutService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService,
		private authService: AuthService,
		private router: Router
	) {}

	ngOnInit(): void {
		// Get initial user profile
		this.userProfile = this.authService.getCurrentUser();

		// Subscribe to auth state changes
		this.authStateSubscription = this.authService.authState$.subscribe(
			(authState) => {
				this.userProfile = authState.user;
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
		if (this.userProfile?.profileImage) {
			return '';
		}
		return this.userProfile?.name?.charAt(0)?.toUpperCase() || 'U';
	}

	/**
	 * Show logout confirmation dialog and execute logout if confirmed
	 */
	confirmLogout(event: Event): void {
		this.profilePopover.hide();

		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: 'Are you sure you want to sign out?',
			header: 'Sign Out',
			icon: 'pi pi-sign-out',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.isLoggingOut = true;
				this.authService.logout().subscribe({
					next: () => {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'You have been signed out successfully',
						});
						// The AuthService will handle navigation to login
					},
					error: (error) => {
						console.error('Logout error:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail:
								'An error occurred during sign out. You have been logged out locally.',
						});
						// Force logout even if server call fails
						this.authService.forceLogout();
					},
					complete: () => {
						this.isLoggingOut = false;
					},
				});
			},
			reject: () => {
				// User cancelled, do nothing
			},
		});
	}

	resetPassword() {
		this.messageService.add({
			severity: 'info',
			summary: 'Reset Password',
			detail: 'Password reset functionality will be implemented soon.',
		});
	}
}
