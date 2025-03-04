import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaymentAdviceSummaryDTO } from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminBuildingRentPaidPaymentAdvicesComponent } from '../components/admin-building-rent-paid-payment-advices/admin-building-rent-paid-payment-advices.component';
import { AdminBuildingRentPendingPaymentAdvicesComponent } from '../components/admin-building-rent-pending-payment-advices/admin-building-rent-pending-payment-advices.component';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { InputGroupModule } from 'primeng/inputgroup';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-admin-master-transactions-building-rent',
    templateUrl: './admin-master-transactions-building-rent.component.html',
    styleUrls: ['./admin-master-transactions-building-rent.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DividerModule,
        TabViewModule,
        AdminBuildingRentPaidPaymentAdvicesComponent,
        AdminBuildingRentPendingPaymentAdvicesComponent,
        ButtonModule,
        CalendarModule,
        FormsModule,
        InputGroupModule,
        TableModule,
    ],
})
export class AdminMasterTransactionsBuildingRentComponent implements OnInit {
    summaryStats: PaymentAdviceSummaryDTO = {
        totalMonthlyRentalIncome: 0,
        totalSecurityDepositAmount: 0,
        totalPendingRentalAmount: 0,
        totalPendingSecurityDepositAmount: 0,
    };

    selectedMonth: Date = new Date();
    selectedYear: Date = new Date();

    data = [];

    constructor(
        private paymentDataService: PaymentAdviceDataService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.paymentDataService
            .GetBuildingPaymentSummaryByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe({
                next: (res) => {
                    this.summaryStats = res;
                },
            });
    }
}
