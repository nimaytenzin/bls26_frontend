import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
	ADMINSIDEBARITEMS,
	THEATREMANAGERSIDEBARITEMS,
	EXECUTIVEPRODUCERSIDEBARITEMS,
	COUNTERSTAFFSIDEBARITEMS,
	USERROLESENUM,
} from '../sidebarmenu';
import { UserRole } from '../../core/dataservice/auth/auth.interface';

@Injectable({
	providedIn: 'root',
})
export class RoleBasedMenuService {
	private currentMenuSubject = new BehaviorSubject<any[]>([]);
	public currentMenu$ = this.currentMenuSubject.asObservable();

	constructor() {}

	/**
	 * Get menu items based on user role
	 */
	getMenuByRole(role: USERROLESENUM): any[] {
		switch (role) {
			case USERROLESENUM.ADMIN:
			case USERROLESENUM.SUPERADMIN:
				return ADMINSIDEBARITEMS;

			case USERROLESENUM.THEATRE_MANAGER:
			case USERROLESENUM.MANAGER:
				return THEATREMANAGERSIDEBARITEMS;

			case USERROLESENUM.EXECUTIVE_PRODUCER:
				return EXECUTIVEPRODUCERSIDEBARITEMS;

			case USERROLESENUM.COUNTER_STAFF:
				return COUNTERSTAFFSIDEBARITEMS;

			default:
				return [];
		}
	}

	/**
	 * Set current menu based on user role
	 */
	setMenuForRole(role: USERROLESENUM): void {
		const menu = this.getMenuByRole(role);
		this.currentMenuSubject.next(menu);
	}

	/**
	 * Get current menu items
	 */
	getCurrentMenu(): any[] {
		return this.currentMenuSubject.value;
	}

	/**
	 * Filter menu items by user permissions
	 */
	filterMenuByPermissions(menuItems: any[], userPermissions: string[]): any[] {
		return menuItems
			.map((menuGroup) => ({
				...menuGroup,
				items: menuGroup.items?.filter(
					(item: any) =>
						!item.permissions ||
						item.permissions.some((permission: string) =>
							userPermissions.includes(permission)
						)
				),
			}))
			.filter((menuGroup) => menuGroup.items && menuGroup.items.length > 0);
	}

	/**
	 * Get role-specific dashboard route
	 */
	getDashboardRoute(role: USERROLESENUM): string {
		switch (role) {
			case USERROLESENUM.ADMIN:
			case USERROLESENUM.SUPERADMIN:
				return '/admin';

			case USERROLESENUM.THEATRE_MANAGER:
			case USERROLESENUM.MANAGER:
				return '/theatre-manager';

			case USERROLESENUM.EXECUTIVE_PRODUCER:
				return '/executive-producer';

			case USERROLESENUM.COUNTER_STAFF:
				return '/counter-staff';

			default:
				return '/';
		}
	}

	/**
	 * Check if user has access to specific route
	 */
	hasRouteAccess(route: string, userRole: USERROLESENUM): boolean {
		const menu = this.getMenuByRole(userRole);

		return menu.some((menuGroup) =>
			menuGroup.items?.some(
				(item: any) => item.routerLink && item.routerLink.includes(route)
			)
		);
	}
}
