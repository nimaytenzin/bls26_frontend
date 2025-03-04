import { Component, OnInit } from '@angular/core';
import { AdminLayoutService } from '../service/admin-layout.service';

@Component({
    selector: 'app-admin-footer',
    templateUrl: './admin-footer.component.html',
    styleUrls: ['./admin-footer.component.css'],
})
export class AdminFooterComponent implements OnInit {
    constructor(public layoutService: AdminLayoutService) {}

    ngOnInit() {}
}
