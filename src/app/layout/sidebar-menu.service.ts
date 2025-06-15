import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({
	providedIn: 'root',
})
export class SidebarMenuService {
	constructor() {}

	getMenuItems(role: string): MenuItem[] {
		const fullMenu: MenuItem[] = [
			{
				label: 'Management',
				items: [
					{
						label: 'My Facilities',
						icon: 'pi pi-building',
						routerLink: '/facilities',
						visible: ['admin'].includes(role),
					},
					{
						label: 'Packages',
						icon: 'pi pi-box',
						routerLink: '/packages',
						visible: role === 'admin',
					},
					{
						label: 'Facilitators',
						icon: 'pi pi-users',
						routerLink: '/facilitators',
						visible: ['admin', 'owner'].includes(role),
					},
					{
						label: 'Enroll Child',
						icon: 'pi pi-user-plus',
						routerLink: '/enrollment',
						visible: ['admin', 'owner'].includes(role),
					},
				].filter((item) => item.visible),
			},
			{
				label: 'Attendance',
				items: [
					{
						label: 'Attendance',
						icon: 'pi pi-calendar',
						routerLink: '/attendance',
						visible: ['owner'].includes(role),
					},
					{
						label: 'Observations',
						icon: 'pi pi-eye',
						routerLink: '/observations',
						visible: ['owner'].includes(role),
					},
				].filter((item) => item.visible),
			},
			{
				label: 'Announcements',
				items: [
					{
						label: 'Post Activity',
						icon: 'pi pi-megaphone',
						routerLink: '/post-activity',
						visible: ['owner', 'admin'].includes(role),
					},
					{
						label: 'Announcements',
						icon: 'pi pi-bell',
						routerLink: '/announcement-events',
						visible: ['owner'].includes(role),
					},
				].filter((item) => item.visible),
			},
			{
				label: 'Reports & Billing',
				items: [
					{
						label: 'Invoices',
						icon: 'pi pi-file',
						routerLink: '/invoices',
						visible: ['owner', 'admin'].includes(role),
					},
					{
						label: 'Expenses',
						icon: 'pi pi-wallet',
						routerLink: '/expenses',
						visible: role === 'owner',
					},
				].filter((item) => item.visible),
			},
		];

		return fullMenu;
	}
}
