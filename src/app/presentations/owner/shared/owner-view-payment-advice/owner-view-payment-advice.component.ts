import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import {
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ZHIDHAYCONTACTDETAILS } from 'src/app/core/constants/constants';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';

@Component({
    selector: 'app-view-payment-advice',
    templateUrl: './owner-view-payment-advice.component.html',
    styleUrls: ['./owner-view-payment-advice.component.scss'],
    standalone: true,
    imports: [DividerModule, CommonModule, TableModule, ButtonModule],
})
export class OwnerViewPaymentAdviceComponent implements OnInit {
    paymentAdvice: PaymentAdviceDto;
    companyDetails = ZHIDHAYCONTACTDETAILS;
    ref: DynamicDialogRef;

    constructor(
        private config: DynamicDialogConfig,
        private dialogService: DialogService
    ) {
        this.paymentAdvice = this.config.data;
    }

    ngOnInit() {
        console.log('PASSED PA', this.paymentAdvice);
    }
}
