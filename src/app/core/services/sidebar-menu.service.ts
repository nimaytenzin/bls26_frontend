import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarMenuService {
  constructor(private authService: AuthService) {}

  getMenuItems(role: string): MenuItem[] {
    const dashboardItem: MenuItem = {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: this.authService.getRedirectPathByRole(role),
      visible: ['admin', 'owner', 'parent', 'facilitator'].includes(role),
    };

    const fullMenu: MenuItem[] = [
      dashboardItem,
      {
        label: 'Management',
        items: [
          {
            label: 'My Facilities',
            icon: 'pi pi-building',
            routerLink: '/facilities',
            visible: ['admin', 'owner'].includes(role),
          },
          {
            label: 'Packages',
            icon: 'pi pi-box',
            routerLink: '/packages',
            visible: role === 'owner',
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
        ].filter(item => item.visible),
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
        ].filter(item => item.visible),
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
        ].filter(item => item.visible),
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

        ].filter(item => item.visible),
      },

			// Parent-only top-level items
      {
        label: 'Child',
        icon: 'pi pi-users',
        routerLink: '/child',
        visible: role === 'parent',
      },
      {
        label: 'Parent',
        icon: 'pi pi-user',
        routerLink: '/parent',
        visible: role === 'parent',
      },
      {
        label: 'Guardian',
        icon: 'pi pi-shield',
        routerLink: '/guardian',
        visible: role === 'parent',
      },
      {
        label: 'Enroll',
        icon: 'pi pi-user-plus',
        routerLink: '/enrollment',
        visible: role === 'parent',
      },
      {
        label: 'Pass',
        icon: 'pi pi-ticket',
        routerLink: '/passes',
        visible: role === 'parent',
      },
			{
        label: 'payment',
        icon: 'pi pi-money-bill',
        routerLink: '/make-payment',
        visible: role === 'parent',
      },
    ];

    return fullMenu.filter(section => !section.items || section.items.length > 0);
  }
}
