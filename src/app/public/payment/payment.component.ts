import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { ChipModule } from 'primeng/chip';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as QRCode from 'qrcode';
// import {
// 	BookingDetails,
// 	Ticket,
// 	Movie,
// 	Screening,
// } from '../../core/models/movie.interface';

@Component({
	selector: 'app-payment',
	templateUrl: './payment.component.html',
	styleUrls: ['./payment.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		ButtonModule,
		CardModule,
		InputTextModule,
		ProgressSpinnerModule,
		DialogModule,
		ChipModule,
		DropdownModule,
		ToastModule,
	],
	providers: [MessageService],
})
export class PaymentComponent implements OnInit, OnDestroy {
	// bookingDetails: BookingDetails | null = null;
	// movie: Movie | null = null;
	// screening: Screening | null = null;
	// customerForm: FormGroup;
	// paymentForm: FormGroup;
	// processing = false;
	// currentStep = 1; // 1: Customer Info, 2: Payment, 3: Success
	// ticket: Ticket | null = null;

	// // RMA Payment Gateway properties
	// paymentStep = 1; // 1: Bank Selection, 2: Account Entry, 3: OTP Verification
	// selectedBank: any = null;
	// accountNumber = '';
	// otpCode = '';
	// otpSent = false;
	// countdown = 0;
	// countdownInterval: any;

	// // Bank options for RMA Payment Gateway
	// banks = [
	// 	{ name: 'Bank of Bhutan', code: 'BOB', logo: '/assets/banks/bob.png' },
	// 	{
	// 		name: 'Bhutan National Bank',
	// 		code: 'BNB',
	// 		logo: '/assets/banks/bnb.png',
	// 	},
	// 	{ name: 'Druk PNB Bank', code: 'DPNB', logo: '/assets/banks/dpnb.png' },
	// 	{ name: 'T-Bank', code: 'TBANK', logo: '/assets/banks/tbank.png' },
	// ];

	// // Trailer properties
	// showTrailerDialog = false;
	// safeTrailerUrl: SafeResourceUrl | null = null;

