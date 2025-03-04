import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import {
    DynamicDialogComponent,
    DynamicDialogRef,
    DialogService,
    DynamicDialogConfig,
} from 'primeng/dynamicdialog';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    ExtractMonthAndYear,
    GETMONTHNAME,
} from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-admin-generate-single-lease-payment-advice',
    templateUrl: './admin-generate-single-lease-payment-advice.component.html',
    styleUrls: ['./admin-generate-single-lease-payment-advice.component.css'],
    standalone: true,
    imports: [CalendarModule, ButtonModule, FormsModule, CommonModule],
})
export class AdminGenerateSingleLeasePaymentAdviceComponent implements OnInit {
    instance: DynamicDialogComponent | undefined;
    leaseAgreement: LeaseAgreeementDTO;

    date: Date;
    extractMonthYear = ExtractMonthAndYear;
    getMonthName = GETMONTHNAME;

    results: any[];
    constructor(
        private ref: DynamicDialogRef,
        private config: DynamicDialogConfig,
        private dialogService: DialogService,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private authService: AuthService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        this.leaseAgreement = this.config.data.leaseAgreement;
    }

    ngOnInit() {}

    generatePa() {
        const monthYear = this.extractMonthYear(this.date.toDateString());

        this.paymentAdviceDataService
            .GeneratePAForSingleLeaseByYearAndMonth(
                this.leaseAgreement.id,
                monthYear.month,
                monthYear.year
            )
            .subscribe((res: any) => {
                this.results = res;
                setTimeout(() => {
                    this.ref.close({
                        status: 200,
                    });
                }, 2000);
            });
    }

    formatDate(date: Date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
        }).format(date);
    }
}
