import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, finalize, debounceTime } from 'rxjs';
import { PaymentTransaction } from '../../../../core/dataservice/payment-settlement/payment-settlement.interface';
import { PaymentTranscationDataService } from '../../../../core/dataservice/payment-transcation/payment-transcation.dataservice';
import { PaginatedData } from '../../../../core/utility/pagination.interface';
import { PrimeNgModules } from '../../../../primeng.modules';

@Component({
	selector: 'app-admin-master-transcations',
	templateUrl: './admin-master-transcations.component.html',
	styleUrls: ['./admin-master-transcations.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminMasterTranscationsComponent implements OnInit {
	// Data
	isLoadingData = false; // Flag to prevent multiple simultaneous requests
	private lastLoadTime = 0; // Track last load time to prevent rapid calls

	// Date selection
	selectedDate: Date = new Date();
	maxDate: Date = new Date();

	// Pagination
	transactionsPagination: PaginatedData<PaymentTransaction> | null = null;
	currentPage = 1;
	pageSize = 25;
	totalRecords = 0;

	// Summary data
	dailySummary = {
		totalTransactions: 0,
		totalAmount: 0,
		successfulTransactions: 0,
		failedTransactions: 0,
	};

	constructor(
		private paymentTransactionService: PaymentTranscationDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.loadTransactionsByDate(this.selectedDate);
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
			.pipe(
				finalize(() => {
					this.isLoadingData = false;
				})
			)
			.subscribe({
				next: (response) => {
					this.transactionsPagination = response;
					this.totalRecords = response.pagination.totalCount;
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

	onPageChange(event: any) {
		this.currentPage = event.page + 1;
		this.pageSize = event.rows;
		this.loadTransactionsByDate(this.selectedDate);
	}

	onDateChange() {
		this.currentPage = 1;
		this.loadTransactionsByDate(this.selectedDate);
	}

	/**
	 * Utility methods
	 */
	formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	formatDateForAPI(date: Date): string {
		return date.toISOString().split('T')[0]; // YYYY-MM-DD format
	}

	formatDateTime(dateTime: string | Date): string {
		if (!dateTime) return 'N/A';
		const date = new Date(dateTime);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	}

	formatCurrency(amount: number): string {
		return `Nu. ${amount?.toLocaleString() || 0}`;
	}

	getStatusSeverity(status: string): string {
		switch (status?.toUpperCase()) {
			case 'SUCCESS':
			case 'COMPLETED':
				return 'success';
			case 'PENDING':
			case 'PROCESSING':
				return 'warning';
			case 'FAILED':
			case 'CANCELLED':
				return 'danger';
			default:
				return 'info';
		}
	}
}
