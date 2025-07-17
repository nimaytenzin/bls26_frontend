import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../primeng.modules';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import { Booking } from '../../../../core/dataservice/booking/booking.interface';

@Component({
	selector: 'app-counter-staff-scan-ticket',
	templateUrl: './counter-staff-scan-ticket.component.html',
	styleUrls: ['./counter-staff-scan-ticket.component.css'],
	imports: [CommonModule, PrimeNgModules, ZXingScannerModule],
	// Standalone: true if using Angular standalone components
})
export class CounterStaffScanTicketComponent {
	isScanning = false;
	scannedResult: string | null = null;
	booking: Booking | null = null;
	currentDevice: MediaDeviceInfo | undefined;

	constructor(private bookingService: BookingDataService) {}

	qrResult: string | null = null;

	onScanSuccess(result: string): void {
		this.qrResult = result;
		console.log('QR Code scanned:', result);

		this.bookingService.scanTicket(result).subscribe({
			next: (booking) => {
				console.log('Booking data:', booking);
				this.booking = booking;
			},
			error: (error) => {
				console.error('Error scanning ticket:', error);
			},
		});
		// Add your logic to process the scanned QR code data
	}
}
