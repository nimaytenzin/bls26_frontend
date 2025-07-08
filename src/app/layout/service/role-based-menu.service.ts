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
		console.log('getMenuByRole called with role:', role);

		let menu: any[] = [];

		switch (role) {
			case USERROLESENUM.ADMIN:
			case USERROLESENUM.SUPERADMIN:
				menu = ADMINSIDEBARITEMS;
				console.log('Returning ADMINSIDEBARITEMS');
				break;

			case USERROLESENUM.THEATRE_MANAGER:
			case USERROLESENUM.MANAGER:
				menu = THEATREMANAGERSIDEBARITEMS;
				console.log('Returning THEATREMANAGERSIDEBARITEMS');
				break;

			case USERROLESENUM.EXECUTIVE_PRODUCER:
				menu = EXECUTIVEPRODUCERSIDEBARITEMS;
				console.log('Returning EXECUTIVEPRODUCERSIDEBARITEMS');
				break;

			case USERROLESENUM.COUNTER_STAFF:
				menu = COUNTERSTAFFSIDEBARITEMS;
				console.log('Returning COUNTERSTAFFSIDEBARITEMS');
				break;

			default:
				console.warn('Unknown role, returning empty menu:', role);
				menu = [];
				break;
		}

		console.log('Menu items count:', menu.length);
		return menu;
	}

	/**
	 * Set current menu based on user role
	 */
	setMenuForRole(role: USERROLESENUM): void {
		const menu = this.getMenuByRole(role);
		this.currentMenuSubject.next(menu);
	}

	/**
	 * Convert UserRole to USERROLESENUM and set menu
	 */
	setMenuForUserRole(userRole: UserRole): void {
		console.log('setMenuForUserRole called with:', userRole);

		// Convert UserRole to USERROLESENUM - they should have the same string values
		const roleString = userRole as string;
		const userroleEnum = roleString as USERROLESENUM;

		console.log('Role string:', roleString);
		console.log('Converted to USERROLESENUM:', userroleEnum);
		console.log(
			'Available USERROLESENUM values:',
			Object.values(USERROLESENUM)
		);

		// Verify the role exists in USERROLESENUM
		if (Object.values(USERROLESENUM).includes(userroleEnum)) {
			console.log('Role found, setting menu for:', userroleEnum);
			this.setMenuForRole(userroleEnum);
		} else {
			console.warn(
				`UserRole ${userRole} not found in USERROLESENUM, defaulting to ADMIN`
			);
			this.setMenuForRole(USERROLESENUM.ADMIN);
		}
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
