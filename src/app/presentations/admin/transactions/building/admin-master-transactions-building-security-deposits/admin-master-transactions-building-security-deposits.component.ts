import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputGroupModule } from 'primeng/inputgroup';
import { TabViewModule } from 'primeng/tabview';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaymentAdviceSummaryDTO } from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminBuildingSecurityDepositPaidPaymentAdviceComponent } from '../components/admin-building-security-deposit-paid-payment-advice/admin-building-security-deposit-paid-payment-advice.component';
import { AdminBuildingSecurityDepositPendingPaymentAdviceComponent } from '../components/admin-building-security-deposit-pending-payment-advice/admin-building-security-deposit-pending-payment-advice.component';

@Component({
    selector: 'app-admin-master-transactions-building-security-deposits',
    templateUrl:
        './admin-master-transactions-building-security-deposits.component.html',
    styleUrls: [
        './admin-master-transactions-building-security-deposits.component.css',
    ],
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        InputGroupModule,
        TabViewModule,
        CalendarModule,
        FormsModule,
        AdminBuildingSecurityDepositPaidPaymentAdviceComponent,
        AdminBuildingSecurityDepositPendingPaymentAdviceComponent,
    ],
})
export class AdminMasterTransactionsBuildingSecurityDepositsComponent
    implements OnInit
{
    summaryStats: PaymentAdviceSummaryDTO = {
        totalMonthlyRentalIncome: 0,
        totalSecurityDepositAmount: 0,
        totalPendingRentalAmount: 0,
        totalPendingSecurityDepositAmount: 0,
    };

    selectedMonth: Date = new Date();
    selectedYear: Date = new Date();

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
