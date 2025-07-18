import {
	Component,
	Input,
	OnInit,
	OnDestroy,
	ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PrimeNgModules } from '../../../../primeng.modules';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import { SeatDataService } from '../../../../core/dataservice/seat/seat.dataservice';
import { SessionService } from '../../../../core/dataservice/session.service';

import { Screening } from '../../../../core/dataservice/screening/screening.interface';
import {
	BookingSeat,
	SessionSeatOccupancyResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
	SessionSeatInfo,
	CounterStaffCreateBookingDto,
	BookedSeatDto,
	BookingStatusEnum,
	EntryStatusEnum,
	Booking,
	CreateBookingResponse,
	ApiResponse,
} from '../../../../core/dataservice/booking/booking.interface';
import { Seat } from '../../../../core/dataservice/seat/seat.interface';
import { Hall } from '../../../../core/dataservice/hall/hall.interface';
import { SeatCategory } from '../../../../core/dataservice/seat-category/seat-category.interface';
import { generateSeatStyle } from '../../../../core/utility/utility.service';
import { PaymentMode } from '../../../../core/constants/enums';
import { ScreeningDataService } from '../../../../core/dataservice/screening/screening.dataservice';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { SEATSELECTIONCONFIG } from '../../../../core/dataservice/config.service';
import { SeatSelectionDataService } from '../../../../core/dataservice/booking/seat-selection.dataservice';
import {
	DeviceInfo,
	UserAgentService,
} from '../../../../core/utility/useragent.service';
import { AuthService } from '../../../../core/dataservice/auth/auth.service';

export interface SelectedSeat extends Seat {
	price: number;
	selected: boolean;
	status: 'available' | 'booked' | 'selected';
}

export interface SeatSelectionEvents {
	onSeatSelected: (seat: SelectedSeat) => void;
	onSeatDeselected: (seat: SelectedSeat) => void;
	onSelectionChanged: (selectedSeats: SelectedSeat[]) => void;
	onMaxSeatsReached: () => void;
	onSeatConflict: (seat: SelectedSeat) => void;
}

