import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { AdminPgPaymentStepperComponent } from 'src/app/presentations/admin/payment/admin-pg-payment-stepper/admin-pg-payment-stepper.component';
import { AccordionModule } from 'primeng/accordion';
import { ViewPaymentAdviceComponent } from 'src/app/presentations/admin/transactions/shared-components/view-payment-advice/view-payment-advice.component';

@Component({
    selector: 'app-tenant-pending-payments',
    templateUrl: './tenant-pending-payments.component.html',
    styleUrls: ['./tenant-pending-payments.component.scss'],
    standalone: true,
    imports: [CommonModule, DividerModule, ButtonModule],
    providers: [DialogService, ConfirmationService, AccordionModule],
})
export class TenantPendingPaymentComponent implements OnInit {
    @Input({ required: true }) tenantId: number;
    ref: DynamicDialogRef | undefined;

    pendingPaymentAdvice: PaymentAdviceDto[] = [];
    totalAmountDue: number = 0;

    constructor(
        private paymentAdviceDataService: PaymentAdviceDataService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.findAllPendingPayments();
    }

    findAllPendingPayments() {
        this.totalAmountDue = 0;
        this.paymentAdviceDataService
            .GetPendingPaymentsByTenant(this.tenantId)
            .subscribe({
                next: (res) => {
                    this.pendingPaymentAdvice = res;
                    this.pendingPaymentAdvice.forEach((item) => {
                        this.totalAmountDue += item.amountDue;
                    });
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
                this.paymentAdviceDataService
                    .FindOne(paymentAdvice.id)
                    .subscribe((res) => {
                        this.ref = this.dialogService.open(
                            ViewPaymentAdviceComponent,
                            {
                                header: 'Payment Receipt',
                                data: {
                                    ...res,
                                },
                            }
                        );
                    });

                this.findAllPendingPayments();
            }
        });
    }

    openPaymentAdviceDetailModal(item: PaymentAdviceDto) {
        this.ref = this.dialogService.open(ViewPaymentAdviceComponent, {
            header: 'Payment Advice',
            data: { ...item },
        });
    }
}