	// // QR Code properties
	// qrCodeDataURL: string = '';

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private sanitizer: DomSanitizer,
		private messageService: MessageService
	) {
		// this.customerForm = this.fb.group({
		// 	name: ['', [Validators.required, Validators.minLength(2)]],
		// 	email: ['', [Validators.required, Validators.email]],
		// 	phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
		// });
		// this.paymentForm = this.fb.group({
		// 	selectedBank: ['', Validators.required],
		// 	accountNumber: ['', [Validators.required]],
		// 	otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
		// });
	}

	ngOnInit() {
		// if (!this.bookingDetails) {
		// 	this.router.navigate(['/']);
		// 	return;
		// }
		// // Load movie and screening details
		// this.loadMovieDetails();
		// this.loadScreeningDetails();
	}

	ngOnDestroy() {
		// if (this.countdownInterval) {
		// 	clearInterval(this.countdownInterval);
		// }
	}

	// private loadMovieDetails() {
	// 	if (!this.bookingDetails) return;
	// }

	// private loadScreeningDetails() {
	// 	if (!this.bookingDetails) return;
	// }

	// nextStep() {
	// 	if (this.currentStep === 1 && this.customerForm.valid) {
	// 		this.bookingDetails!.customerInfo = this.customerForm.value;
	// 		this.currentStep = 2;
	// 	}
	// }

	// previousStep() {
	// 	if (this.currentStep === 2) {
	// 		this.currentStep = 1;
	// 	}
	// }

	// processPayment() {
	// 	if (!this.bookingDetails) return;

	// 	this.processing = true;
	// }

	// downloadTicket() {
	// 	if (!this.ticket) return;

	// 	const ticketData = {
	// 		id: this.ticket.id,
	// 		movie: this.ticket.movieTitle,
	// 		theatre: this.ticket.theatreName,
	// 		date: this.ticket.date,
	// 		time: this.ticket.time,
	// 		seats: this.ticket.seats.join(', '),
	// 		amount: this.ticket.totalAmount,
	// 	};

	// 	const dataStr = JSON.stringify(ticketData, null, 2);
	// 	const dataBlob = new Blob([dataStr], { type: 'application/json' });
	// 	const url = URL.createObjectURL(dataBlob);

	// 	const link = document.createElement('a');
	// 	link.href = url;
	// 	link.download = `movie-ticket-${this.ticket.id}.json`;
	// 	link.click();

	// 	URL.revokeObjectURL(url);
	// }

	// goHome() {
	// 	this.router.navigate(['/']);
	// }

	// formatCurrency(amount: number): string {
	// 	return `Nu. ${amount.toFixed(2)}`;
	// }

	// formatSeats(seats: string[]): string {
	// 	return seats.join(', ');
	// }

	// getSelectedSeatIds(): string {
	// 	if (!this.bookingDetails?.selectedSeats) return '';
	// 	return this.bookingDetails.selectedSeats.map((seat) => seat.id).join(', ');
	// }

	// getMovieTitle(): string {
	// 	return this.movie?.title || 'Loading...';
	// }

	// getTheatreName(): string {
	// 	return this.screening?.theatreName || 'Loading...';
	// }

	// getHallName(): string {
	// 	return this.screening?.hallName || 'Loading...';
	// }

	// getScreeningDateTime(): string {
	// 	if (!this.screening) return 'Loading...';
	// 	const date = new Date(this.screening.date).toLocaleDateString();
	// 	return `${date} at ${this.screening.time}`;
	// }

	// getTotalAmount(): number {
	// 	if (!this.bookingDetails) return 0;
	// 	return this.bookingDetails.selectedSeats.reduce(
	// 		(total, seat) => total + seat.price,
	// 		0
	// 	);
	// }

	// goBackToSeats() {
	// 	if (this.bookingDetails?.screeningId) {
	// 		this.router.navigate(['/select-seats', this.bookingDetails.screeningId]);
	// 	} else {
	// 		this.router.navigate(['/']);
	// 	}
	// }

	// RMA Payment Gateway Methods
	// selectBank(bank: any) {
	// 	this.selectedBank = bank;
	// 	this.paymentForm.patchValue({ selectedBank: bank });
	// 	this.paymentStep = 2;
	// }

	// proceedToAccountEntry() {
	// 	if (this.selectedBank) {
	// 		this.paymentStep = 2;
	// 	}
	// }

	// proceedToOTP() {
	// 	const accountNumber = this.paymentForm.get('accountNumber')?.value;
	// 	if (accountNumber) {
	// 		this.accountNumber = accountNumber;
	// 		this.sendOTP();
	// 		this.paymentStep = 3;
	// 	} else {
	// 		this.messageService.add({
	// 			severity: 'error',
	// 			summary: 'Invalid Account',
	// 			detail: 'Please enter a valid account number.',
	// 		});
	// 	}
	// }

	// sendOTP() {
	// 	this.otpSent = true;
	// 	this.countdown = 60;
	// 	this.startCountdown();

	// 	this.messageService.add({
	// 		severity: 'success',
	// 		summary: 'OTP Sent',
	// 		detail: `OTP has been sent to your registered mobile number ending with ***${this.accountNumber.slice(
	// 			-3
	// 		)}`,
	// 	});
	// }

	// resendOTP() {
	// 	if (this.countdown === 0) {
	// 		this.sendOTP();
	// 	}
	// }

	// startCountdown() {
	// 	this.countdownInterval = setInterval(() => {
	// 		this.countdown--;
	// 		if (this.countdown === 0) {
	// 			clearInterval(this.countdownInterval);
	// 		}
	// 	}, 1000);
	// }

	// verifyOTP() {
	// 	const otpCode = this.paymentForm.get('otpCode')?.value;
	// 	if (otpCode && otpCode.length === 6) {
	// 		this.otpCode = otpCode;
	// 		// Simulate OTP verification
	// 		this.processing = true;
	// 		setTimeout(() => {
	// 			this.processPayment();
	// 		}, 2000);
	// 	} else {
	// 		this.messageService.add({
	// 			severity: 'error',
	// 			summary: 'Invalid OTP',
	// 			detail: 'Please enter a valid 6-digit OTP.',
	// 		});
	// 	}
	// }

	// goBackToPaymentStep(step: number) {
	// 	this.paymentStep = step;
	// 	if (step === 1) {
	// 		this.selectedBank = null;
	// 		this.accountNumber = '';
	// 		this.otpCode = '';
	// 		this.otpSent = false;
	// 		this.countdown = 0;
	// 		if (this.countdownInterval) {
	// 			clearInterval(this.countdownInterval);
	// 		}
	// 	}
	// }

	// Helper methods for ticket display
	// getFormattedSeats(): string {
	// 	if (!this.ticket?.seats && !this.bookingDetails?.selectedSeats)
	// 		return 'No seats';

	// 	if (this.ticket?.seats) {
	// 		return this.ticket.seats.join(', ');
	// 	}

	// 	return this.bookingDetails!.selectedSeats.map((seat) => seat.id).join(', ');
	// }

	// getFormattedDateTime(): string {
	// 	if (!this.ticket) return 'Loading...';

	// 	const date = new Date(this.ticket.date);
	// 	const formattedDate = date.toLocaleDateString('en-US', {
	// 		weekday: 'short',
	// 		year: 'numeric',
	// 		month: 'short',
	// 		day: 'numeric',
	// 	});

	// 	return `${formattedDate} at ${this.ticket.time}`;
	// }

	// getCustomerName(): string {
	// 	return this.bookingDetails?.customerInfo?.name || 'Guest Customer';
	// }

	// getCustomerEmail(): string {
	// 	return this.bookingDetails?.customerInfo?.email || 'No email provided';
	// }

	// getCustomerPhone(): string {
	// 	return this.bookingDetails?.customerInfo?.phone || 'No phone provided';
	// }

	// getSeatCount(): number {
	// 	if (this.ticket?.seats) {
	// 		return this.ticket.seats.length;
	// 	}
	// 	return this.bookingDetails?.selectedSeats?.length || 0;
	// }

	// Trailer methods
	// openTrailer() {
	// 	if (this.movie?.trailerUrl) {
	// 		const embedUrl = this.convertToEmbedUrl(this.movie.trailerUrl);
	// 		this.safeTrailerUrl =
	// 			this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
	// 		this.showTrailerDialog = true;
	// 	}
	// }

	// closeTrailer() {
	// 	this.showTrailerDialog = false;
	// 	this.safeTrailerUrl = null;
	// }

	// private convertToEmbedUrl(youtubeUrl: string): string {
	// 	const regExp =
	// 		/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	// 	const match = youtubeUrl.match(regExp);
	// 	const videoId = match && match[7].length === 11 ? match[7] : null;

	// 	if (videoId) {
	// 		return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
	// 	}
	// 	return youtubeUrl;
	// }

	// // QR Code generation method
	// async generateQRCode(ticketId: string): Promise<void> {
	// 	try {
	// 		const qrData = {
	// 			ticketId: ticketId,
	// 			movieTitle: this.movie?.title || 'Unknown Movie',
	// 			theatreName: this.screening?.theatreName || 'Unknown Theatre',
	// 			hallName: this.screening?.hallName || 'Unknown Hall',
	// 			date: this.screening?.date || new Date().toISOString(),
	// 			time: this.screening?.time || 'Unknown Time',
	// 			seats:
	// 				this.bookingDetails?.selectedSeats?.map((seat: any) => seat.id) || [],
	// 			customerName: this.getCustomerName(),
	// 			totalAmount: this.getTotalAmount(),
	// 			bookingDate: new Date().toISOString(),
	// 			verificationCode: this.generateVerificationCode(),
	// 		};

	// 		const qrString = JSON.stringify(qrData);
	// 		this.qrCodeDataURL = await QRCode.toDataURL(qrString, {
	// 			width: 200,
	// 			margin: 2,
	// 			color: {
	// 				dark: '#000000',
	// 				light: '#FFFFFF',
	// 			},
	// 			errorCorrectionLevel: 'M',
	// 		});
	// 	} catch (error: any) {
	// 		console.error('Error generating QR code:', error);
	// 		// Fallback to a simple ticket ID QR code
	// 		try {
	// 			this.qrCodeDataURL = await QRCode.toDataURL(ticketId, {
	// 				width: 200,
	// 				margin: 2,
	// 			});
	// 		} catch (fallbackError: any) {
	// 			console.error('Error generating fallback QR code:', fallbackError);
	// 		}
	// 	}
	// }

	// private generateVerificationCode(): string {
	// 	return Math.random().toString(36).substring(2, 8).toUpperCase();
	// }
}
