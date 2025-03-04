import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { PaymentAdviceSummaryDTO } from 'src/app/core/dto/payments/payment-advice.dto';

@Component({
    selector: 'app-admin-payment-advice-rent-master',
    templateUrl: './admin-payment-advice-rent-master.component.html',
    styleUrls: ['./admin-payment-advice-rent-master.component.css'],
    standalone: true,
    imports: [CommonModule, DividerModule, TabViewModule],
})
export class AdminPaymentAdviceRentMasterComponent implements OnInit {
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
