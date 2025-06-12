import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { AdminLayoutService } from '../service/admin-layout.service';

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
	userProfile = {
		name: 'Charmi Cheda',
		role: 'Producer',
		email: 'charmi.cheda@moviebooking.bt',
		phone: '+975 17123456',
		avatar: 'profile/charmi.jpg',
		joinDate: new Date('2023-05-15'),
		department: 'Content Production',
		location: 'Thimphu, Bhutan',
	};

	constructor(
		public layoutService: AdminLayoutService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService
	) {}

	logout() {}

	resetPassword() {}
}
