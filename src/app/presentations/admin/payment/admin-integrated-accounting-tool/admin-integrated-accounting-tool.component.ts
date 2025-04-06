// admin-integrated-accounting-tool.component.ts
import { Component, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AdminTransactionFormComponent } from '../components/admin-transaction-form/admin-transaction-form.component';

export interface Transaction {
    id: number;
    date: Date;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    status: 'completed' | 'pending' | 'failed';
    studentId?: number;
    paymentMethod?: string;
    receiptNumber?: string;
    notes?: string;
}

export enum IncomeCategory {
    TUITION = 'Tuition',
    DONATION = 'Donation',
    GRANT = 'Grant',
    OTHER = 'Other',
}

export enum ExpenseCategory {
    SALARIES = 'Salaries',
    SUPPLIES = 'Supplies',
    FOOD = 'Food',
    UTILITIES = 'Utilities',
    RENT = 'Rent',
    MAINTENANCE = 'Maintenance',
    OTHER = 'Other',
}

export enum PaymentMethod {
    CASH = 'Cash',
    CHECK = 'Cheque',
    BANK_TRANSFER = 'Bank Transfer',
    CREDIT_CARD = 'Credit Card',
    MOBILE_PAYMENT = 'Mobile Payment',
}

@Component({
    selector: 'app-admin-integrated-accounting-tool',
    templateUrl: './admin-integrated-accounting-tool.component.html',
    styleUrls: ['./admin-integrated-accounting-tool.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        InputTextModule,
        ChartModule,
        ToastModule,
        ProgressBarModule,
        DialogModule,
        DropdownModule,
        TagModule,
        ButtonModule,
        FormsModule,
    ],
    providers: [MessageService, DialogService],
})
export class AdminIntegratedAccountingToolComponent implements OnInit {
    ref: DynamicDialogRef | undefined;
    currentDate = new Date();
    selectedPeriod: any = { name: 'This Month', code: 'month' };
    periods = [
        { name: 'Today', code: 'day' },
        { name: 'This Week', code: 'week' },
        { name: 'This Month', code: 'month' },
        { name: 'This Year', code: 'year' },
    ];

    financialSummary = {
        totalIncome: 125000,
        totalExpenses: 85000,
        netBalance: 40000,
        outstandingTuition: 32000,
    };

    recentTransactions: Transaction[] = [
        {
            id: 1,
            date: new Date(),
            description: 'Tuition - Tenzin Wangmo',
            amount: 5000,
            type: 'income',
            category: 'Tuition',
            status: 'completed',
        },
        {
            id: 2,
            date: new Date(),
            description: 'Educational Toys Purchase',
            amount: 12000,
            type: 'expense',
            category: 'Supplies',
            status: 'completed',
        },
        {
            id: 3,
            date: new Date(),
            description: 'Donation - Local Business',
            amount: 10000,
            type: 'income',
            category: 'Donation',
            status: 'completed',
        },
        {
            id: 4,
            date: new Date(),
            description: 'Staff Salary - April',
            amount: 45000,
            type: 'expense',
            category: 'Salaries',
            status: 'pending',
        },
        {
            id: 5,
            date: new Date(),
            description: 'Snacks for April',
            amount: 3500,
            type: 'expense',
            category: 'Food',
            status: 'completed',
        },
    ];

    incomeSources = [
        { name: 'Tuition', amount: 100000, color: '#6366F1' },
        { name: 'Donations', amount: 20000, color: '#8B5CF6' },
        { name: 'Other', amount: 5000, color: '#A78BFA' },
    ];

    expenseCategories = [
        { name: 'Salaries', amount: 50000, color: '#EC4899' },
        { name: 'Supplies', amount: 20000, color: '#F43F5E' },
        { name: 'Food', amount: 10000, color: '#F97316' },
        { name: 'Utilities', amount: 5000, color: '#F59E0B' },
    ];

    incomeChartData: ChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Income',
                data: [100000, 120000, 110000, 125000, 130000, 140000],
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366F1',
                tension: 0.4,
            },
        ],
    };

    expenseChartData: ChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Expenses',
                data: [80000, 85000, 90000, 85000, 82000, 80000],
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                borderColor: '#F43F5E',
                tension: 0.4,
            },
        ],
    };

    chartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context) => `Nu.${context.raw}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `Nu.${value}`,
                },
            },
        },
    };

    constructor(
        private messageService: MessageService,
        private dialogService: DialogService
    ) {}

    ngOnInit(): void {}

    computePercentage() {
        return (
            (Math.abs(this.financialSummary.netBalance) /
                this.financialSummary.totalIncome) *
            100
        );
    }

    openNewTransactionDialog(type: 'income' | 'expense'): void {
        this.ref = this.dialogService.open(AdminTransactionFormComponent, {
            header: `Record New ${type === 'income' ? 'Income' : 'Expense'}`,
            data: { type },
            contentStyle: { 'max-height': '90vh', overflow: 'auto' },
        });
        this.ref.onClose.subscribe((transaction: Transaction) => {
            if (transaction) {
                this.recentTransactions.unshift(transaction);
                this.updateFinancialSummary(transaction);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Transaction recorded successfully',
                });
            }
        });
    }

    updateFinancialSummary(transaction: Transaction): void {
        if (transaction.type === 'income') {
            this.financialSummary.totalIncome += transaction.amount;
            this.financialSummary.netBalance += transaction.amount;
        } else {
            this.financialSummary.totalExpenses += transaction.amount;
            this.financialSummary.netBalance -= transaction.amount;
        }
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'danger';
            default:
                return 'info';
        }
    }

    getTransactionIcon(category: string): string {
        switch (category) {
            case 'Tuition':
                return 'pi pi-user';
            case 'Donation':
                return 'pi pi-heart';
            case 'Salaries':
                return 'pi pi-money-bill';
            case 'Supplies':
                return 'pi pi-shopping-cart';
            case 'Food':
                return 'pi pi-apple';
            default:
                return 'pi pi-dollar';
        }
    }

    ngOnDestroy(): void {
        if (this.ref) {
            this.ref.close();
        }
    }
}
