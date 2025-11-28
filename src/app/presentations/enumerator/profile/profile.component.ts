import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PrimeNgModules } from '../../../primeng.modules';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import { User } from '../../../core/dataservice/auth/auth.interface';
import { MessageService } from 'primeng/api';

@Component({
	selector: 'app-enumerator-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class EnumeratorProfileComponent implements OnInit {
	currentUser: User | null = null;

	constructor(
		private authService: AuthService,
		private router: Router,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.currentUser = this.authService.getCurrentUser();
	}

	/**
	 * Get user initials
	 */
	getUserInitials(): string {
		if (!this.currentUser?.name) return 'U';
		const names = this.currentUser.name.split(' ');
		if (names.length >= 2) {
			return (names[0][0] + names[names.length - 1][0]).toUpperCase();
		}
		return this.currentUser.name.charAt(0).toUpperCase();
	}

	/**
	 * Logout user
	 */
	logout() {
		this.authService.logout();
		this.router.navigate(['/auth/login']);
	}
}
