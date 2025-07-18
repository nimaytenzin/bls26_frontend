import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaymentTranscationDataService } from '../../../../core/dataservice/payment-transcation/payment-transcation.dataservice';
import { PaginatedData } from '../../../../core/utility/pagination.interface';
import { PaymentTransaction } from '../../../../core/dataservice/payment-settlement/payment-settlement.interface';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../primeng.modules';
import { FormsModule } from '@angular/forms';
import { PaymentTransactionStatistics } from '../../../../core/dataservice/payment-transcation/payment-transcation.interface';

@Component({
	selector: 'app-admin-master-transaction',
	templateUrl: './admin-master-transaction.component.html',
	styleUrls: ['./admin-master-transaction.component.css'],
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [MessageService, ConfirmationService],
})
export class AdminMasterTransactionComponent implements OnInit {
	currentPage: number = 1;
	pageSize: number = 10;

	isLoadingData: boolean = false;
	selectedDate: Date = new Date();

	transactionsPagination: PaginatedData<PaymentTransaction> | null = null;
	transactionStatistics: PaymentTransactionStatistics = {
		date: '',
		totalTransactions: 0,
		totalAmount: 0,
		totalOnline: 0,
		totalOnlineAmount: 0,
		totalCounter: 0,
		totalCounterAmount: 0,
	};

	constructor(
		private paymentTransactionService: PaymentTranscationDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.loadTransactionsByDate(this.selectedDate);
		this.loadStatisticsByDate(this.selectedDate);
	}

	loadStatisticsByDate(date: Date) {
		this.paymentTransactionService
			.getTransactionStatisticsByDate(this.formatDateForAPI(date))
			.subscribe({
				next: (response) => {
					this.transactionStatistics = response;
					console.log('Transaction statistics loaded:', response);
				},
				error: (error) => {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load transaction statistics',
					});
				},
			});
	}

	loadDataByDate(date: Date) {
		this.loadTransactionsByDate(date);
		this.loadStatisticsByDate(date);
	}
	/**
	 * Load transactions for selected date
	 */
	loadTransactionsByDate(date: Date) {
		if (this.isLoadingData) return;
		this.isLoadingData = true;

		const dateString = this.formatDateForAPI(date);

		this.paymentTransactionService
			.getPaymentTransactionPaginatedByDate(
				dateString,
				this.currentPage,
				this.pageSize
			)

			.subscribe({
				next: (response) => {
					this.transactionsPagination = response;
					this.isLoadingData = false;
					console.log('Transactions loaded:', response);
				},
				error: (error) => {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load transactions',
						life: 5000,
					});
				},
			});
	}

	formatDateForAPI(date: Date): string {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	onPageChange(event: any) {
		this.currentPage = event.page + 1;
		this.pageSize = event.rows;
		this.loadTransactionsByDate(this.selectedDate);
		this.loadStatisticsByDate(this.selectedDate);
	}

	onDateChange() {
		this.currentPage = 1;
		this.loadTransactionsByDate(this.selectedDate);
		this.loadStatisticsByDate(this.selectedDate);
	}
}
