import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ConfirmationService,
    MenuItem,
    Message,
    MessageService,
} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { StepsModule } from 'primeng/steps';
import { RMAPGDataService } from 'src/app/core/dataservice/rma-pg/rma-pg.dataservice';
import { PG_Bank, PG_RCMessage } from 'src/app/core/dto/rma-pg/rma.pg.dto';
import { StepperModule } from 'primeng/stepper';
import { RadioButtonModule } from 'primeng/radiobutton';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { PaymentAdviceDto } from 'src/app/core/dto/payments/payment-advice.dto';
import { InputOtpModule } from 'primeng/inputotp';
import { TableModule } from 'primeng/table';
import { MessagesModule } from 'primeng/messages';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import { ListboxModule } from 'primeng/listbox';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-admin-pg-payment-stepper',
    templateUrl: './admin-pg-payment-stepper.component.html',
    styleUrls: ['./admin-pg-payment-stepper.component.scss'],
    styles: [``],
    standalone: true,
    imports: [
        ButtonModule,
        CommonModule,
        FormsModule,
        InputNumberModule,
        StepperModule,
        RadioButtonModule,
        InputOtpModule,
        TableModule,
        CheckboxModule,
        MessagesModule,
        DividerModule,
        ListboxModule,
        DialogModule,
        InputTextModule,
    ],
    providers: [ConfirmationService],
})
export class AdminPgPaymentStepperComponent implements OnInit {
    active: number | undefined = 0;
    instance: DynamicDialogComponent | undefined;
    loadingModal: boolean = false;
    loadingModalMessage: string;

    bankList = [];
    paymentAdvice: PaymentAdviceDto;
    authorizationResponse: PG_RCMessage;
    selectedBank: PG_Bank;
    transactionId: number;
    accountNumber: number;
    otp: number;

    deductAmout: number = 0.1;
    accountDetailsSent: boolean = false;
    errored: boolean = false;
    errorMessage: string;

    constructor(
        private rmaPgDataService: RMAPGDataService,
        private messageService: MessageService,
        private ref: DynamicDialogRef,
        private dialogService: DialogService,
        private confirmationService: ConfirmationService,
        private bankAccountDataService: BankAccountDataService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        this.paymentAdvice = this.instance.data;
        this.bankList = bankAccountDataService.BankListWithLogo;
        console.log('PAYMENT ADIVCE PASSED', this.paymentAdvice);
    }

    ngOnInit() {
        this.sendAuthorizationRequest();
    }
    sendAuthorizationRequest() {
        this.errored = false;
        this.errorMessage = '';
        this.rmaPgDataService
            .SendAuthorizationRequest({
                amount: this.deductAmout,
                paymentAdviceIds: [this.paymentAdvice.id],
            })
            .subscribe({
                next: (res) => {
                    this.authorizationResponse = res;
                },
                error: (err) => {
                    setTimeout(() => {
                        this.errored = true;
                        this.errorMessage = 'Error!! ' + err.error.message;
                    }, 2000);
                },
            });
    }

    selectBank(bank: PG_Bank) {
        this.selectedBank = bank;
    }

    getBankLogo(bankName: string) {
        let result = this.bankList.find((item) => item.bankName === bankName);
        return result ? result.logourl : '';
    }

    sendBankAccountDetails(nextCallBack) {
        if (!this.accountNumber) {
            alert('no acc');
        } else {
            this.loadingModalMessage =
                'Please wait... we are sending an OTP to the phone number linked with the account..';
            this.loadingModal = true;
        }
        this.rmaPgDataService
            .SendAccountDetails({
                transactionId: this.authorizationResponse.bfs_bfsTxnId,
                bankCode: this.selectedBank.bankCode,
                accountNumber: this.accountNumber.toString(),
            })
            .subscribe({
                next: (res) => {
                    console.log(res);
                    this.accountDetailsSent = true;
                    this.loadingModal = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'OTP Sent',
                        detail: 'An OTP has been sent to the linked phone number.',
                    });
                    nextCallBack.emit();
                },
                error: (err) => {
                    console.log(err);
                    this.loadingModal = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                },
            });
    }

    sendOtp() {
        this.loadingModalMessage = '...verifying OTP. Please wait.';
        this.loadingModal = true;
        this.rmaPgDataService
            .SendOtp({
                transactionId: this.authorizationResponse.bfs_bfsTxnId,
                otp: this.otp.toString(),
                paymentAdviceId: this.paymentAdvice.id,
            })
            .subscribe({
                next: (res) => {
                    console.log('AR REPOSNE');
                    console.log(res);
                    if (res.bfs_debitAuthCode === '00') {
                        this.loadingModal = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Payment Successful',
                            detail: 'Payment is successful',
                        });
                        this.ref.close({ status: 200 });
                    }
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }
}
