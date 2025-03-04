import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { TenantPaymentReceiptComponent } from '../../../shared/tenant-payment-receipt/tenant-payment-receipt.component';

@Component({
    selector: 'app-tenant-payment-paid-payments',
    templateUrl: './tenant-payment-paid-payments.component.html',
    styleUrls: ['./tenant-payment-paid-payments.component.scss'],
    standalone: true,
    imports: [DividerModule, CommonModule, ButtonModule],
    providers: [DialogService],
})
export class TenantPaymentPaidPaymentsComponent implements OnInit {
    @Input({
        required: true,
    })
    tenantId: number;

    paidPayments: PaymentAdviceDto[] = [];
    ref: DynamicDialogRef;
    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.findAllPaidByTenant();
    }

    findAllPaidByTenant() {
        console.log('PAID AdVICE');
        this.paymentAdviceDataService
            .GetPaidPaymentsByTenant(this.tenantId)
            .subscribe({
                next: (res) => {
                    console.log(res);
                    console.log('PENDING AdVICE');
                    this.paidPayments = res;
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    viewReceipt() {
        this.ref = this.dialogService.open(TenantPaymentReceiptComponent, {
            header: 'Payment Receipt',
        });
    }
}
