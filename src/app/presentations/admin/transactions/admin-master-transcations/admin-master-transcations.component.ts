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
	private destroy$ = new Subject<void>();

	// Data
	loading = false;
	isLoadingData = false; // Flag to prevent multiple simultaneous requests
	private lastLoadTime = 0; // Track last load time to prevent rapid calls

	// Date selection
	selectedDate: Date | null = null;
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
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit() {
		this.selectedDate = new Date(); // Default to today
		// Load today's transactions by default
		this.loadTodaysTransactions();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load today's transactions
	 */
	loadTodaysTransactions() {
		if (this.isLoadingData) return;

		this.loading = true;
		this.isLoadingData = true;

		this.paymentTransactionService
			.getTodaysPaymentTransactionPaginated(this.currentPage, this.pageSize)
			.subscribe({
				next: (response) => {
					console.log(
						'Successfully loaded',
						response.data.length,
						'transactions'
					);
					this.transactionsPagination = response;
					this.totalRecords = response.pagination.totalCount;
					this.isLoadingData = false;
					this.loading = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Loaded ${response.data.length} transactions for today`,
						life: 3000,
					});
				},
				error: (error) => {
					console.error("Error loading today's transactions:", error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: "Failed to load today's transactions",
						life: 5000,
					});
				},
			});
	}

	/**
	 * Load transactions for selected date
	 */
	loadTransactionsByDate() {
		if (this.isLoadingData) {
			return;
		}
		if (!this.selectedDate) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Date Required',
				detail: 'Please select a date',
				life: 3000,
			});
			return;
		} else {
			this.loading = true;
			this.isLoadingData = true;
			this.currentPage = 1; // Reset to first page

			const dateString = this.formatDateForAPI(this.selectedDate ?? new Date());

			this.paymentTransactionService
				.getPaymentTransactionPaginatedByDate(
					dateString,
					this.currentPage,
					this.pageSize
				)

				.subscribe({
					next: (response) => {
						this.transactionsPagination = response;
						this.totalRecords = response.pagination.totalCount;

						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Loaded ${
								response.data.length
							} transactions for ${this.formatDate(
								this.selectedDate ?? new Date()
							)}`,
							life: 3000,
						});
					},
					error: (error) => {
						console.error('Error loading transactions by date:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: `Failed to load transactions for ${this.formatDate(
								this.selectedDate ?? new Date()
							)}`,
							life: 5000,
						});
					},
				});
		}
	}

	/**
	 * Handle pagination
	 */
	onPageChange(event: any) {
		if (this.isLoadingData) {
			return;
		}

		this.currentPage = event.page + 1;
		this.pageSize = event.rows;

		// Check if current date is today
		const today = new Date();
		const isToday = this.isSameDate(this.selectedDate!, today);

		this.loading = true;
		this.isLoadingData = true;

		if (isToday) {
			this.paymentTransactionService
				.getTodaysPaymentTransactionPaginated(this.currentPage, this.pageSize)
				.pipe(
					takeUntil(this.destroy$),
					finalize(() => {
						this.loading = false;
						this.isLoadingData = false;
					})
				)
				.subscribe({
					next: (response) => {
						this.transactionsPagination = response;
						this.totalRecords = response.pagination.totalCount;
					},
					error: (error) => {
						console.error('Error loading paginated transactions:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to load transactions',
							life: 5000,
						});
					},
				});
		} else {
			const dateString = this.formatDateForAPI(this.selectedDate ?? new Date());
			this.paymentTransactionService
				.getPaymentTransactionPaginatedByDate(
					dateString,
					this.currentPage,
					this.pageSize
				)
				.pipe(
					takeUntil(this.destroy$),
					finalize(() => {
						this.loading = false;
						this.isLoadingData = false;
					})
				)
				.subscribe({
					next: (response) => {
						this.transactionsPagination = response;
						this.totalRecords = response.pagination.totalCount;
					},
					error: (error) => {
						console.error('Error loading paginated transactions:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to load transactions',
							life: 5000,
						});
					},
				});
		}
	}

	/**
	 * Handle date selection change
	 */
	onDateChange() {
		console.log('onDateChange called');

		// Prevent rapid calls (debounce)
		const now = Date.now();
		if (now - this.lastLoadTime < 1000) {
			// 1 second cooldown
			console.log('Skipping due to cooldown period');
			return;
		}
		this.lastLoadTime = now;

		if (!this.selectedDate) {
			return;
		}

		// Check if selected date is today
		const today = new Date();
		const isToday = this.isSameDate(this.selectedDate, today);

		if (isToday) {
			this.loadTodaysTransactions();
		} else {
			this.loadTransactionsByDate();
		}
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

	private isSameDate(date1: Date, date2: Date): boolean {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	}

	private convertToCSV(transactions: PaymentTransaction[]): string {
		const headers = [
			'Transaction ID',
			'Booking ID',
			'Amount',
			'Status',
			'Payment Method',
			'Gateway Transaction ID',
			'Created At',
			'Updated At',
		];

		const csvContent = [
			headers.join(','),
			...transactions.map((t) =>
				[
					t.id || '',
					t.bookingId || '',
					t.amount || 0,
					t.status || '',
					t.paymentMode || '',
					t.gatewayTransactionId || '',
					this.formatDateTime(t.createdAt || ''),
					this.formatDateTime(t.updatedAt || ''),
				]
					.map((field) => `"${field}"`)
					.join(',')
			),
		].join('\n');

		return csvContent;
	}
}
