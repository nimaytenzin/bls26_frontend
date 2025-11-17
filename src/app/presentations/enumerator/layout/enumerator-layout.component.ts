import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { PrimeNgModules } from '../../../primeng.modules';
import { AuthService } from '../../../core/dataservice/auth/auth.service';
import { User } from '../../../core/dataservice/auth/auth.interface';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'app-enumerator-layout',
	templateUrl: './enumerator-layout.component.html',
	styleUrls: ['./enumerator-layout.component.css'],
	standalone: true,
	imports: [CommonModule, RouterModule, PrimeNgModules],
})
export class EnumeratorLayoutComponent implements OnInit {
	currentUser: User | null = null;
	activeTab: string = 'active-surveys';
	showHeader: boolean = true;
	showBottomNav: boolean = true;

	constructor(private authService: AuthService, private router: Router) {}

	ngOnInit() {
		this.currentUser = this.authService.getCurrentUser();
		this.setActiveTabFromRoute();
		this.checkHeaderVisibility();
		this.checkBottomNavVisibility();

		// Listen to route changes
		this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe(() => {
				this.setActiveTabFromRoute();
				this.checkHeaderVisibility();
				this.checkBottomNavVisibility();
			});
	}

	/**
	 * Check if header should be visible based on current route
	 */
	checkHeaderVisibility() {
		const url = this.router.url;
		const hideHeaderRoutes = [
			'/enumerator/survey/',
			'/enumerator/survey-enumeration-area-detail/',
			'/enumerator/household-listing-form/',
		];

		this.showHeader = !hideHeaderRoutes.some((route) => url.includes(route));
	}

	/**
	 * Check if bottom nav should be visible based on current route
	 */
	checkBottomNavVisibility() {
		const url = this.router.url;
		const hideBottomNavRoutes = [
			'/enumerator/survey/',
			'/enumerator/survey-enumeration-area-detail/',
			'/enumerator/household-listing-form/',
		];

		this.showBottomNav = !hideBottomNavRoutes.some((route) =>
			url.includes(route)
		);
	}

	/**
	 * Set active tab based on current route
	 */
	setActiveTabFromRoute() {
		const url = this.router.url;
		if (url.includes('past-surveys')) {
			this.activeTab = 'past-surveys';
		} else if (url.includes('profile')) {
			this.activeTab = 'profile';
		} else {
			this.activeTab = 'active-surveys';
		}
	}

	/**
	 * Navigate to a tab
	 */
	navigateToTab(tab: string) {
		this.activeTab = tab;
		switch (tab) {
			case 'active-surveys':
				this.router.navigate(['/enumerator']);
				break;
			case 'past-surveys':
				this.router.navigate(['/enumerator/past-surveys']);
				break;
			case 'profile':
				this.router.navigate(['/enumerator/profile']);
				break;
		}
	}

	/**
	 * Logout user
	 */
	logout() {
		this.authService.logout();
		this.router.navigate(['/auth/login']);
	}

	/**
	 * Get initials from user name
	 */
	getUserInitials(): string {
		if (!this.currentUser?.name) return 'U';
		const names = this.currentUser.name.split(' ');
		if (names.length >= 2) {
			return (names[0][0] + names[names.length - 1][0]).toUpperCase();
		}
		return this.currentUser.name.charAt(0).toUpperCase();
	}
}
