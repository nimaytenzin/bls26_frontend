import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { NOTIFICATIONTYPES, PAYMENTMODES } from 'src/app/core/constants/enums';
import { NotificationService } from 'src/app/core/dataservice/notification/notification.service';
import { PaymentAdviceDataService } from 'src/app/core/dataservice/payments/payment-advice.dataservice';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import {
    PaymentAdviceDto,
    ReceivePaymentDTO,
} from 'src/app/core/dto/payments/payment-advice.dto';

@Component({
    selector: 'app-admin-receive-payment-payment-advice-modal',
    templateUrl: './admin-receive-payment-payment-advice-modal.component.html',
    styleUrls: ['./admin-receive-payment-payment-advice-modal.component.css'],
    standalone: true,
    imports: [
        DropdownModule,
        InputNumberModule,
        InputTextModule,
        InputTextareaModule,
        CommonModule,
        DividerModule,
        ButtonModule,
        ReactiveFormsModule,
        CheckboxModule,
        ConfirmDialogModule,
    ],
    providers: [ConfirmationService],
})
export class AdminReceivePaymentPaymentAdviceModalComponent implements OnInit {
    receivePaymentForm: FormGroup;
    paymentModes = Object.values(PAYMENTMODES);

    isSubmitting = false;
    paymentAdvices: PaymentAdviceDto[];
    paymentAdviceIds: number[];
    totalAmount: number = 0;
    totalAmountDue: number = 0;

    constructor(
        private fb: FormBuilder,
        private ref: DynamicDialogRef,
        private config: DynamicDialogConfig,
        private paymentAdviceDataService: PaymentAdviceDataService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private notificationService: NotificationService,
        private authService: AuthService
    ) {
        this.receivePaymentForm = this.fb.group({
            mode: ['', Validators.required],
            refNo: ['', Validators.required],
            amount: ['', Validators.required],
            isVerified: [false, Validators.required],
            remarks: [''],
        });
        this.paymentAdvices = this.config.data;

        if (!this.paymentAdvices[0].leaseAgreement) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input Data',
                detail: 'Missing Lease Agreement in the PA passed.',
            });
            this.ref.close();
        }

        this.paymentAdviceIds = this.paymentAdvices.map((advice) => advice.id);
        for (let item of this.paymentAdvices) {
            this.totalAmount += item.totalAmount;
            this.totalAmountDue += item.amountDue;
        }

        this.receivePaymentForm.patchValue({
            amount: this.totalAmountDue,
        });
    }

    ngOnInit() {}

    close() {
        this.ref.close();
    }

    getTotalAmount() {
        let total = 0;
        for (let item of this.paymentAdvices) {
            total += item.amountDue;
        }
        return total;
    }

    confirmReceivePayment() {
        if (this.receivePaymentForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: 'Please enter all required fields marked with *',
            });
            return;
        }

        if (!this.receivePaymentForm.controls['isVerified'].value) {
            this.messageService.add({
                severity: 'error',
                summary: 'Unverified Transaction',
                detail: 'Please check the is verified checkbox.',
            });
            return;
        }

        this.isSubmitting = true;

        const data: ReceivePaymentDTO = {
            paymentAdviceIds: this.paymentAdviceIds,
            amount: this.receivePaymentForm.controls['amount'].value,
            paymentMode: this.receivePaymentForm.controls['mode'].value,
            remarks: this.receivePaymentForm.controls['remarks'].value,
            refNo: this.receivePaymentForm.controls['refNo'].value,
            receivedBy: this.authService.GetAuthenticatedUser().id,
            isVerified: this.receivePaymentForm.controls['isVerified'].value,
        };

        if (
            Number(this.receivePaymentForm.controls['amount'].value) !==
            this.totalAmountDue
        ) {
            this.confirmationService.confirm({
                target: event.target as EventTarget,
                message:
                    'Payment advice amount and transaction amount mismatch. Do you still want to transact?',
                header: 'Amount Mismatch',
                icon: 'pi pi-exclamation-triangle',
                rejectButtonStyleClass: 'p-button-text',
                accept: () => {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Confirmed',
                        detail: 'Proceeding with unmatched transaction and payment advice amount',
                    });
                    this.processPayment(data);
                },
                reject: () => {
                    this.isSubmitting = false;
                },
            });
        } else {
            this.processPayment(data);
        }
    }

    processPayment(data: ReceivePaymentDTO) {
        this.paymentAdviceDataService.ReceivePayment(data).subscribe({
            next: (res) => {
                this.notificationService
                    .SendNotification({
                        fromUserId: this.authService.GetCurrentRole().adminId,
                        toUserId:
                            this.paymentAdvices[0].leaseAgreement.tenantId,
                        notificationType:
                            NOTIFICATIONTYPES.PAYMENT_RECEIPT_GENERATION,
                        paymentReceiptId: res.id,
                    })
                    .subscribe((resp) => {
                        if (resp) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Notification Sent',
                                detail: 'Payment Received notification sent to tenant',
                            });
                        }
                    });
                this.messageService.add({
                    severity: 'success',
                    summary: 'Payment Received',
                    detail: 'Payment has been successfully processed.',
                });
                this.ref.close({
                    status: 200,
                });
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Payment processing failed. Please try again.',
                });
                this.isSubmitting = false;
            },
            complete: () => {
                this.isSubmitting = false;
            },
        });
    }
}
