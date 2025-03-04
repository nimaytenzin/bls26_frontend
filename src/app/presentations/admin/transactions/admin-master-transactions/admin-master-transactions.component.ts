import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { AdminPaymentAdvicePendingListComponent } from '../components/admin-payment-advice-pending-list/admin-payment-advice-pending-list.component';
import { AdminPaymentAdvicePaidListComponent } from '../components/admin-payment-advice-paid-list/admin-payment-advice-paid-list.component';
import { AdminPaymentAdviceSearchByBuildingComponent } from '../components/admin-payment-advice-search-by-building/admin-payment-advice-search-by-building.component';
import { AdminPaymentAdviceSearchByTenantComponent } from '../components/admin-payment-advice-search-by-tenant/admin-payment-advice-search-by-tenant.component';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaymentAdviceSummaryDTO } from 'src/app/core/dto/payments/payment-advice.dto';
import { CommonModule } from '@angular/common';
import { AdminPaymentAdviceSearchByPlotComponent } from '../components/admin-payment-advice-search-by-plot/admin-payment-advice-search-by-plot.component';

@Component({
    selector: 'app-admin-master-transactions',
    templateUrl: './admin-master-transactions.component.html',
    styleUrls: ['./admin-master-transactions.component.css'],
    imports: [
        ButtonModule,
        DividerModule,
        AdminPaymentAdvicePendingListComponent,
        AdminPaymentAdvicePaidListComponent,

        TabViewModule,
        CommonModule,
    ],
    standalone: true,
})
export class AdminMasterTransactionsComponent implements OnInit {
    summaryStats: PaymentAdviceSummaryDTO = {
        totalMonthlyRentalIncome: 0,
        totalSecurityDepositAmount: 0,
        totalPendingRentalAmount: 0,
        totalPendingSecurityDepositAmount: 0,
    };

    constructor(
        private paymentDataService: PaymentAdviceDataService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.paymentDataService
            .GetPaymentAdviceSummaryByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe({
                next: (res) => {
                    this.summaryStats = res;
                },
            });
    }
}
