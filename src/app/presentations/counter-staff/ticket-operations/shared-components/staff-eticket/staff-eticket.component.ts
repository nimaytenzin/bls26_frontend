import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { Booking } from '../../../../../core/dataservice/booking/booking.interface';
import {
	DialogService,
	DynamicDialogConfig,
	DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';

@Component({
	selector: 'app-staff-eticket',
	templateUrl: './staff-eticket.component.html',
	styleUrls: ['./staff-eticket.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService, DialogService],
})
export class StaffEticketComponent {
	booking: Booking | undefined;
	resendingETicket = false;

	constructor(
		private messageService: MessageService,
		private config: DynamicDialogConfig,
		private ref: DynamicDialogRef,
		private bookingService: BookingDataService
	) {
		this.booking = this.config.data.booking;
		console.log('Booking data:', this.booking);
	}

	closeModal(): void {
		this.ref.close();
	}

	canResendETicket(): boolean {
		if (!this.booking) return false;
		// Only allow for valid screenings
		const now = new Date();
		const screening = this.booking.screening;
		if (!screening?.date || !screening?.endTime) return false;
		const screeningDate = new Date(screening.date);
		const [endHours, endMinutes] = screening.endTime.split(':').map(Number);
		screeningDate.setHours(endHours, endMinutes, 0, 0);
		return now <= screeningDate;
	}

	resendETicketHandler(): void {
		if (!this.booking?.id) return;
		this.resendingETicket = true;
		this.bookingService.resendEticket(this.booking.id).subscribe({
			next: () => {
				this.resendingETicket = false;
				this.messageService.add({
					severity: 'success',
					summary: 'eTicket Sent',
					detail: 'eTicket has been resent to the customer.',
				});
			},
			error: () => {
				this.resendingETicket = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Failed',
					detail: 'Failed to resend eTicket. Please try again.',
				});
			},
		});
	}

	getBookingSeatsText(booking: Booking): string {
		if (!booking.bookingSeats || booking.bookingSeats.length === 0) {
			return 'N/A';
		}

		return booking.bookingSeats
			.map((bookingSeat: any) => `${bookingSeat.seat?.seatNumber}`)
			.join(', ');
	}

	formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-BT', {
			style: 'currency',
			currency: 'BTN',
			minimumFractionDigits: 0,
		}).format(amount);
	}

	getStatusClass(status: string): string {
		switch (status?.toLowerCase()) {
			case 'confirmed':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
}