@Component({
	selector: 'app-seat-selection',
	templateUrl: './seat-selection.component.html',
	styleUrls: ['./seat-selection.component.scss'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class SeatSelectionComponent implements OnInit, OnDestroy {
	// Inputs
	@Input() screeningId!: number;
	@Input() loading: boolean = false;

	config = SEATSELECTIONCONFIG;
	screening!: Screening;
	sessionId: string = '';

	// Booking Flow State
	bookingStep:
		| 'seat-selection'
		| 'customer-details'
		| 'booking-confirmation'
		| 'e-ticket' = 'seat-selection';
	customerForm!: FormGroup;
	generatedBooking: Booking | null = null;
	bookingLoading: boolean = false;
	paymentMethods: string[] = Object.values(PaymentMode);

	// Component State
	private destroy$ = new Subject<void>();

	// Data
	hall: Hall | null = null;
	movie!: Movie;
	seats: Seat[] = [];
	selectedSeats: SelectedSeat[] = [];
	seatCategories: SeatCategory[] = [];

	// Session Management
	sessionSeats: SessionSeatInfo[] = [];
	occupiedSeats: BookingSeat[] = [];
	seatAvailability: { [seatId: string]: 'available' | 'booked' | 'selected' } =
		{};

	// Seat layout
	hallLayout: (SelectedSeat | null)[][] = [];

	// Timers
	refreshTimer: any = null;

	// Loading states
	loadingSeats: boolean = false;

	//device information
	deviceInformation: DeviceInfo | null = null;

	constructor(
		private bookingService: BookingDataService,
		private screeningService: ScreeningDataService,
		private seatService: SeatDataService,
		private sessionService: SessionService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private formBuilder: FormBuilder,
		private cdr: ChangeDetectorRef,
		private userAgentService: UserAgentService,
		private seatSelectionService: SeatSelectionDataService,
		private authService: AuthService
	) {
		this.initializeCustomerForm();
		this.generateSessionId();
	}

	ngOnInit(): void {
		if (this.screeningId) {
			this.loadScreeningDetails();
			this.getDeviceInformation();
		}

		console.log('AUTHETNCTED USER ID', this.getAuthenticatedUserId());
	}

	getDeviceInformation() {
		this.userAgentService.getDeviceInfo().then((info) => {
			this.deviceInformation = info;
		});
	}

	getAuthenticatedUserId(): number {
		return this.authService.getCurrentUser()?.id || 0;
	}

	/**
	 * Initialize customer details form
	 */
	private initializeCustomerForm(): void {
		this.customerForm = this.formBuilder.group({
			customerName: ['', [Validators.required, Validators.minLength(2)]],
			customerPhoneNumber: [
				'',
				[Validators.required, Validators.pattern(/^\d{8}$/)],
			],
			customerEmail: ['', [Validators.email]],
			paymentMethod: ['', [Validators.required]],
			notes: ['', [Validators.maxLength(500)]],
		});
	}

	private generateSessionId(): void {
		this.sessionId =
			this.sessionService.getSessionId() || this.sessionService.createSession();
		console.log('Generated session ID:', this.sessionId);
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();

		// Clear all selected seats on destroy
		if (this.selectedSeats.length > 0) {
			this.clearAllSelections();
		}

		// Clear timers
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}
	}

	loadScreeningDetails() {
		this.screeningService.findScreeningById(this.screeningId).subscribe({
			next: (res) => {
				this.screening = res;
				this.hall = res.hall;
				this.movie = res.movie;
				this.seatCategories = res.hall.seatCategories || [];
				console.log('Loaded screening details:', this.screening);
				this.loadSeatData();
			},
			error: (error) => {
				console.error('Error loading screening details:', error);
			},
		});
	}
	/**
	 * Load seat data for the screening
	 */
	loadSeatData(): void {
		if (!this.screening) {
			console.error('No screening provided for seat selection');
			return;
		}

		this.loadingSeats = true;

		const requests = [
			this.seatService.findSeatsByHallId(this.screening.hallId),
			this.seatSelectionService.getSeatOccupancyStatusBySession(
				this.screening.id,
				this.sessionId || ''
			),
		];

		forkJoin(requests)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: ([seatsResponse, occupiedSeatResponse]) => {
					console.log('Seat data loaded successfully');
					this.seats = seatsResponse as Seat[];
					// Initialize seat availability
					this.initializeSeatAvailability(
						this.seats,
						occupiedSeatResponse as SessionSeatOccupancyResponse
					);

					// Generate hall layout
					this.generateHallLayout();

					// Start periodic refresh if session management is enabled
					if (this.config.enableSessionManagement) {
						this.startPeriodicRefresh();
					}
					this.loadingSeats = false;
				},
				error: (error) => {
					console.error('Error loading seat data:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load seat data. Please try again.',
					});
					this.loadingSeats = false;
				},
			});
	}

	/**
	 * Initialize seat availability from API response
	 */
	private initializeSeatAvailability(
		seats: Seat[],
		occupiedSeatResponse: SessionSeatOccupancyResponse
	): void {
		// Initialize all seats as available
		this.seatAvailability = {};
		seats.forEach((seat) => {
			this.seatAvailability[seat.id.toString()] = 'available';
		});

		// Mark occupied seats as booked
		if (occupiedSeatResponse.occupiedSeats) {
			occupiedSeatResponse.occupiedSeats.forEach((occupiedSeat) => {
				this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
			});
		}

		// Handle session seats
		if (occupiedSeatResponse.sessionSeats) {
			this.sessionSeats = occupiedSeatResponse.sessionSeats.map(
				(seat) =>
					({
						seatId: seat.seatId,
						sessionId: this.sessionId,
						selectedAt: new Date().toISOString(),
						expiresAt: new Date(
							Date.now() + this.config.sessionTimeoutSeconds * 1000
						).toISOString(),
						userMetadata: {
							userAgent: navigator.userAgent,
							ipAddress: '',
						},
					} as SessionSeatInfo)
			);
		}

		console.log('Initialized seat availability:', this.seatAvailability);
	}

	/**
	 * Start periodic refresh for real-time seat updates
	 */
	private startPeriodicRefresh(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}

		this.refreshTimer = setInterval(() => {
			if (this.screening && !this.loadingSeats) {
				this.refreshOccupiedSeats();
			}
		}, this.config.refreshIntervalSeconds * 1000);
	}

	/**
	 * Refresh occupied seats without affecting current selections
	 */
	private refreshOccupiedSeats(): void {
		if (!this.screening) return;

		this.seatSelectionService
			.getSeatOccupancyStatusBySession(this.screening.id, this.sessionId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.updateSeatAvailabilityFromResponse(response);
				},
				error: (error) => {
					console.error('Error refreshing occupied seats:', error);
				},
			});
	}

	/**
	 * Update seat availability from API response
	 */
	private updateSeatAvailabilityFromResponse(
		response: SessionSeatOccupancyResponse
	): void {
		// Reset all seats to available first, except our selected ones
		Object.keys(this.seatAvailability).forEach((seatId) => {
			const isOurSelection = this.selectedSeats.some(
				(seat) => seat.id.toString() === seatId
			);
			if (!isOurSelection) {
				this.seatAvailability[seatId] = 'available';
			}
		});

		// Mark occupied seats as booked
		if (response.occupiedSeats && Array.isArray(response.occupiedSeats)) {
			response.occupiedSeats.forEach((occupiedSeat: BookingSeat) => {
				const isOurSelection = this.selectedSeats.some(
					(seat) => seat.id === occupiedSeat.seatId
				);
				if (!isOurSelection) {
					this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
				}
			});
		}

		// Update hall layout
		this.updateHallLayoutFromAvailability();
	}

	/**
	 * Update hall layout from seat availability
	 */
	private updateHallLayoutFromAvailability(): void {
		if (!this.hallLayout || !this.hall) {
			return;
		}

		for (let rowIndex = 0; rowIndex < this.hall.rows; rowIndex++) {
			for (let colIndex = 0; colIndex < this.hall.columns; colIndex++) {
				const seatAtPosition = this.hallLayout[rowIndex][colIndex];
				if (seatAtPosition) {
					const seatId = seatAtPosition.id.toString();
					const newStatus = this.seatAvailability[seatId] || 'available';

					if (seatAtPosition.status !== newStatus) {
						seatAtPosition.status = newStatus;
						seatAtPosition.selected = newStatus === 'selected';
					}
				}
			}
		}

		this.cdr.detectChanges();
	}

	/**
	 * Handle seat click
	 */
	onSeatClick(seat: SelectedSeat): void {
		if (this.loadingSeats) return;

		// Check if seat is booked
		if (seat.status === 'booked') {
			this.messageService.add({
				severity: 'warn',
				summary: 'Seat Unavailable',
				detail: 'This seat is already booked',
			});
			return;
		}

		const isSelected = this.isSeatSelected(seat);

		// Check seat limit before selecting
		if (!isSelected && this.selectedSeats.length >= this.config.maxSeats) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Maximum Seats Reached',
				detail: `You can select maximum ${this.config.maxSeats} seats`,
			});
			return;
		}

		// Proceed with selection/deselection
		if (isSelected) {
			this.deselectSeat(seat);
		} else {
			this.selectSeat(seat);
		}
	}

	/**
	 * Select a seat
	 */
	private selectSeat(seat: SelectedSeat): void {
		// Optimistic UI update
		seat.status = 'selected';
		seat.selected = true;
		this.selectedSeats.push(seat);
		this.seatAvailability[seat.id.toString()] = 'selected';
		this.updateSeatInHallLayout(seat);

		// API call for session management
		if (this.config.enableSessionManagement && this.sessionId) {
			this.updateSeatSelection(seat);
		}
	}

	/**
	 * Deselect a seat
	 */
	private deselectSeat(seat: SelectedSeat): void {
		// Optimistic UI update
		seat.status = 'available';
		seat.selected = false;
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}
		this.seatAvailability[seat.id.toString()] = 'available';
		this.updateSeatInHallLayout(seat);

		// API call for session management
		if (this.config.enableSessionManagement && this.sessionId) {
			this.updateSeatDeselection(seat);
		}
	}

	/**
	 * Update seat selection using API
	 */
	private updateSeatSelection(seat: SelectedSeat): void {
		const seatSelectionDto: SeatSelectionDto = {
			seatId: seat.id,
			screeningId: this.screening.id,
			deviceType: this.deviceInformation?.deviceType || 'unknown',
			operatingSystem: this.deviceInformation?.operatingSystem || 'unknown',
			country: this.deviceInformation?.country || 'unknown',
			city: this.deviceInformation?.city || 'unknown',
			bookedBy: this.getAuthenticatedUserId(),
		};

		this.seatSelectionService
			.selectSeatBySession(this.sessionId, seatSelectionDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					if (response.success) {
						console.log('Seat selection successful:', response);
						if (response.occupiedSeats) {
							const occupiedSeatResponse: SessionSeatOccupancyResponse = {
								occupiedSeats: response.occupiedSeats,
								sessionSeats: [],
							};
							this.updateSeatAvailabilityFromResponse(occupiedSeatResponse);
						}
					} else {
						this.revertSeatSelection(seat);
					}
				},
				error: (error) => {
					console.error('Error selecting seat:', error);
					if (error.status === 409) {
						this.handleSeatConflict(seat, error.error);
					} else {
						this.revertSeatSelection(seat);
						this.messageService.add({
							severity: 'error',
							summary: 'Selection Failed',
							detail: error.error?.message || 'Failed to select seat',
						});
					}
				},
			});
	}

	/**
	 * Update seat deselection using API
	 */
	private updateSeatDeselection(seat: SelectedSeat): void {
		const seatSelectionDto: SeatSelectionDto = {
			seatId: seat.id,
			screeningId: this.screening.id,
			deviceType: this.deviceInformation?.deviceType || 'unknown',
			operatingSystem: this.deviceInformation?.operatingSystem || 'unknown',
			country: this.deviceInformation?.country || 'unknown',
			city: this.deviceInformation?.city || 'unknown',
			bookedBy: this.getAuthenticatedUserId(),
		};

		this.seatSelectionService
			.deselectSeatBySession(this.sessionId, seatSelectionDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					if (response.success) {
						console.log('Seat deselection successful:', response);
					}
				},
				error: (error) => {
					console.error('Error deselecting seat:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Deselection Failed',
						detail: error.error?.message || 'Failed to deselect seat',
					});
				},
			});
	}

	/**
	 * Handle seat conflict
	 */
	private handleSeatConflict(seat: SelectedSeat, conflictResponse: any): void {
		// Revert optimistic update
		seat.status = 'booked';
		seat.selected = false;
		this.seatAvailability[seat.id.toString()] = 'booked';

		// Remove from selected array
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}

		// Update UI
		this.updateSeatInHallLayout(seat);

		this.messageService.add({
			severity: 'warn',
			summary: 'Seat Conflict',
			detail: 'This seat was just taken by another user',
		});

		// Refresh all occupied seats
		this.refreshOccupiedSeats();
	}

	/**
	 * Revert seat selection on error
	 */
	private revertSeatSelection(seat: SelectedSeat): void {
		seat.status = 'available';
		seat.selected = false;
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}
		this.seatAvailability[seat.id.toString()] = 'available';
		this.updateSeatInHallLayout(seat);
	}

	/**
	 * Update specific seat in hall layout
	 */
	private updateSeatInHallLayout(seat: SelectedSeat): void {
		const rowIndex = seat.rowId - 1;
		const colIndex = seat.colId - 1;

		if (this.hallLayout[rowIndex] && this.hallLayout[rowIndex][colIndex]) {
			this.hallLayout[rowIndex][colIndex]!.status = seat.status;
			this.hallLayout[rowIndex][colIndex]!.selected = seat.selected;
		}

		this.cdr.detectChanges();
	}

	/**
	 * Clear all seat selections
	 */
	clearAllSelections(): void {
		this.selectedSeats.forEach((seat) => {
			seat.status = 'available';
			seat.selected = false;
			this.seatAvailability[seat.id.toString()] = 'available';
			this.updateSeatInHallLayout(seat);
		});

		this.selectedSeats = [];
		console.log('All selections cleared');
	}

	/**
	 * Generate hall layout
	 */
	private generateHallLayout(): void {
		if (!this.hall) {
			return;
		}

		// Reset selected seats
		this.selectedSeats = [];
		// Create a 2D array representing the hall layout
		this.hallLayout = [];

		// Initialize the layout with null values
		for (let row = 0; row < this.hall.rows; row++) {
			this.hallLayout[row] = [];
			for (let col = 0; col < this.hall.columns; col++) {
				this.hallLayout[row][col] = null;
			}
		}

		// Map actual seats onto the layout
		this.seats.forEach((seat) => {
			const rowIndex = seat.rowId - 1;
			const colIndex = seat.colId - 1;

			if (
				rowIndex >= 0 &&
				rowIndex < this.hall!.rows &&
				colIndex >= 0 &&
				colIndex < this.hall!.columns
			) {
				const selectedSeat: SelectedSeat = {
					...seat,
					price: this.getSeatPrice(seat),
					selected: false,
					status: this.seatAvailability[seat.id.toString()] || 'available',
				};

				this.hallLayout[rowIndex][colIndex] = selectedSeat;
			}
		});
	}

	// Utility methods
	getSeatStatus(seat: SelectedSeat): 'booked' | 'selected' | 'available' {
		return this.seatAvailability[seat.id.toString()] || 'available';
	}

	isSeatSelected(seat: SelectedSeat): boolean {
		return this.selectedSeats.some((s) => s.id === seat.id);
	}

	isSeatOccupied(seat: SelectedSeat): boolean {
		return this.getSeatStatus(seat) === 'booked';
	}

	getSeatPrice(seat: Seat): number {
		if (!this.screening || !this.screening.screeningSeatPrices) {
			return 0;
		}
		const priceInfo = this.screening.screeningSeatPrices.find(
			(p) => p.seatCategoryId === seat.categoryId
		);
		return priceInfo ? Number(priceInfo.price) : 0;
	}

	// Template helper methods
	getRows(): number[] {
		if (!this.hall) return [];
		return Array.from({ length: this.hall.rows }, (_, i) => i);
	}

	getColumns(): number[] {
		if (!this.hall) return [];
		return Array.from({ length: this.hall.columns }, (_, i) => i);
	}

	getSeatAtPosition(rowIndex: number, colIndex: number): SelectedSeat | null {
		if (!this.hallLayout[rowIndex] || !this.hallLayout[rowIndex][colIndex]) {
			return null;
		}
		return this.hallLayout[rowIndex][colIndex];
	}

	getRowLabel(rowIndex: number): string {
		return String.fromCharCode(65 + rowIndex); // A, B, C, etc.
	}

	getSeatStyles(hexCode: string, seat?: SelectedSeat): any {
		const baseStyle = generateSeatStyle(hexCode || '#000000');

		if (seat?.status === 'selected') {
			return {
				backgroundColor: '#10b981', // green-500
				border: '2px solid #059669', // green-600
				color: '#ffffff',
				borderRadius: '6px',
				cursor: 'pointer',
				transition: 'all 0.3s ease',
			};
		} else if (seat?.status === 'booked') {
			return {
				backgroundColor: '#f3f4f6', // gray-100
				border: '2px solid #e5e7eb', // gray-200
				color: '#6b7280', // gray-500
				borderRadius: '6px',
				cursor: 'not-allowed',
				opacity: '0.6',
				transition: 'all 0.3s ease',
			};
		}

		return {
			...baseStyle,
			borderRadius: '6px',
			cursor: 'pointer',
			transition: 'all 0.3s ease',
		};
	}

	getCategoryLegendStyles(hexCode: string): any {
		const baseStyle = generateSeatStyle(hexCode || '#000000');
		return {
			...baseStyle,
			borderRadius: '6px',
		};
	}

	getSelectedLegendStyles(): any {
		return {
			backgroundColor: '#10b981', // green-500
			border: '2px solid #059669', // green-600
			borderRadius: '6px',
		};
	}

	getOccupiedLegendStyles(): any {
		return {
			backgroundColor: '#6b7280', // gray-500
			borderRadius: '6px',
		};
	}

	formatCurrency(amount: number): string {
		return `Nu. ${amount.toLocaleString()}`;
	}

	getScreenCenter(): number {
		if (!this.hall) return 0;
		const screenStart = this.hall.screenStart - 1;
		const screenSpan = this.hall.screenSpan || 1;
		return Math.floor(screenStart + screenSpan / 2);
	}

	getTotalAmount(): number {
		return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
	}

	getSelectedSeatsText(): string {
		return this.selectedSeats.map((seat) => seat.seatNumber).join(', ');
	}

	/**
	 * Proceed to customer details step
	 */
	proceedToCustomerDetails(): void {
		if (this.selectedSeats.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Seats Selected',
				detail: 'Please select at least one seat before proceeding',
			});
			return;
		}
		this.seatSelectionService
			.proceedToPayment(this.sessionId, this.screening.id)
			.subscribe({
				next: (response) => {
					this.bookingStep = 'customer-details';
				},
				error: (error) => {
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to proceed to payment step',
					});
				},
			});
	}

	/**
	 * Go back to seat selection
	 */
	backToSeatSelection(): void {
		this.bookingStep = 'seat-selection';
	}

	/**
	 * Submit customer details and create booking
	 */
	submitCustomerDetails(): void {
		if (this.customerForm.invalid) {
			this.markFormGroupTouched(this.customerForm);
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid Form',
				detail: 'Please fill in all required fields correctly',
			});
			return;
		}

		this.createBooking();
	}

	/**
	 * Create booking with selected seats and customer details
	 */
	private createBooking(): void {
		this.bookingLoading = true;

		const formValue = this.customerForm.value;
		const bookedSeats: BookedSeatDto[] = this.selectedSeats.map((seat) => ({
			seatId: seat.id,
			seatCategoryId: seat.categoryId,
			price: seat.price,
		}));

		const totalAmount = this.getTotalAmount();

		const bookingDto: CounterStaffCreateBookingDto = {
			sessionId: this.sessionId,
			screeningId: this.screening.id,
			customerName: formValue.customerName,
			phoneNumber: formValue.customerPhoneNumber,
			email: formValue.customerEmail || '',
			seats: bookedSeats,
			totalAmount: totalAmount,
			paymentMethod: formValue.paymentMethod.toUpperCase(),
			notes: formValue.notes || '',
			bookedBy: this.getAuthenticatedUserId(),
		};

		this.seatSelectionService
			.counterStaffConfirmBooking(bookingDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: CreateBookingResponse) => {
					this.bookingLoading = false;
					this.generatedBooking = response.booking;
					this.bookingStep = 'e-ticket';

					this.messageService.add({
						severity: 'success',
						summary: 'Booking Successful',
						detail: response.message || 'Ticket has been booked successfully',
					});

					// Clear selected seats from session
					this.clearAllSelections();
				},
				error: (error: any) => {
					this.bookingLoading = false;
					console.error('Error creating booking:', error);

					this.messageService.add({
						severity: 'error',
						summary: 'Booking Failed',
						detail:
							error.error?.message ||
							'Failed to create booking. Please try again.',
					});
				},
			});
	}

	/**
	 * Print e-ticket
	 */
	printTicket(): void {
		window.print();
	}

	/**
	 * Start new booking
	 */
	startNewBooking(): void {
		this.confirmationService.confirm({
			message:
				'Are you sure you want to start a new booking? Current progress will be lost.',
			header: 'Start New Booking',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				this.resetBookingFlow();
			},
		});
	}

	/**
	 * Reset booking flow to initial state
	 */
	private resetBookingFlow(): void {
		this.bookingStep = 'seat-selection';
		this.clearAllSelections();
		this.customerForm.reset();
		this.generatedBooking = null;
		this.bookingLoading = false;
	}

	/**
	 * Mark all form controls as touched
	 */
	private markFormGroupTouched(formGroup: FormGroup): void {
		Object.keys(formGroup.controls).forEach((key) => {
			const control = formGroup.get(key);
			control?.markAsTouched();
		});
	}

	getScreenWidth(): number {
		if (!this.hall) return 300; // Default width
		const seatWidth = 48; // w-12 = 48px
		const seatGap = 8; // gap-2 = 8px
		const screenSpan = this.hall.screenSpan || this.hall.columns;
		return seatWidth * screenSpan + seatGap * (screenSpan - 1);
	}
}
