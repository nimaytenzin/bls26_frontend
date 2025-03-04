import { Component, ElementRef, OnInit } from '@angular/core';
import { AdminLayoutService } from '../service/admin-layout.service';

@Component({
    selector: 'app-admin-sidebar',
    templateUrl: './admin-sidebar.component.html',
})
export class AdminSidebarComponent {
    constructor(
        public layoutService: AdminLayoutService,
        public el: ElementRef
    ) {}
}
