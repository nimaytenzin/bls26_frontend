import { Component, ElementRef, OnInit } from '@angular/core';
import { AdminLayoutService } from '../service/admin-layout.service';
import { AdminMenuComponent } from '../sidebar-menu/admin-menu/admin-menu.component';
import { DividerModule } from 'primeng/divider';
import { APPNAME, APPSLOGAN } from '../../core/constants/constants';

@Component({
	selector: 'app-admin-sidebar',
	templateUrl: './admin-sidebar.component.html',
	imports: [AdminMenuComponent, DividerModule],
})
export class AdminSidebarComponent {
	appName = APPNAME;
	appSlogan = APPSLOGAN;
	constructor(
		public layoutService: AdminLayoutService,
		public el: ElementRef
	) {}
}
