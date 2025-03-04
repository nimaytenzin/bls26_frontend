import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import {
    DynamicDialogComponent,
    DynamicDialogRef,
    DialogService,
} from 'primeng/dynamicdialog';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    ExtractMonthAndYear,
    GETMONTHNAME,
} from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-admin-generate-unit-lease-payment-advice',
    templateUrl: './admin-generate-unit-lease-payment-advice.component.html',
    styleUrls: ['./admin-generate-unit-lease-payment-advice.component.css'],
    standalone: true,
    imports: [CalendarModule, ButtonModule, FormsModule, CommonModule],
})
export class AdminGenerateUnitLeasePaymentAdviceComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;
    date: Date;
    extractMonthYear = ExtractMonthAndYear;
    getMonthName = GETMONTHNAME;

    results: any[];
    constructor(
        private ref: DynamicDialogRef,
        private dialogService: DialogService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private authService: AuthService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
    }

    ngOnInit() {}

    generatePa() {
        const monthYear = this.extractMonthYear(this.date.toDateString());

        this.paymentAdviceDataService
            .GeneratePAForUnitLeaseByAdminYearAndMonth(
                this.authService.GetCurrentRole().adminId,
                monthYear.month,
                monthYear.year
            )
            .subscribe((res: any) => {
                this.results = res;
                setTimeout(() => {
                    this.ref.close({
                        status: 200,
                    });
                }, 1);
            });
    }

    formatDate(date: Date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
        }).format(date);
    }
}
