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
	constructor(
		private messageService: MessageService,
		private config: DynamicDialogConfig,
		private ref: DynamicDialogRef
	) {
		this.booking = this.config.data.booking;
		console.log('Booking data:', this.booking);
	}

	closeModal(): void {
		this.ref.close();
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
