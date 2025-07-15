import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { PrimeNgModules } from '../../../../primeng.modules';
import { Router } from '@angular/router';
import { APPNAME } from '../../../../core/constants/constants';

@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
})
export class NavbarComponent {
	items: MenuItem[];
	APPNAME = APPNAME;

	constructor(private router: Router) {
		this.items = [
			{
				label: 'Home',
				icon: 'pi pi-home',
				styleClass: 'text-gray-300 hover:text-blue-500',
				routerLink: ['/'],
			},
			{
				label: 'Movies',
				icon: 'pi pi-video',
				styleClass: 'text-gray-300 hover:text-blue-500',
				routerLink: ['/movies'],
			},

			{
				label: 'How to Book Tickets',
				icon: 'pi pi-info-circle',
				styleClass: 'text-gray-300 hover:text-blue-500',
				routerLink: ['/guide'],
			},
		];
	}

	goToLoginPage() {
		this.router.navigate(['auth/login']);
	}
}
