import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogRef, DialogService } from 'primeng/dynamicdialog';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminPgPaymentStepperComponent } from 'src/app/presentations/admin/payment/admin-pg-payment-stepper/admin-pg-payment-stepper.component';

@Component({
    selector: 'app-tenant-payment-pending-payment-list',
    templateUrl: './tenant-payment-pending-payment-list.component.html',
    styleUrls: ['./tenant-payment-pending-payment-list.component.scss'],
    standalone: true,
    providers: [DialogService, ConfirmationService],
    imports: [CommonModule, ButtonModule, DividerModule],
})
export class TenantPaymentPendingPaymentListComponent implements OnInit {
    @Input({ required: true }) tenantId: number;
    ref: DynamicDialogRef | undefined;

    pendingPaymentAdvice: PaymentAdviceDto[] = [];
    totalAmountDue: number = 0;

    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.findAllPendingByUnit();
    }

    findAllPendingByUnit() {
        this.paymentAdviceDataService
            .GetPendingPaymentsByTenant(this.tenantId)
            .subscribe({
                next: (res) => {
                    // console.log('PENDING AdVICE');
                    // console.log(res);
                    // this.pendingPaymentAdvice = res;
                    // this.pendingPaymentAdvice.forEach((item) => {
                    //     this.totalAmountDue += item.amountDue;
                    // });
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }

    openPaymentGatewayPaymentModal(paymentAdvice: PaymentAdviceDto) {
        this.ref = this.dialogService.open(AdminPgPaymentStepperComponent, {
            header: 'Process Payment',
            width: '600px',
            data: { ...paymentAdvice },
        });

        this.ref.onClose.subscribe((res) => {
            if (res && res.status === 200) {
                alert('PADI');
            }
        });
    }
}
