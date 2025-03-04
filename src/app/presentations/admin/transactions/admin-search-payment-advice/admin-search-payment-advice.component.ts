import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { AdminPaymentAdviceSearchByBuildingComponent } from '../components/admin-payment-advice-search-by-building/admin-payment-advice-search-by-building.component';
import { AdminPaymentAdviceSearchByTenantComponent } from '../components/admin-payment-advice-search-by-tenant/admin-payment-advice-search-by-tenant.component';
import { AdminPaymentAdviceSearchByPlotComponent } from '../components/admin-payment-advice-search-by-plot/admin-payment-advice-search-by-plot.component';

@Component({
    selector: 'app-admin-search-payment-advice',
    templateUrl: './admin-search-payment-advice.component.html',
    styleUrls: ['./admin-search-payment-advice.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        CommonModule,
        AdminPaymentAdviceSearchByPlotComponent,
        AdminPaymentAdviceSearchByTenantComponent,
    ],
})
export class AdminSearchPaymentAdviceComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
