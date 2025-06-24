import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import {
	Booking,
	BookingStatusEnum,
	EntryStatusEnum,
} from '../../../../core/dataservice/booking/booking.interface';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../primeng.modules';

@Component({
	selector: 'app-admin-master-bookings',
	templateUrl: './admin-master-bookings.component.html',
	styleUrls: ['./admin-master-bookings.component.css'],
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminMasterBookingsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	bookings: Booking[] = [];
	loading = false;

	// PrimeNG Table columns
	cols = [
		{ field: 'id', header: 'ID' },
		{ field: 'name', header: 'Customer Name' },
		{ field: 'phoneNumber', header: 'Phone' },
		{ field: 'email', header: 'Email' },
		{ field: 'amount', header: 'Amount' },
		{ field: 'bookingStatus', header: 'Status' },
		{ field: 'entryStatus', header: 'Entry Status' },
		{ field: 'createdAt', header: 'Booking Date' },
	];

	constructor(
		private bookingDataService: BookingDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.loadBookings();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadBookings() {
		this.loading = true;
		this.bookingDataService
			.findAllBookings()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (bookings) => {
					this.bookings = bookings;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading bookings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load bookings',
					});
					this.loading = false;
				},
			});
	}

	getStatusSeverity(status: BookingStatusEnum): string {
		switch (status) {
			case BookingStatusEnum.SUCCESS:
				return 'success';
			case BookingStatusEnum.PROCESSING:
				return 'warning';
			case BookingStatusEnum.FAILED:
			case BookingStatusEnum.CANCELLED:
				return 'danger';
			case BookingStatusEnum.TIMEOUT:
				return 'info';
			default:
				return 'info';
		}
	}

	getEntryStatusSeverity(status: EntryStatusEnum): string {
		switch (status) {
			case EntryStatusEnum.ENTERED:
				return 'success';
			case EntryStatusEnum.VALID:
				return 'info';
			default:
				return 'info';
		}
	}

	formatDate(date: any): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	formatCurrency(amount: number): string {
		return `Nu. ${amount?.toFixed(2) || '0.00'}`;
	}

	refreshBookings() {
		this.loadBookings();
	}

	// Count methods for statistics
	getBookingsCount(): number {
		return this.bookings.length;
	}

	getSuccessfulBookingsCount(): number {
		return this.bookings.filter(
			(booking) => booking.bookingStatus === BookingStatusEnum.SUCCESS
		).length;
	}

	getProcessingBookingsCount(): number {
		return this.bookings.filter(
			(booking) => booking.bookingStatus === BookingStatusEnum.PROCESSING
		).length;
	}

	getFailedBookingsCount(): number {
		return this.bookings.filter(
			(booking) =>
				booking.bookingStatus === BookingStatusEnum.FAILED ||
				booking.bookingStatus === BookingStatusEnum.CANCELLED
		).length;
	}
}
