import { Component, Input, OnInit } from '@angular/core';
import { AdminUnitPendingPaymentsComponent } from './sub-components/admin-unit-pending-payments/admin-unit-pending-payments.component';
import { AdminUnitPaidPaymentsComponent } from './sub-components/admin-unit-paid-payments/admin-unit-paid-payments.component';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';

@Component({
    selector: 'app-admin-unit-payments',
    templateUrl: './admin-unit-payments.component.html',
    styleUrls: ['./admin-unit-payments.component.css'],
    standalone: true,
    imports: [
        AdminUnitPendingPaymentsComponent,
        AdminUnitPaidPaymentsComponent,
        DividerModule,
        TabViewModule,
    ],
})
export class AdminUnitPaymentsComponent implements OnInit {
    @Input({ required: true }) unitId: number;

    constructor() {}

    ngOnInit() {}
}
