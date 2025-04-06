import { Component, OnInit } from '@angular/core';
import {
    ExpenseCategory,
    IncomeCategory,
    PaymentMethod,
    Transaction,
} from '../../admin-integrated-accounting-tool/admin-integrated-accounting-tool.component';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-admin-transaction-form',
    templateUrl: './admin-transaction-form.component.html',
    styleUrls: ['./admin-transaction-form.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        InputSwitchModule,
        FormsModule,
        CalendarModule,
        InputTextModule,
        InputTextareaModule,
        DropdownModule,
        ButtonModule,
    ],
})
export class AdminTransactionFormComponent implements OnInit {
    transaction: Partial<Transaction> = {
        date: new Date(),
        status: 'completed',
    };
    isIncome: boolean;
    incomeCategories = Object.values(IncomeCategory);
    expenseCategories = Object.values(ExpenseCategory);
    paymentMethods = Object.values(PaymentMethod);
    statusOptions = ['completed', 'pending', 'failed'];

    constructor(
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        private messageService: MessageService
    ) {
        this.isIncome = config.data?.type === 'income';
        this.transaction.type = config.data?.type || 'income';
    }

    ngOnInit(): void {}

    saveTransaction(): void {
        if (
            !this.transaction.description ||
            !this.transaction.amount ||
            !this.transaction.category
        ) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill all required fields',
            });
            return;
        }

        const newTransaction: Transaction = {
            id: Math.floor(Math.random() * 1000), // In a real app, this would come from your backend
            date: this.transaction.date || new Date(),
            description: this.transaction.description,
            amount: Number(this.transaction.amount),
            type: this.transaction.type as 'income' | 'expense',
            category: this.transaction.category,
            status: this.transaction.status as
                | 'completed'
                | 'pending'
                | 'failed',
            paymentMethod: this.transaction.paymentMethod,
            receiptNumber: this.transaction.receiptNumber,
            notes: this.transaction.notes,
        };

        this.ref.close(newTransaction);
    }

    cancel(): void {
        this.ref.close();
    }
}
