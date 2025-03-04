import { Component, OnInit } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { AdminLeaseSearchByTenantComponent } from '../components/admin-lease-search-by-tenant/admin-lease-search-by-tenant.component';
import { AdminLeaseSearchByPlotComponent } from '../components/admin-lease-search-by-plot/admin-lease-search-by-plot.component';

@Component({
    selector: 'app-admin-search-lease',
    templateUrl: './admin-search-lease.component.html',
    styleUrls: ['./admin-search-lease.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        AdminLeaseSearchByTenantComponent,
        AdminLeaseSearchByPlotComponent,
    ],
})
export class AdminSearchLeaseComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
