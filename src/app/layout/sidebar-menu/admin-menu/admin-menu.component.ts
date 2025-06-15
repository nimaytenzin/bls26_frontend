import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { AdminLayoutService } from '../../service/admin-layout.service';
import { ADMINSIDEBARITEMS } from '../../sidebarmenu';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuitemComponent } from '../admin-menuitem/admin-menuitem.component';

@Component({
	selector: 'app-admin-menu',
	templateUrl: './admin-menu.component.html',
	imports: [RouterModule, CommonModule, FormsModule, AdminMenuitemComponent],
})
export class AdminMenuComponent implements OnInit {
	model: any[] = [];

	constructor(public layoutService: AdminLayoutService) {}

	ngOnInit() {
		// console.log('GETTING ROLE ', this.authService.GetCurrentRole());
		// const userRole = this.authService.GetCurrentRole().name;
		// this.model = this.filterMenuItemsByRole(ADMINSIDEBARITEMS, userRole);
		this.model = ADMINSIDEBARITEMS;
		// console.log(userRole, this.model);
	}

	// private filterMenuItemsByRole(items: any[], role: string): any[] {
	// 	return items
	// 		.map((item) => {
	// 			if (item.items) {
	// 				return {
	// 					...item,
	// 					items: item.items.filter((subItem) =>
	// 						subItem.roles?.includes(role)
	// 					),
	// 				};
	// 			}
	// 			return item;
	// 		})
	// 		.filter((item) => item.items?.length);
	// }
}
