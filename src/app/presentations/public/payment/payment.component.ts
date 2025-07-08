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
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as QRCode from 'qrcode';

// Interfaces
import { Movie } from '../../../core/dataservice/movie/movie.interface';
import { Hall } from '../../../core/dataservice/hall/hall.interface';
import { Seat } from '../../../core/dataservice/seat/seat.interface';
import { Screening } from '../../../core/dataservice/screening/screening.interface';
import {
	Booking,
	UpdateUserDetailsDto,
	MockPaymentDto,
	PaymentMode,
	PaymentSuccessResponse,
} from '../../../core/dataservice/booking/booking.interface';
import { PublicDataService } from '../../../core/dataservice/public/public.dataservice';
import { BookingDataService } from '../../../core/dataservice/booking/booking.dataservice';
import { QRCodeComponent } from 'angularx-qrcode';
import {
	PGBank,
	AERequestDTO,
	ClientECMessage,
	ErrorResponse,
	DRRequestDTO,
	ClientDebitSuccessDTO,
} from '../../../core/dataservice/payment-settlement/payment-settlement.interface';
import { PaymentSettlementDataService } from '../../../core/dataservice/payment-settlement/payment-settlement.dataservice';

interface SelectedSeat extends Seat {
	price: number;
	selected: boolean;
	status: 'available' | 'booked' | 'selected';
}

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
		DividerModule,
		AvatarModule,
	],
	providers: [MessageService],
})
export class PaymentComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Booking data from dialog
	movie: Movie | null = null;
	screening: Screening | null = null;
	hall: Hall | null = null;
	selectedSeats: SelectedSeat[] = [];
	totalAmount: number = 0;
	screeningId: number = 0;
	sessionId: string = '';

	// Forms
	customerForm: FormGroup;
	paymentForm: FormGroup;

	// Processing states
	processing = false;
	updatingCustomerInfo = false;
	initializingPayment = false;
	paymentConnected = false;
	sendingAERequest = false;
	currentStep = 1; // 1: Customer Info, 2: Payment, 3: E-Ticket

	// Stepper active step
	activeStep: number = 1;

	// RMA Payment Gateway properties
	paymentStep = 1; // 1: Bank Selection, 2: Account Entry, 3: OTP Verification
	selectedBank: any = null;
	accountNumber = '';
	otpCode = '';
	otpSent = false;
	countdown = 0;
	countdownInterval: any;

	// Bank options for RMA Payment Gateway
	banks: PGBank[] = [];
	paymentInstructionNumber: string = '';
	bfsTransactionId: string = '';

	// Booking response and e-ticket
	bookingResponse: Booking | null = null;
	qrCodeDataURL: string = '';

	// Active step index for stepper
	activeStepIndex = 0;

	// Trailer properties
	showTrailerDialog = false;
	safeTrailerUrl: SafeResourceUrl | null = null;

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private sanitizer: DomSanitizer,
		private messageService: MessageService,
		private publicDataService: PublicDataService,
		private bookingDataService: BookingDataService,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private paymentSettlementService: PaymentSettlementDataService
	) {
		// Initialize forms
		this.customerForm = this.fb.group({
			customerName: ['', [Validators.required, Validators.minLength(2)]],
			phoneNumber: [
				'',
				[Validators.required, Validators.pattern(/^[0-9]{8}$/)],
			],
			email: ['', [Validators.required, Validators.email]],
		});

		this.paymentForm = this.fb.group({
			selectedBank: ['', Validators.required],
			accountNumber: ['', [Validators.required]],
			otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
		});

		// Get data from dialog config
		const data = this.config.data;
		if (data) {
			this.movie = data.movie;
			this.screening = data.screening;
			this.hall = data.hall;
			this.selectedSeats = data.selectedSeats || [];
			this.totalAmount = data.totalAmount || 0;
			this.screeningId = data.screeningId || 0;
			this.sessionId = data.sessionId || '';
		}
	}

	ngOnInit() {
		console.log('Payment component initialized with data:', {
			movie: this.movie,
			screening: this.screening,
			selectedSeats: this.selectedSeats,
			totalAmount: this.totalAmount,
			sessionId: this.sessionId,
		});
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();

		// Clear countdown interval if exists
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
		}
	}
	// Simple navigation methods - no more confusing callbacks!
	goToNextStep() {
		if (this.activeStep < 4) {
			// Add validation before moving to next step
			if (this.activeStep === 2 && !this.selectedBank) {
				this.messageService.add({
					severity: 'error',
					summary: 'Bank Required',
					detail: 'Please select a bank to continue.',
				});
				return;
			}

			if (
				this.activeStep === 3 &&
				!this.paymentForm.get('accountNumber')?.valid
			) {
				this.messageService.add({
					severity: 'error',
					summary: 'Account Required',
					detail: 'Please enter a valid account number.',
				});
				return;
			}

			// Send AE request when moving from step 3 (account entry) to step 4 (OTP)
			if (
				this.activeStep === 3 &&
				this.paymentForm.get('accountNumber')?.valid
			) {
				this.sendAERequestAndProceed();
				return; // Don't increment step here, it will be done in the AE request success
			}

			this.activeStep++;

			// Send OTP when moving to step 4
			if (this.activeStep === 4) {
				this.sendOTP();
			}
		}
	}

	goToPreviousStep() {
		if (this.activeStep > 1) {
			this.activeStep--;
		}
	}

	goToStep(stepNumber: number) {
		if (stepNumber >= 1 && stepNumber <= 4) {
			this.activeStep = stepNumber;
		}
	}

	// Send Account Enquiry (AE) request and proceed to next step
	sendAERequestAndProceed() {
		if (!this.selectedBank || !this.bfsTransactionId) {
			this.messageService.add({
				severity: 'error',
				summary: 'Missing Information',
				detail: 'Bank selection or transaction ID is missing.',
			});
			return;
		}

		const accountNumber = this.paymentForm.get('accountNumber')?.value;
		if (!accountNumber) {
			this.messageService.add({
				severity: 'error',
				summary: 'Account Required',
				detail: 'Please enter your account number.',
			});
			return;
		}

		this.sendingAERequest = true;

		const aeRequestData: AERequestDTO = {
			bfsTransactionId: this.bfsTransactionId,
			bankCode: this.selectedBank.bankCode,
			accountNumber: accountNumber,
		};

		this.paymentSettlementService
			.sendAERequest(aeRequestData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: ClientECMessage | ErrorResponse) => {
					this.sendingAERequest = false;

					// Check if response is an error
					if ('statusCode' in response && response.statusCode >= 400) {
						this.messageService.add({
							severity: 'error',
							summary: 'Account Validation Failed',
							detail: response.message || 'Unable to validate account details.',
						});
						return;
					}

					// Success - proceed to next step and send OTP
					this.messageService.add({
						severity: 'success',
						summary: 'Account Validated',
						detail: 'Account details validated successfully.',
					});

					this.activeStep++;

					// Send OTP when moving to step 4
					if (this.activeStep === 4) {
						this.sendOTP();
					}
				},
				error: (error) => {
					this.sendingAERequest = false;
					console.error('AE Request error:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Validation Error',
						detail: 'Failed to validate account details. Please try again.',
					});
				},
			});
	}

	// Submit customer form and proceed to payment
	submitCustomerForm() {
		if (!this.customerForm.valid || !this.sessionId) {
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid Data',
				detail: 'Please fill all required fields correctly.',
			});
			return;
		}

		this.updatingCustomerInfo = true;
		this.paymentConnected = false;

		const updateUserDetailsDto: UpdateUserDetailsDto = {
			name: this.customerForm.get('customerName')?.value,
			phoneNumber: this.customerForm.get('phoneNumber')?.value,
			email: this.customerForm.get('email')?.value,
		};

		this.bookingDataService
			.updateUserDetails(this.sessionId, this.screeningId, updateUserDetailsDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Customer info updated successfully:', response);
					this.updatingCustomerInfo = false;
					this.initializingPayment = true;

					// Initiate payment request
					this.paymentSettlementService
						.initiatePaymentUsingSessionScreening({
							screeningId: this.screeningId,
							sessionId: this.sessionId,
						})
						.subscribe({
							next: (res: any) => {
								// Store transaction details from response
								this.banks = res.bankList || [];
								this.paymentInstructionNumber =
									res.paymentInstructionNumber || `PIN_${Date.now()}`;
								this.bfsTransactionId =
									res.bfsTransactionId || `BFS_${Date.now()}`;

								// Simulate connection establishment
								setTimeout(() => {
									this.paymentConnected = true;

									// Hide loading after showing secured connection for a moment
									setTimeout(() => {
										this.initializingPayment = false;
										this.paymentConnected = false;

										// Simply go to next step
										this.goToStep(2);

										this.messageService.add({
											severity: 'success',
											summary: 'Connection Established',
											detail: 'Successfully connected to RMA Payment Gateway.',
										});
									}, 1500); // Show secured connection for 1.5 seconds
								}, 1000); // Show connecting for 1 second
							},
							error: (error) => {
								console.error('Error initiating payment:', error);
								this.initializingPayment = false;
								this.paymentConnected = false;

								let errorMessage =
									'Failed to connect to payment gateway. Please try again.';
								if (error.status === 404) {
									errorMessage =
										'Session not found or has expired. Please start over.';
								} else if (error.error?.message) {
									errorMessage = error.error.message;
								}

								this.messageService.add({
									severity: 'error',
									summary: 'Connection Failed',
									detail: errorMessage,
								});
							},
						});
				},
				error: (error) => {
					console.error('Error updating customer info:', error);
					this.updatingCustomerInfo = false;
					this.paymentConnected = false;

					let errorMessage =
						'Failed to update customer information. Please try again.';

					// Handle specific error cases
					if (error.status === 404) {
						errorMessage =
							'Session not found or has expired. Please start over.';
					} else if (error.status === 400) {
						errorMessage =
							'Invalid customer information. Please check your inputs.';
					} else if (error.error?.message) {
						errorMessage = error.error.message;
					}

					this.messageService.add({
						severity: 'error',
						summary: 'Update Failed',
						detail: errorMessage,
					});
				},
			});
	}

	// Navigation between steps - simplified!
	nextStep() {
		if (this.activeStep === 1 && this.customerForm.valid) {
			this.submitCustomerForm();
		} else if (this.activeStep === 1) {
			this.markFormGroupTouched(this.customerForm);
			this.messageService.add({
				severity: 'error',
				summary: 'Form Invalid',
				detail: 'Please fill all required fields correctly.',
			});
		}
	}

	updateStepperIndex() {
		this.activeStepIndex = this.currentStep - 1;
	}

	// RMA Payment Gateway Methods - simplified!
	selectBank(bank: any) {
		this.selectedBank = bank;
		this.paymentForm.patchValue({ selectedBank: bank });
	}

	// Store account number when moving to OTP step
	private storeAccountNumber() {
		const accountNumber = this.paymentForm.get('accountNumber')?.value;
		if (accountNumber) {
			this.accountNumber = accountNumber;
			console.log('Account number stored:', this.accountNumber);
		}
	}

	sendOTP() {
		this.otpSent = true;
		this.countdown = 60;
		this.startCountdown();

		this.messageService.add({
			severity: 'success',
			summary: 'OTP Sent',
			detail: `OTP has been sent to your registered mobile number ending with ***${this.accountNumber.slice(
				-3
			)}`,
		});
	}

	resendOTP() {
		if (this.countdown === 0) {
			this.sendOTP();
		}
	}

	startCountdown() {
		this.countdownInterval = setInterval(() => {
			this.countdown--;
			if (this.countdown === 0) {
				clearInterval(this.countdownInterval);
			}
		}, 1000);
	}
	verifyOTP() {
		// Use the form control value, but fall back to the ngModel property
		const otpCode = this.paymentForm.get('otpCode')?.value || this.otpCode;

		if (otpCode && otpCode.length === 6) {
			this.otpCode = otpCode;
			this.processing = true;

			const drRequestData: DRRequestDTO = {
				bfsTransactionId: this.bfsTransactionId,
				otp: this.otpCode,
			};

			this.paymentSettlementService
				.sendDRRequest(drRequestData)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response: ClientDebitSuccessDTO | ErrorResponse) => {
						this.processing = false;

						// Check if response is an ErrorResponse
						if (
							'statusCode' in response &&
							typeof response.statusCode === 'number' &&
							response.statusCode >= 400
						) {
							const errorResponse = response as ErrorResponse;
							this.messageService.add({
								severity: 'error',
								summary: 'Payment Failed',
								detail:
									errorResponse.message || 'Payment could not be processed.',
							});
							return;
						}

						// Check if it's a ClientDebitSuccessDTO with success status
						const successResponse = response as ClientDebitSuccessDTO;
						if (successResponse.statusCode === '00') {
							// Success - payment completed
							this.bookingResponse = successResponse.booking;

							// Generate QR code for the booking
							this.generateETicket();

							this.messageService.add({
								severity: 'success',
								summary: 'Payment Successful',
								detail: 'Your booking has been confirmed!',
							});

							// Navigate to e-ticket after a short delay
							setTimeout(() => {
								this.navigateToETicket();
							}, 2000);
						} else {
							// Payment failed or invalid status code
							this.messageService.add({
								severity: 'error',
								summary: 'Payment Failed',
								detail: 'Invalid OTP or payment could not be processed.',
							});
						}
					},
					error: (error) => {
						this.processing = false;
						console.error('DR Request error:', error);

						let errorMessage = 'Payment failed. Please try again.';
						if (error.status === 400) {
							errorMessage = 'Invalid OTP. Please check and try again.';
						} else if (error.status === 408) {
							errorMessage = 'Payment timeout. Please try again.';
						} else if (error.error?.message) {
							errorMessage = error.error.message;
						}

						this.messageService.add({
							severity: 'error',
							summary: 'Payment Error',
							detail: errorMessage,
						});
					},
				});
		} else {
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid OTP',
				detail: 'Please enter a valid 6-digit OTP.',
			});
		}
	}

	// Process mock payment success
	processMockPayment() {
		if (!this.sessionId || !this.screeningId) {
			this.processing = false;
			this.messageService.add({
				severity: 'error',
				summary: 'Session Error',
				detail: 'Invalid session or screening data. Please start over.',
			});
			return;
		}

		const mockPaymentData: MockPaymentDto = {
			sessionId: this.sessionId,
			screeningId: this.screeningId,
			paymentMode: PaymentMode.ZPSS,
			gatewayTransactionId: `RMA_TXN_${Date.now()}`,
			paymentInstructionNumber: `PIN_${Date.now()}`,
			bfsTransactionId: `BFS_${Date.now()}`,
			notes: `Payment via RMA Gateway - ${
				this.selectedBank?.name || 'ZPSS'
			} - Account: ***${this.accountNumber.slice(-4)}`,
		};

		console.log('Processing mock payment with data:', mockPaymentData);

		this.bookingDataService
			.mockPaymentSuccess(this.sessionId, this.screeningId, mockPaymentData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: PaymentSuccessResponse) => {
					console.log('Mock payment processed successfully:', response);

					if (response.success) {
						this.bookingResponse = response.booking;
						this.processing = false;
						this.currentStep = 3;
						this.activeStepIndex = 2;
						this.generateETicket();

						this.messageService.add({
							severity: 'success',
							summary: 'Payment Successful',
							detail:
								response.message ||
								'Your payment has been processed successfully!',
						});

						// Navigate to e-ticket after a short delay
						setTimeout(() => {
							this.navigateToETicket();
						}, 2000);
					} else {
						this.processing = false;
						this.messageService.add({
							severity: 'error',
							summary: 'Payment Failed',
							detail: 'Payment processing failed. Please try again.',
						});
					}
				},
				error: (error) => {
					console.error('Error processing mock payment:', error);
					this.processing = false;

					let errorMessage = 'Payment processing failed. Please try again.';

					// Handle specific error cases
					if (error.status === 404) {
						errorMessage =
							'Booking session not found or has expired. Please start over.';
					} else if (error.status === 400) {
						errorMessage =
							'Invalid payment data. Please check your information.';
					} else if (error.error?.message) {
						errorMessage = error.error.message;
					}

					this.messageService.add({
						severity: 'error',
						summary: 'Payment Failed',
						detail: errorMessage,
					});
				},
			});
	}

	goBackToPaymentStep(step: number) {
		this.paymentStep = step;
	}

	// Direct mock payment for test mode
	processDirectMockPayment() {
		if (!this.isTestMode) {
			this.messageService.add({
				severity: 'error',
				summary: 'Not Allowed',
				detail: 'Test mode is not enabled.',
			});
			return;
		}

		this.processing = true;
		this.processMockPayment();
	}

	// Generate e-ticket and QR code
	async generateETicket() {
		if (!this.bookingResponse) return;

		try {
			const eTicketData = {
				bookingId: this.bookingResponse.id,
				uuid: this.bookingResponse.uuid,
				movieTitle: this.movie?.name || 'Unknown Movie',
				theatreName: this.hall?.theatre?.name || 'Unknown Theatre',
				hallName: this.hall?.name || 'Unknown Hall',
				date: this.screening?.date || new Date().toISOString(),
				time: this.formatTime(this.screening?.startTime || ''),
				seats: this.selectedSeats.map(
					(seat) => `${this.getRowLabel(seat.rowId - 1)}${seat.seatNumber}`
				),
				customerName: this.customerForm.get('customerName')?.value,
				totalAmount: this.totalAmount,
				bookingDate: new Date().toISOString(),
				status: this.bookingResponse.bookingStatus,
			};

			const qrString = JSON.stringify(eTicketData);
			this.qrCodeDataURL = await QRCode.toDataURL(qrString, {
				width: 200,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF',
				},
				errorCorrectionLevel: 'M',
			});
		} catch (error: any) {
			console.error('Error generating QR code:', error);
			// Fallback to simple booking ID QR code
			try {
				this.qrCodeDataURL = await QRCode.toDataURL(this.bookingResponse.uuid, {
					width: 200,
					margin: 2,
				});
			} catch (fallbackError: any) {
				console.error('Error generating fallback QR code:', fallbackError);
			}
		}
	}

	// Environment check for test mode
	get isTestMode(): boolean {
		// You can also check environment here: return !environment.production;
		return true; // For now, always show test mode
	}

	// Utility methods
	formatCurrency(amount: number): string {
		return `Nu. ${amount}`;
	}

	formatTime(timeInput: string | number): string {
		if (!timeInput && timeInput !== 0) return '';

		const timeString = timeInput.toString();

		// Handle 4-digit time format (e.g., "0730" or 730 -> "7:30 AM")
		if (/^\d{4}$/.test(timeString)) {
			const hours = parseInt(timeString.substring(0, 2), 10);
			const minutes = parseInt(timeString.substring(2, 4), 10);
			const date = new Date();
			date.setHours(hours, minutes, 0, 0);
			return date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			});
		}

		// Handle 3-digit time format (e.g., "730" or 730 -> "7:30 AM")
		if (/^\d{3}$/.test(timeString)) {
			const hours = parseInt(timeString.substring(0, 1), 10);
			const minutes = parseInt(timeString.substring(1, 3), 10);
			const date = new Date();
			date.setHours(hours, minutes, 0, 0);
			return date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			});
		}

		return timeString;
	}

	getRowLabel(rowIndex: number): string {
		return String.fromCharCode(65 + rowIndex); // A, B, C, etc.
	}

	formatDate(dateString: string): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	getFormattedSeats(): string {
		return this.selectedSeats
			.map((seat) => `${this.getRowLabel(seat.rowId - 1)}${seat.seatNumber}`)
			.join(', ');
	}

	// Form validation helper
	private markFormGroupTouched(formGroup: FormGroup) {
		Object.keys(formGroup.controls).forEach((key) => {
			const control = formGroup.get(key);
			control?.markAsTouched();
		});
	}

	isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
		const field = formGroup.get(fieldName);
		return !!(field && field.invalid && (field.dirty || field.touched));
	}

	getFieldError(formGroup: FormGroup, fieldName: string): string {
		const field = formGroup.get(fieldName);
		if (field && field.errors && (field.dirty || field.touched)) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['email']) return 'Please enter a valid email';
			if (field.errors['minlength']) return `${fieldName} is too short`;
			if (field.errors['pattern']) return `${fieldName} format is invalid`;
		}
		return '';
	}

	// Trailer methods
	openTrailer() {
		if (this.movie?.trailerURL) {
			// Assuming trailer URL is in image field for now
			this.showTrailerDialog = true;
		}
	}

	closeTrailer() {
		this.showTrailerDialog = false;
		this.safeTrailerUrl = null;
	}

	// Dialog actions
	downloadTicket() {
		if (!this.bookingResponse) return;

		const ticketData = {
			bookingId: this.bookingResponse.id,
			uuid: this.bookingResponse.uuid,
			movie: this.movie?.name,
			theatre: this.hall?.theatre?.name,
			hall: this.hall?.name,
			date: this.formatDate(this.screening?.date || ''),
			time: this.formatTime(this.screening?.startTime || ''),
			seats: this.getFormattedSeats(),
			customer: this.customerForm.get('customerName')?.value,
			amount: this.totalAmount,
		};

		const dataStr = JSON.stringify(ticketData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `movie-ticket-${this.bookingResponse.uuid}.json`;
		link.click();

		URL.revokeObjectURL(url);
	}

	closeDialog() {
		// Navigate to e-ticket if payment was successful
		if (this.bookingResponse) {
			this.navigateToETicket();
		} else {
			// Just close dialog if no successful booking
			this.ref.close({ success: false });
		}
	}

	goHome() {
		// Navigate to e-ticket if payment was successful, otherwise go home
		if (this.bookingResponse) {
			this.navigateToETicket();
		} else {
			this.ref.close({ success: false });
			this.router.navigate(['/']);
		}
	}

	// Navigation methods
	navigateToETicket() {
		if (this.bookingResponse && this.sessionId) {
			// Close the dialog first
			this.ref.close({ success: true, booking: this.bookingResponse });

			// Navigate to e-ticket route
			this.router.navigate([
				'/eticket',
				this.sessionId,
				this.bookingResponse.id,
			]);
		}
	}
}
