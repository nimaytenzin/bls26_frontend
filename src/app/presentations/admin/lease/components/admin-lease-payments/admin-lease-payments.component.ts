import { Component, Input } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { AdminLeasePendingPaymentsComponent } from '../admin-lease-pending-payments/admin-lease-pending-payments.component';
import { AdminLeasePaidPaymentsComponent } from '../admin-lease-paid-payments/admin-lease-paid-payments.component';

@Component({
    selector: 'app-admin-lease-payments',
    templateUrl: './admin-lease-payments.component.html',
    styleUrls: ['./admin-lease-payments.component.css'],
    standalone: true,
    imports: [
        TabViewModule,
        AdminLeasePendingPaymentsComponent,
        AdminLeasePaidPaymentsComponent,
    ],
})
export class AdminLeasePaymentsComponent {
    @Input({
        required: true,
    })
    leaseAgreement: LeaseAgreeementDTO;
}
