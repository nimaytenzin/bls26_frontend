import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';
import { SeatDataService } from '../../../../../core/dataservice/seat/seat.dataservice';
import { BASEAPI_URL } from '../../../../../core/constants/constants';

import {
	Screening,
	ScreeningSeatPrice,
} from '../../../../../core/dataservice/screening/screening.interface';
import {
	CounterStaffCreateBookingDto,
	BookedSeatDto,
	BookingStatusEnum,
	EntryStatusEnum,
} from '../../../../../core/dataservice/booking/booking.interface';
import { Seat } from '../../../../../core/dataservice/seat/seat.interface';
import { Hall } from '../../../../../core/dataservice/hall/hall.interface';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { SeatCategory } from '../../../../../core/dataservice/seat-category/seat-category.interface';
import { AdminSeatSelectionComponent } from '../admin-seat-selection/admin-seat-selection.component';

interface SelectedSeat extends Seat {
	price: number;
	selected: boolean;
	status: 'available' | 'booked' | 'selected';
}

interface BookingStep {
	step: number;
	title: string;
	description: string;
	completed: boolean;
}

@Component({
	selector: 'app-admin-create-booking',
	templateUrl: './admin-create-booking.component.html',
	styleUrls: ['./admin-create-booking.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminCreateBookingComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Forms
	customerForm!: FormGroup;

	// Data
	screenings: Screening[] = [];
	selectedScreening: Screening | null = null;
	selectedHall: Hall | null = null;
	hallSeats: Seat[] = [];
	selectedSeats: SelectedSeat[] = [];
	screeningPrices: ScreeningSeatPrice[] = [];
	seatAvailability: { [seatId: string]: 'available' | 'booked' | 'selected' } =
		{};

	// UI State
	loading = false;
	loadingSeats = false;
	isSubmitting = false;
	currentStep = 1;
	totalSteps = 4;

	// Steps Configuration
	steps: BookingStep[] = [
		{
			step: 1,
			title: 'Select Screening',
			description: 'Choose a movie screening',
			completed: false,
		},
		{
			step: 2,
			title: 'Select Seats',
			description: 'Choose available seats',
			completed: false,
		},
		{
			step: 3,
			title: 'Customer Details',
			description: 'Enter customer information',
			completed: false,
		},
		{
			step: 4,
			title: 'Review & Book',
			description: 'Confirm booking details',
			completed: false,
		},
	];

	// Search and Filter
	searchTerm = '';
	selectedDate: Date | null = null;
	selectedTheatre: string = '';

	constructor(
		private fb: FormBuilder,
		private screeningService: ScreeningDataService,
		private bookingService: BookingDataService,
		private seatService: SeatDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {
		this.initializeForms();
	}

	ngOnInit(): void {
		this.loadScreenings();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeForms(): void {
		this.customerForm = this.fb.group({
			customerName: ['', [Validators.required, Validators.minLength(2)]],
			phoneNumber: [
				'',
				[Validators.required, Validators.pattern(/^[0-9]{8}$/)],
			],
			email: ['', [Validators.email]],
			notes: [''],
			paymentMethod: ['CASH', [Validators.required]],
			bookingStatus: [BookingStatusEnum.CONFIRMED, [Validators.required]],
			entryStatus: [EntryStatusEnum.VALID, [Validators.required]],
		});
	}

	private loadScreenings(): void {
		this.loading = true;
		this.screeningService
			.findAllScreenings()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (screenings) => {
					this.screenings = screenings;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading screenings:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load screenings. Please try again.',
					});
				},
			});
	}
	// Event handlers for AdminSeatSelectionComponent
	onSeatsSelected(selectedSeats: SelectedSeat[]): void {
		this.selectedSeats = selectedSeats;
		console.log('Seats selected:', selectedSeats);
	}

	onTotalAmountChange(totalAmount: number): void {
		// Update any UI that shows total amount
		console.log('Total amount changed:', totalAmount);
	}

	selectScreening(screening: Screening): void {
		this.selectedScreening = screening;
		this.steps[0].completed = true;
		this.nextStep();
	}

	private loadSeatsForScreening(screening: Screening): void {
		if (!screening.hallId) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Invalid screening data.',
			});
			return;
		}

		this.loadingSeats = true;
		// Set hall info from screening if available
		this.selectedHall = screening.hall || null;

		// Load seats for the seat selection component
		this.seatService
			.findSeatsByHallId(screening.hallId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (seats) => {
					console.log('Loaded seats:', seats);

					// If hall info not available from screening, get it from first seat
					if (!this.selectedHall && seats.length > 0 && seats[0].hall) {
						this.selectedHall = seats[0].hall;
					}

					this.hallSeats = seats;
					// For now, make all seats available for admin booking
					this.seatAvailability = {};
					seats.forEach((seat) => {
						this.seatAvailability[seat.id.toString()] = 'available';
					});

					this.screeningPrices = screening.screeningSeatPrices || [];
					this.loadingSeats = false;
				},
				error: (error) => {
					console.error('Error loading seats:', error);
					this.loadingSeats = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load seat information.',
					});
				},
			});
	}

	proceedToCustomerDetails(): void {
		if (this.selectedSeats.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Seats Selected',
				detail: 'Please select at least one seat to continue.',
			});
			return;
		}

		this.steps[1].completed = true;
		this.nextStep();
	}

	proceedToReview(): void {
		if (this.customerForm.invalid) {
			this.markFormGroupTouched(this.customerForm);
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Form',
				detail: 'Please fill in all required fields correctly.',
			});
			return;
		}

		this.steps[2].completed = true;
		this.nextStep();
	}

	submitBooking(): void {
		if (!this.selectedScreening || this.selectedSeats.length === 0) {
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid Booking',
				detail: 'Please complete all steps before submitting.',
			});
			return;
		}

		this.confirmationService.confirm({
			message: `Are you sure you want to create this booking for ${this.selectedSeats.length} seat(s)?`,
			header: 'Confirm Booking',
			icon: 'pi pi-exclamation-triangle',
			acceptIcon: 'none',
			rejectIcon: 'none',
			rejectButtonStyleClass: 'p-button-text',
			accept: () => {
				this.performBooking();
			},
		});
	}

	private performBooking(): void {
		this.isSubmitting = true;
		const formData = this.customerForm.value;

		console.log('Selected seats before booking:', this.selectedSeats);

		const bookedSeats: BookedSeatDto[] = this.selectedSeats.map((seat) => {
			// Ensure price is a valid number
			let price = 0;
			if (typeof seat.price === 'number') {
				price = seat.price;
			} else if (typeof seat.price === 'string') {
				price = parseFloat(seat.price) || 0;
			}

			// Ensure we have valid numbers for the required fields
			const seatId = Number(seat.id);
			const categoryId = Number(seat.categoryId);

			console.log(
				`Seat ${seat.seatNumber}: price = ${seat.price} -> ${price}, seatId = ${seatId}, categoryId = ${categoryId}`
			);

			return {
				seatId: seatId,
				seatCategoryId: categoryId,
				price: price,
			};
		});

		const totalAmount = this.selectedSeats.reduce((sum, seat) => {
			let price = 0;
			if (typeof seat.price === 'number') {
				price = seat.price;
			} else if (typeof seat.price === 'string') {
				price = parseFloat(seat.price) || 0;
			}
			return sum + price;
		}, 0);

		console.log('Booking data - bookedSeats:', bookedSeats);
		console.log('Booking data - totalAmount:', totalAmount);

		const bookingData: CounterStaffCreateBookingDto = {
			sessionId: '11',
			screeningId: this.selectedScreening!.id,
			customerName: formData.customerName,
			phoneNumber: formData.phoneNumber,
			email: formData.email || undefined,
			seats: bookedSeats,
			totalAmount: totalAmount,
			notes: formData.notes || undefined,
			paymentMethod: formData.paymentMethod,
			bookedBy: 1,
		};

		console.log('Final booking data to send:', bookingData);

		// this.bookingService
		// 	.counterStaffConfirmBooking(bookingData)
		// 	.pipe(takeUntil(this.destroy$))
		// 	.subscribe({
		// 		next: (response) => {
		// 			this.isSubmitting = false;
		// 			this.steps[3].completed = true;

		// 			this.messageService.add({
		// 				severity: 'success',
		// 				summary: 'Booking Created',
		// 				detail: `Booking created successfully! Booking ID: ${response.booking?.id}`,
		// 			});

		// 			// Reset the form for next booking
		// 			setTimeout(() => {
		// 				this.resetBookingProcess();
		// 			}, 2000);
		// 		},
		// 		error: (error) => {
		// 			console.error('Error creating booking:', error);
		// 			this.isSubmitting = false;
		// 			this.messageService.add({
		// 				severity: 'error',
		// 				summary: 'Booking Failed',
		// 				detail:
		// 					error.error?.message ||
		// 					'Failed to create booking. Please try again.',
		// 			});
		// 		},
		// 	});
	}

	private resetBookingProcess(): void {
		this.currentStep = 1;
		this.selectedScreening = null;
		this.selectedHall = null;
		this.hallSeats = [];
		this.selectedSeats = [];
		this.screeningPrices = [];
		this.seatAvailability = {};
		this.customerForm.reset();
		this.initializeForms();

		// Reset all steps
		this.steps.forEach((step) => {
			step.completed = false;
		});

		this.loadScreenings();
	}

	nextStep(): void {
		if (this.currentStep < this.totalSteps) {
			this.currentStep++;
		}
	}

	previousStep(): void {
		if (this.currentStep > 1) {
			this.currentStep--;
		}
	}

	canProceedToNextStep(): boolean {
		switch (this.currentStep) {
			case 1:
				return !!this.selectedScreening;
			case 2:
				return this.selectedSeats.length > 0;
			case 3:
				return this.customerForm.valid;
			default:
				return false;
		}
	}

	// Helper methods
	getFirstPortraitImage(movie: Movie): any {
		return movie?.media?.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	formatTime(time: string): string {
		if (!time) return '';

		// Handle 4-digit format (HHMM)
		if (time.length === 4 && /^\d{4}$/.test(time)) {
			const hours = time.substring(0, 2);
			const minutes = time.substring(2, 4);
			return `${hours}:${minutes}`;
		}

		return time;
	}

	formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	getTotalAmount(): number {
		return this.selectedSeats.reduce((sum, seat) => {
			const price =
				typeof seat.price === 'number' ? seat.price : Number(seat.price) || 0;
			return sum + price;
		}, 0);
	}

	getUniqueTheatres(): string[] {
		const theatres = this.screenings
			.map((s) => s.hall?.theatre?.name)
			.filter((name) => name);
		return [...new Set(theatres)] as string[];
	}

	// Form validation helpers
	isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
		const field = formGroup.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getFieldError(formGroup: FormGroup, fieldName: string): string {
		const field = formGroup.get(fieldName);
		if (field?.errors && field.touched) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['email']) return 'Please enter a valid email address';
			if (field.errors['pattern'])
				return 'Please enter a valid phone number (8 digits)';
			if (field.errors['minlength'])
				return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
		}
		return '';
	}

	private markFormGroupTouched(formGroup: FormGroup): void {
		Object.keys(formGroup.controls).forEach((field) => {
			const control = formGroup.get(field);
			control?.markAsTouched({ onlySelf: true });
		});
	}

	// Expose enums for template
	BookingStatusEnum = BookingStatusEnum;
	EntryStatusEnum = EntryStatusEnum;

	// Helper for template iteration
	Array = Array;
	String = String;
}
