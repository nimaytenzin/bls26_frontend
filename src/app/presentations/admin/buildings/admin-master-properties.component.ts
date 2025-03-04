import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
    selector: 'app-admin-master-properties',
    standalone: true,
    imports: [RouterModule, BreadcrumbModule],
    templateUrl: './admin-master-properties.component.html',
    styleUrls: ['./admin-master-properties.component.css'],
})
export class AdminMasterPropertiesComponent implements OnInit {
    constructor(private route: ActivatedRoute) {}

    ngOnInit() {}
}
