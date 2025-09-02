import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { APPNAME } from '../../../../core/constants/constants';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	standalone: true,
	imports: [CommonModule, ButtonModule],
})
export class NavbarComponent {
	APPNAME = APPNAME;
	isMenuOpen = false;

	navItems = [
		{
			label: 'Home',
			route: '/',
		},
		{
			label: 'Movies',
			route: '/movies',
		},
		{
			label: 'How to Book',
			route: '/guide',
		},
	];

	constructor(private router: Router) {}

	toggleMenu() {
		this.isMenuOpen = !this.isMenuOpen;
	}

	closeMenu() {
		this.isMenuOpen = false;
	}

	navigateTo(route: string) {
		this.router.navigate([route]);
		this.closeMenu();
	}

	goToLoginPage() {
		this.router.navigate(['auth/login']);
		this.closeMenu();
	}

	isActiveRoute(route: string): boolean {
		if (route === '/') {
			return this.router.url === '/';
		}
		return this.router.url.startsWith(route);
	}
}
