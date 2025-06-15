import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AdminLayoutService } from '../service/admin-layout.service';
import { Router } from '@angular/router';

import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SidebarModule } from 'primeng/sidebar';
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
		SidebarModule,
		DialogModule,
		FormsModule,
		InputTextModule,
		AvatarModule,
	],
	providers: [ConfirmationService, MessageService],
})
export class AdminTopbarComponent {
	items!: MenuItem[];
	@ViewChild('menubutton') menuButton!: ElementRef;

	@ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

	@ViewChild('topbarmenu') menu!: ElementRef;

	profileSideBarVisible: boolean = false;

	isNotVerified: boolean = false;

	// Dummy user profile with Bhutanese name
	userProfile: User | null;

	constructor(
		public layoutService: AdminLayoutService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService,
		private authService: AuthService,
		private router: Router
	) {
		this.userProfile = this.authService.getCurrentUser();
	}

	logout() {
		this.confirmationService.confirm({
			target: event?.target as EventTarget,
			message: 'Are you sure you want to sign out?',
			header: 'Confirm Sign Out',
			icon: 'pi pi-sign-out',
			acceptIcon: 'none',
			rejectIcon: 'none',
			rejectButtonStyleClass: 'p-button-text',
			accept: () => {
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
				});
			},
			reject: () => {
				// User cancelled logout - do nothing
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
