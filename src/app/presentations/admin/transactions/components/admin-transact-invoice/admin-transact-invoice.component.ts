import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import {
    INVOICETRANSACTIONMODES,
    INVOICETRANSACTIONTYPES,
} from 'src/app/core/constants/enums';
import { TransactionDataservice } from 'src/app/core/dataservice/payments/transaction.dataservice';
import { InvoiceDTO } from 'src/app/core/dto/payments/invoice/invoice.dto';
import { CreateTransactionDTO } from 'src/app/core/dto/payments/transaction/create-transaction.dto';

@Component({
    selector: 'app-admin-transact-invoice',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        InputNumberModule,
        InputTextModule,
        ToastModule,
        DropdownModule,
        ButtonModule,
        DialogModule,
        TableModule,
        CommonModule,
    ],
    providers: [MessageService],
    templateUrl: './admin-transact-invoice.component.html',
    styleUrls: ['./admin-transact-invoice.component.scss'],
})
export class AdminTransactInvoiceComponent implements OnInit {
    transactInvoiceForm: FormGroup;
    transactionModes = Object.values(INVOICETRANSACTIONMODES);
    transactionTypes = Object.values(INVOICETRANSACTIONTYPES);
    instance: DynamicDialogComponent | undefined;

    showErrors: boolean = false;

    isTenantPaymentMode: boolean;

    invoice: InvoiceDTO;

    createTransactionData: CreateTransactionDTO;

    constructor(
        private dialogService: DialogService,
        private fb: FormBuilder,
        public ref: DynamicDialogRef,
        private transactionDataService: TransactionDataservice
    ) {}

    ngOnInit() {
        this.transactInvoiceForm = this.fb.group({
            transactionMode: [null, Validators.required],
            transactionType: [null, Validators.required],
            transactionRef: [null, Validators.required],
        });

        this.instance = this.dialogService.getInstance(this.ref);
        this.invoice = this.instance.data;
        console.log(this.invoice);
    }

    transact() {
        console.log(
            this.transactInvoiceForm.get('transactionRef').invalid,
            this.transactInvoiceForm.get('transactionRef').touched
        );

        if (this.transactInvoiceForm.invalid) {
            this.showErrors = true;
            return;
        }
        this.createTransactionData = {
            invoiceId: this.invoice.id,
            transactionAmount: this.invoice.totalAmount,
            paymentMode:
                this.transactInvoiceForm.controls['transactionMode'].value,
            transactionType:
                this.transactInvoiceForm.controls['transactionType'].value,
            transactionRef:
                this.transactInvoiceForm.controls['transactionRef'].value,

            senderName: '',
            senderPhoneNumber: 0,
            senderBankName: '',
            senderAccountName: '',
            senderAccountNumber: '',

            receiverName: '',
            receiverPhoneNumber: 0,
            recieverBankName: '',
            receiverAccountName: '',
            receiverAccountNumber: '',

            transactionDate: '2022-02-23',
        };

        this.transactionDataService
            .CreateTransaction(this.createTransactionData)
            .subscribe({
                next: (res) => {
                    console.log(res);
                },
                error: (err) => {
                    console.log(err);
                },
            });

        console.log(this.createTransactionData);
    }
}
