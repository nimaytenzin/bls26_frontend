import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
export class NavbarComponent implements OnInit, OnDestroy {
	APPNAME = APPNAME;
	isMenuOpen = false;
	scrolled = false;
	scrollPosition = 0;

	navItems = [
		{
			label: 'Home',
			route: '/',
			icon: 'pi-home',
		},

		{
			label: 'Data',
			route: '/data',
			icon: 'pi-database',
		},
		{
			label: 'Reports',
			route: '/reports',
			icon: 'pi-file-pdf',
		},
	];

	constructor(private router: Router) {}

	ngOnInit() {
		// Initialize scroll detection
		this.detectScroll();
	}

	ngOnDestroy() {
		// Cleanup if needed
	}

	@HostListener('window:scroll', ['$event'])
	onWindowScroll() {
		this.detectScroll();
	}

	/**
	 * Detect scroll position and update navbar appearance
	 */
	private detectScroll(): void {
		this.scrollPosition =
			window.pageYOffset ||
			document.documentElement.scrollTop ||
			document.body.scrollTop ||
			0;
		this.scrolled = this.scrollPosition > 50;
	}

	/**
	 * Toggle mobile menu with enhanced animations
	 */
	toggleMenu(): void {
		this.isMenuOpen = !this.isMenuOpen;

		// Prevent body scroll when menu is open
		if (this.isMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	}

	/**
	 * Close mobile menu with cleanup
	 */
	closeMenu(): void {
		this.isMenuOpen = false;
		document.body.style.overflow = '';
	}

	/**
	 * Enhanced navigation with smooth scroll for home
	 */
	navigateTo(route: string): void {
		if (route === '/' && this.router.url === '/') {
			// If already on home page, scroll to top smoothly
			this.scrollToTop();
		} else {
			this.router.navigate([route]);
		}
		this.closeMenu();
	}

	/**
	 * Navigate to login page
	 */
	goToLoginPage(): void {
		this.router.navigate(['/auth/login']);
		this.closeMenu();
	}

	/**
	 * Check if route is currently active
	 */
	isActiveRoute(route: string): boolean {
		if (route === '/') {
			return this.router.url === '/';
		}
		return this.router.url.startsWith(route);
	}

	/**
	 * Smooth scroll to top functionality
	 */
	private scrollToTop(): void {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}

	/**
	 * Handle search functionality (placeholder for future implementation)
	 */
	onSearch(): void {
		// TODO: Implement search functionality
		console.log('Search functionality to be implemented');
	}

	/**
	 * Get scroll progress percentage (for potential progress indicator)
	 */
	getScrollProgress(): number {
		const winScroll =
			document.body.scrollTop || document.documentElement.scrollTop;
		const height =
			document.documentElement.scrollHeight -
			document.documentElement.clientHeight;
		return (winScroll / height) * 100;
	}
}
