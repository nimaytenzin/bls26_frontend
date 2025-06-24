import { OnInit } from '@angular/core';
import { Component, OnDestroy } from '@angular/core';
import { AdminLayoutService } from '../../service/admin-layout.service';
import { RoleBasedMenuService } from '../../service/role-based-menu.service';
import { ADMINSIDEBARITEMS, USERROLESENUM } from '../../sidebarmenu';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuitemComponent } from '../admin-menuitem/admin-menuitem.component';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/dataservice/auth/auth.service';

@Component({
	selector: 'app-admin-menu',
	templateUrl: './admin-menu.component.html',
	imports: [RouterModule, CommonModule, FormsModule, AdminMenuitemComponent],
})
export class AdminMenuComponent implements OnInit, OnDestroy {
	model: any[] = [];
	private destroy$ = new Subject<void>();

	constructor(
		public layoutService: AdminLayoutService,
		private roleBasedMenuService: RoleBasedMenuService,
		private authService: AuthService
	) {}

	ngOnInit() {
		// Subscribe to menu changes
		this.roleBasedMenuService.currentMenu$
			.pipe(takeUntil(this.destroy$))
			.subscribe((menu) => {
				this.model = menu;
			});

		// Get current user role and set appropriate menu
		// TODO: Uncomment when AuthService is available
		// const currentUser = this.authService.getCurrentUser();
		// if (currentUser && currentUser.role) {
		//   this.roleBasedMenuService.setMenuForRole(currentUser.role as USERROLESENUM);
		// } else {
		//   // Default to admin menu for now
		//   this.roleBasedMenuService.setMenuForRole(USERROLESENUM.ADMIN);
		// }

		// Temporary: Set admin menu as default
		this.roleBasedMenuService.setMenuForRole(USERROLESENUM.ADMIN);
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Method to manually switch user role (for testing purposes)
	 */
	switchRole(role: USERROLESENUM) {
		this.roleBasedMenuService.setMenuForRole(role);
	}
}
