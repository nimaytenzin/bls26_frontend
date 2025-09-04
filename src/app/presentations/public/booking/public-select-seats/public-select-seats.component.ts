import {
	Component,
	OnInit,
	OnDestroy,
	ChangeDetectorRef,
	ViewChild,
	ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { MenuItem } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import * as QRCode from 'qrcode';

// Interfaces
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { Hall } from '../../../../core/dataservice/hall/hall.interface';
import { Seat } from '../../../../core/dataservice/seat/seat.interface';
import {
	Screening,
	ScreeningSeatPrice,
} from '../../../../core/dataservice/screening/screening.interface';
import {
	BookingSeat,
	CreateBookingResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
	SessionSeatInfo,
	SessionSeatOccupancyResponse,
} from '../../../../core/dataservice/booking/booking.interface';
import { PublicDataService } from '../../../../core/dataservice/public/public.dataservice';
import { SessionService } from '../../../../core/dataservice/session.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaymentComponent } from '../payment/payment.component';
import { BookingDataService } from '../../../../core/dataservice/booking/booking.dataservice';
import { SeatCategory } from '../../../../core/dataservice/seat-category/seat-category.interface';
import { generateSeatStyle } from '../../../../core/utility/utility.service';
import { SeatSelectionDataService } from '../../../../core/dataservice/booking/seat-selection.dataservice';
import { SeatDataService } from '../../../../core/dataservice/seat/seat.dataservice';
import { SEATSELECTIONCONFIG_PUBLIC } from '../../../../core/dataservice/config.service';
import {
	DeviceInfo,
	UserAgentService,
} from '../../../../core/utility/useragent.service';

interface SelectedSeat extends Seat {
	price: number;
	selected: boolean;
	status: 'available' | 'booked' | 'selected';
}

@Component({
	selector: 'app-public-select-seats',
	templateUrl: './public-select-seats.component.html',
	styleUrls: ['./public-select-seats.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ButtonModule,
		CardModule,
		ChipModule,
		ToastModule,
		DialogModule,
		ReactiveFormsModule,
		InputTextModule,
		DropdownModule,
		ProgressSpinnerModule,
		ConfirmDialogModule,
		StepsModule,
		DividerModule,
		TooltipModule,
	],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class PublicSelectSeatsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	@ViewChild('seatViewport') seatViewport!: ElementRef;
	@ViewChild('seatContainer') seatContainer!: ElementRef;

	ref: DynamicDialogRef | null = null;
	// Loading and error states
	loading = true;
	error: string | null = null;

	// Enhanced zoom functionality
	currentZoom = 1;
	minZoom = 0.3;
	maxZoom = 3.0;
	zoomStep = 0.1;

	// Pan functionality
	isPanning = false;
	lastPanX = 0;
	lastPanY = 0;
	panStartX = 0;
	panStartY = 0;

	// Enhanced mini map functionality
	showMiniMap = false;
	miniMapWidth = 200;
	miniMapHeight = 150;
	viewportRect = { x: 0, y: 0, width: 0, height: 0 };

	// Touch gesture support
	private lastTouchDistance = 0;
	private initialZoom = 1;
	private touchStartDistance = 0;
	private isMultiTouch = false;

	// Performance optimization
	private rafId: number | null = null;
	private debounceTimer: any = null;

	// Layout calculations cache
	private layoutCache = {
		containerWidth: 0,
		containerHeight: 0,
		seatSize: 0,
		screenWidth: 0,
		lastHallId: 0,
		lastZoom: 0,
	};

	config = SEATSELECTIONCONFIG_PUBLIC;
	sessionTimeOutSeconds = this.config.sessionTimeoutSeconds;
	refreshIntervalSeconds = this.config.refreshIntervalSeconds;
	// Data properties
	movie: Movie | null = null;
	screening: Screening | null = null;
	hall: Hall | null = null;
	seats: Seat[] = [];
	screeningPrices: ScreeningSeatPrice[] = [];
	seatCategories: SeatCategory[] = [];

	// Session-based seat management
	sessionId: string = '';
	sessionSeats: SessionSeatInfo[] = [];
	occupiedSeats: BookingSeat[] = [];
	seatAvailability: { [seatId: string]: 'available' | 'booked' | 'selected' } =
		{};

	// Seat layout and selection
	hallLayout: (SelectedSeat | null)[][] = [];
	selectedSeats: SelectedSeat[] = [];

	// Route parameters
	screeningId: number = 0;

	// Session timeout management
	sessionExpiresAt: string | null = null;
	timeoutTimer: any = null;
	refreshTimer: any = null;

	// Floating summary panel state
	showExpandedSummary = false;

	// Booking modal properties
	showBookingModal = false;
	currentBookingStep = 1;
	bookingForm: FormGroup;
	paymentForm: FormGroup;
	processing = false;

	// Payment stepper properties
	paymentStep = 1;
	selectedBank: any = null;
	accountNumber = '';
	otpCode = '';
	otpSent = false;
	countdown = 0;

	//Device Information
	deviceInfo: DeviceInfo | null = null;

	// Bank options for RMA Payment Gateway
	banks = [
		{ name: 'Bank of Bhutan', code: 'BOB', logo: '/assets/banks/bob.png' },
		{
			name: 'Bhutan National Bank',
			code: 'BNB',
			logo: '/assets/banks/bnb.png',
		},
		{ name: 'Druk PNB Bank', code: 'DPNB', logo: '/assets/banks/dpnb.png' },
		{ name: 'T-Bank', code: 'TBANK', logo: '/assets/banks/tbank.png' },
	];

	// Booking response and e-ticket
	bookingResponse: CreateBookingResponse | null = null;
	qrCodeDataURL: string = '';

	// Steps for stepper
	steps: MenuItem[] = [
		{ label: 'Customer Info' },
		{ label: 'Payment' },
		{ label: 'Confirmation' },
	];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private messageService: MessageService,
		private publicDataService: PublicDataService,
		private fb: FormBuilder,
		private dialogService: DialogService,
		public sessionService: SessionService,
		private bookingService: BookingDataService,
		private seatSelectionService: SeatSelectionDataService,
		private seatService: SeatDataService,
		private confirmationService: ConfirmationService,
		private userAgentService: UserAgentService
	) {
		// Initialize forms
		this.bookingForm = this.fb.group({
			customerName: ['', [Validators.required, Validators.minLength(2)]],
			phoneNumber: [
				'',
				[Validators.required, Validators.pattern(/^[0-9]{8}$/)],
			],
		});

		this.paymentForm = this.fb.group({
			selectedBank: ['', Validators.required],
			accountNumber: ['', [Validators.required]],
			otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
		});
	}

	ngOnInit() {
		// Get session ID from session service
		this.sessionId = this.sessionService.getSessionId() || '';
		if (!this.sessionId) {
			// Create new session if none exists
			this.sessionId = this.sessionService.createSession();
		}

		// Start session timeout timer (only if session timeout is configured)
		if (this.sessionTimeOutSeconds > 0) {
			this.startSessionTimeoutTimer();
		}
		this.getDeviceInformation();

		// Initialize mini map based on screen size
		this.initializeMiniMap();

		// Add keyboard shortcuts
		this.setupKeyboardShortcuts();

		console.log('Using session ID:', this.sessionId);
		console.log('Session timeout:', this.sessionTimeOutSeconds, 'seconds');

		this.route.params.subscribe((params) => {
			const screeningId = +params['id'];
			if (screeningId) {
				this.screeningId = screeningId;
				this.loadScreeningData();
			} else {
				this.error = 'Invalid screening selected';
				this.loading = false;
			}
		});
	}

	ngOnDestroy(): void {
		console.log('Component destroying, performing cleanup');

		this.destroy$.next();
		this.destroy$.complete();

		// Clear timers
		if (this.timeoutTimer) {
			clearTimeout(this.timeoutTimer);
		}
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}

		// Clear selections (this will attempt API calls if still valid)
		if (this.selectedSeats.length > 0) {
			console.log('Clearing selections before component destruction');
			this.clearAllSelections();
		}

		// End session when component is destroyed
		this.sessionService.endSession();
	}

	getDeviceInformation() {
		this.userAgentService.getDeviceInfo().then((info) => {
			this.deviceInfo = info;
		});
	}

	private loadScreeningData(): void {
		this.loading = true;
		this.error = null;
		this.resetData();

		// Load screening details using public data service
		this.publicDataService
			.findScreeningById(this.screeningId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (screening) => {
					console.log('Loaded screening:', screening);
					this.screening = screening;
					this.hall = screening.hall || null;
					this.screeningPrices = screening.screeningSeatPrices || [];
					this.seatCategories = screening.hall?.seatCategories || [];
					this.movie = screening.movie;

					// Load seats for the hall
					if (screening.hallId) {
						this.loadSeatsForHall(screening.hallId);
					} else {
						this.loading = false;
						this.error = 'No hall information found for this screening.';
					}
				},
				error: (error) => {
					console.error('Error loading screening:', error);
					this.loading = false;
					this.error = 'Failed to load screening information.';
				},
			});
	}

	getSeatCategoryById(id: number): SeatCategory | null {
		for (let item of this.seatCategories) {
			if (item.id === id) {
				return item;
			}
		}
		return null;
	}

	private loadSeatsForHall(hallId: number): void {
		// Load seats and occupied seats in parallel using the new API

		forkJoin({
			seats: this.seatService.findSeatsByHallId(hallId),
			occupiedSeatResponse:
				this.seatSelectionService.getSeatOccupancyStatusBySession(
					this.screeningId,
					this.sessionId
				),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (result) => {
					console.log('Loaded seats:', result.seats);
					console.log('Loaded occupied seats:', result.occupiedSeatResponse);

					this.seats = result.seats;
					console.log;

					// If there are session seats, map them to SelectedSeat and add to selectedSeats
					if (Array.isArray(result.occupiedSeatResponse.sessionSeats)) {
						result.occupiedSeatResponse.sessionSeats.forEach(
							(sessionSeat: any) => {
								const seat = this.seats.find(
									(s) => s.id === sessionSeat.seatId
								);
								if (seat) {
									const selectedSeat: SelectedSeat = {
										...seat,
										price: this.getSeatPrice(seat),
										selected: true,
										status: 'selected',
									};
									this.selectedSeats.push(selectedSeat);
									this.seatAvailability[seat.id.toString()] = 'selected';
								}
							}
						);
					}

					// If hall info not available from screening, get it from first seat
					if (!this.hall && result.seats.length > 0 && result.seats[0].hall) {
						this.hall = result.seats[0].hall;
					}

					// Initialize seat availability using occupied seats API
					this.initializeSeatAvailabilityFromOccupied(
						result.seats,
						result.occupiedSeatResponse
					);
					this.generateHallLayout();
					this.loading = false;

					// Start periodic refresh of occupied seats
					this.startPeriodicRefresh();
				},
				error: (error) => {
					console.error('Error loading seats or occupied seats:', error);
					this.loading = false;
					this.error = 'Failed to load seat information.';
				},
			});
	}

	/**
	 * Initialize seat availability using the new occupied seats API
	 */
	private initializeSeatAvailabilityFromOccupied(
		seats: Seat[],
		occupiedSeatResponse: SessionSeatOccupancyResponse
	): void {
		// Initialize all seats as available
		this.seatAvailability = {};
		seats.forEach((seat) => {
			this.seatAvailability[seat.id.toString()] = 'available';
		});

		// Mark occupied seats as booked (both CONFIRMED and active PENDING)
		occupiedSeatResponse.occupiedSeats.forEach((occupiedSeat) => {
			this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
		});
	}

	private resetData(): void {
		this.movie = null;
		this.screening = null;
		this.hall = null;
		this.seats = [];
		this.screeningPrices = [];
		this.seatAvailability = {};
		this.hallLayout = [];
		this.selectedSeats = [];
	}

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
			const rowIndex = seat.rowId - 1; // rowId is 1-based, array is 0-based
			const colIndex = seat.colId - 1; // colId is 1-based, array is 0-based

			if (
				rowIndex >= 0 &&
				rowIndex < this.hall!.rows &&
				colIndex >= 0 &&
				colIndex < this.hall!.columns
			) {
				const price = this.getSeatPrice(seat);
				const status = this.seatAvailability[seat.id.toString()] || 'available';

				this.hallLayout[rowIndex][colIndex] = {
					...seat,
					price,
					selected: false,
					status: status as 'available' | 'booked' | 'selected',
				} as SelectedSeat;
			}
		});
	}

	// Public methods for template
	getSeatAtPosition(rowIndex: number, colIndex: number): SelectedSeat | null {
		if (!this.hallLayout[rowIndex] || !this.hallLayout[rowIndex][colIndex]) {
			return null;
		}
		return this.hallLayout[rowIndex][colIndex];
	}

	getSeatPrice(seat: Seat): number {
		if (!seat.categoryId || !this.screeningPrices.length) {
			return 0;
		}

		const priceInfo = this.screeningPrices.find(
			(sp) => sp.seatCategoryId === seat.categoryId
		);

		return priceInfo ? Number(priceInfo.price) : 0;
	}

	onSeatClick(seat: SelectedSeat): void {
		// Prevent interactions during loading
		if (this.loading) {
			return;
		}

		// Check if seat is booked
		if (seat.status === 'booked') {
			this.messageService.add({
				severity: 'warn',
				summary: 'Seat Unavailable',
				detail: 'This seat is already booked',
			});
			return;
		}

		const isSelected = seat.status === 'selected';

		if (isSelected) {
			// Deselect the seat
			this.deselectSeat(seat);
		} else {
			// Check seat limit before selecting
			if (this.selectedSeats.length >= this.config.maxSeats) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Maximum Seats Reached',
					detail: `You can select maximum ${this.config.maxSeats} seats`,
				});
				return;
			}

			// Select the seat
			this.selectSeat(seat);
		}
	}

	private selectSeat(seat: SelectedSeat): void {
		console.log(`Attempting to select seat ${seat.id} (${seat.seatNumber})`);

		// Validate session before proceeding
		if (!this.sessionService.isSessionValid()) {
			this.messageService.add({
				severity: 'error',
				summary: 'Session Invalid',
				detail: 'Your session has expired. Please refresh the page.',
			});
			return;
		}

		// Validate seat is still available
		if (seat.status !== 'available') {
			this.messageService.add({
				severity: 'warn',
				summary: 'Seat Unavailable',
				detail: `Seat ${seat.seatNumber} is no longer available`,
			});
			return;
		}

		// Check if already selected (prevent double selection)
		const alreadySelected = this.selectedSeats.some((s) => s.id === seat.id);
		if (alreadySelected) {
			console.log(`Seat ${seat.id} is already selected`);
			return;
		}

		// Update UI immediately for better UX (optimistic update)
		seat.status = 'selected';
		seat.selected = true;
		this.selectedSeats.push(seat);
		this.seatAvailability[seat.id.toString()] = 'selected';
		this.updateSeatInHallLayout(seat);

		// Call the seat selection API
		this.updateSeatSelection(seat);
	}

	private deselectSeat(seat: SelectedSeat): void {
		console.log(`Attempting to deselect seat ${seat.id} (${seat.seatNumber})`);

		// Validate session before proceeding
		if (!this.sessionService.isSessionValid()) {
			this.messageService.add({
				severity: 'error',
				summary: 'Session Invalid',
				detail: 'Your session has expired. Please refresh the page.',
			});
			return;
		}

		// Validate seat is currently selected
		if (seat.status !== 'selected') {
			console.log(`Seat ${seat.id} is not currently selected`);
			return;
		}

		// Find and remove from selected seats array
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index === -1) {
			console.log(`Seat ${seat.id} not found in selected seats array`);
			return;
		}

		// Update UI immediately for better UX (optimistic update)
		seat.status = 'available';
		seat.selected = false;
		this.selectedSeats.splice(index, 1);
		this.seatAvailability[seat.id.toString()] = 'available';
		this.updateSeatInHallLayout(seat);

		// Call the seat deselection API
		this.updateSeatDeselection(seat);
	}

	/**
	 * Update seat selection using the new API with session management
	 */
	private updateSeatSelection(seat: SelectedSeat): void {
		const seatSelectionDto: SeatSelectionDto = {
			seatId: seat.id,
			screeningId: this.screeningId,
			deviceType: this.deviceInfo?.deviceType || 'unknown',
			operatingSystem: this.deviceInfo?.operatingSystem || 'unknown',
			country: this.deviceInfo?.country || 'unknown',
			city: this.deviceInfo?.city || 'unknown',
		};

		this.seatSelectionService
			.selectSeatBySession(this.sessionId, seatSelectionDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: SeatSelectionResponse) => {
					console.log(`Seat ${seat.id} selected successfully`, response);
					if (response.success) {
						this.messageService.add({
							severity: 'success',
							summary: 'Seat Selected',
							detail: `You have selected seat ${seat.seatNumber}`,
						});
						// Update seat availability based on response
						this.updateSeatAvailabilityFromSeatSelectionResponse(response);
					} else {
						// Server returned success=false, revert the selection
						this.revertSeatSelection(seat);
						this.messageService.add({
							severity: 'error',
							summary: 'Selection Failed',
							detail: 'Failed to select seat. Please try again.',
						});
					}
				},
				error: (error) => {
					console.error('Error selecting seat:', error);

					// Handle seat conflict (409 error) differently
					if (error.status === 409) {
						this.handleSeatConflict(seat, error.error);
					} else {
						// For other errors, revert the optimistic UI update
						this.revertSeatSelection(seat);
						this.messageService.add({
							severity: 'error',
							summary: 'Selection Failed',
							detail:
								error.error?.message ||
								'Failed to select seat. Please try again.',
						});
					}
				},
			});
	}

	private updateSeatDeselection(seat: SelectedSeat): void {
		const seatSelectionDto: SeatSelectionDto = {
			seatId: seat.id,
			screeningId: this.screeningId,
			deviceType: this.deviceInfo?.deviceType || 'unknown',
			operatingSystem: this.deviceInfo?.operatingSystem || 'unknown',
			country: this.deviceInfo?.country || 'unknown',
			city: this.deviceInfo?.city || 'unknown',
		};

		this.seatSelectionService
			.deselectSeatBySession(this.sessionId, seatSelectionDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response: SeatSelectionResponse) => {
					console.log(`Seat ${seat.id} deselected successfully`, response);
					this.messageService.add({
						severity: 'success',
						summary: 'Seat Deselected',
						detail: `You have deselected seat ${seat.seatNumber}`,
					});

					// Update seat availability based on response
					this.updateSeatAvailabilityFromSeatSelectionResponse(response);
				},
				error: (error) => {
					console.error('Error deselecting seat:', error);

					// Revert the optimistic UI update
					this.revertSeatDeselection(seat);

					this.messageService.add({
						severity: 'error',
						summary: 'Deselection Failed',
						detail:
							error.error?.message ||
							'Failed to deselect seat. Please try again.',
					});
				},
			});
	}
	/**
	 * Revert seat selection when API call fails
	 */
	private revertSeatSelection(seat: SelectedSeat): void {
		console.log(`Reverting selection for seat ${seat.id}`);

		// Remove from selected seats array
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}

		// Update seat status and availability
		seat.status = 'available';
		seat.selected = false;
		this.seatAvailability[seat.id.toString()] = 'available';

		// Update hall layout
		this.updateSeatInHallLayout(seat);
	}

	/**
	 * Handle seat conflict when selecting a seat
	 */
	private handleSeatConflict(seat: SelectedSeat, conflictResponse: any): void {
		console.log('Handling seat conflict for seat:', seat.id, conflictResponse);

		// Mark the seat as booked instead of available
		seat.status = 'booked';
		seat.selected = false;
		this.seatAvailability[seat.id.toString()] = 'booked';

		// Remove from selected seats array
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}

		// Update hall layout
		this.updateSeatInHallLayout(seat);

		// Show conflict message
		this.messageService.add({
			severity: 'warn',
			summary: 'Seat Conflict',
			detail:
				conflictResponse.message || 'This seat was just taken by another user',
		});

		// Refresh occupied seats to get latest state
		this.refreshOccupiedSeats();
	}

	/**
	 * Revert seat deselection when API call fails
	 */
	private revertSeatDeselection(seat: SelectedSeat): void {
		console.log(`Reverting deselection for seat ${seat.id}`);

		// Add back to selected seats array if not already there
		const exists = this.selectedSeats.some((s) => s.id === seat.id);
		if (!exists) {
			this.selectedSeats.push(seat);
		}

		// Update seat status and availability
		seat.status = 'selected';
		seat.selected = true;
		this.seatAvailability[seat.id.toString()] = 'selected';

		// Update hall layout
		this.updateSeatInHallLayout(seat);
	}

	/**
	 * Update a specific seat in the hall layout
	 */
	private updateSeatInHallLayout(seat: SelectedSeat): void {
		if (!this.hall || !this.hallLayout) return;

		const rowIndex = seat.rowId - 1;
		const colIndex = seat.colId - 1;

		if (
			rowIndex >= 0 &&
			rowIndex < this.hall.rows &&
			colIndex >= 0 &&
			colIndex < this.hall.columns &&
			this.hallLayout[rowIndex] &&
			this.hallLayout[rowIndex][colIndex]
		) {
			const hallSeat = this.hallLayout[rowIndex][colIndex];
			if (hallSeat && hallSeat.id === seat.id) {
				hallSeat.status = seat.status;
				hallSeat.selected = seat.selected;
			}
		}

		// Update mini map if visible
		if (this.showMiniMap) {
			// Small delay to ensure the change is reflected in the mini map
			setTimeout(() => {
				// Force change detection for mini map update
				// This ensures the mini map reflects the latest seat states
			}, 50);
		}
	}

	/**
	 * Update seat availability from the API response
	 */
	private updateSeatAvailabilityFromResponse(
		seatAvailabilityResponse: SessionSeatOccupancyResponse,
		isConflictUpdate: boolean = false
	): void {
		// Reset all seats to available first (except our selected ones in non-conflict scenarios)
		Object.keys(this.seatAvailability).forEach((seatId) => {
			if (!isConflictUpdate && this.seatAvailability[seatId] !== 'selected') {
				this.seatAvailability[seatId] = 'available';
			} else if (isConflictUpdate) {
				// In conflict scenarios, reset all seats to available initially
				this.seatAvailability[seatId] = 'available';
			}
		});

		// Mark occupied seats as booked
		seatAvailabilityResponse.occupiedSeats.forEach((occupiedSeat) => {
			// In conflict scenarios, mark ALL occupied seats as booked (including previously selected ones)
			if (isConflictUpdate) {
				console.log(
					`Conflict: Marking seat ${occupiedSeat.seatId} as booked (was occupied by another user)`
				);
				this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
			} else {
				// In normal updates, don't mark our own selected seats as booked
				const isOurSelection = this.selectedSeats.some(
					(seat) => seat.id === occupiedSeat.seatId
				);
				if (!isOurSelection) {
					console.log(`Marking seat ${occupiedSeat.seatId} as booked`);
					this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
				} else {
					console.log(
						`Seat ${occupiedSeat.seatId} is our selection, keeping as selected`
					);
				}
			}
		});

		// Update hall layout to reflect changes
		this.updateHallLayoutFromAvailability();

		console.log('Updated seat availability:', this.seatAvailability);
	}

	/**
	 * Update seat availability based on seat selection response
	 * This method handles the response from seat selection/deselection API calls
	 */
	private updateSeatAvailabilityFromSeatSelectionResponse(
		response: SeatSelectionResponse
	): void {
		console.log(
			'Updating seat availability from seat selection response:',
			response
		);

		// Reset all seats to available first
		Object.keys(this.seatAvailability).forEach((seatId) => {
			this.seatAvailability[seatId] = 'available';
		});

		// Mark occupied seats as booked (these are seats occupied by other users/sessions)
		if (response.occupiedSeats && Array.isArray(response.occupiedSeats)) {
			response.occupiedSeats.forEach((occupiedSeat: BookingSeat) => {
				const isOurSelection = this.selectedSeats.some(
					(seat) => seat.id === occupiedSeat.seatId
				);
				if (!isOurSelection) {
					console.log(`Marking seat ${occupiedSeat.seatId} as booked`);
					this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
				} else {
					console.log(
						`Seat ${occupiedSeat.seatId} is our selection, keeping as selected`
					);
					this.seatAvailability[occupiedSeat.seatId.toString()] = 'selected';
				}
			});
		}

		// Mark our selected seats as selected (these are seats selected by current session)
		// if (response.selectedSeat && Array.isArray(response.selectedSeat)) {
		// 	response.selectedSeat.forEach((selectedSeat: BookingSeat) => {
		// 		console.log(
		// 			`Marking seat ${selectedSeat.seatId} as selected for our session`
		// 		);
		// 		this.seatAvailability[selectedSeat.seatId.toString()] = 'selected';
		// 	});
		// }

		// Update selected seats array to match server state
		this.syncSelectedSeatsWithResponse(response);

		// Update hall layout to reflect changes
		this.updateHallLayoutFromAvailability();

		console.log('Updated seat availability:', this.seatAvailability);
	}

	/**
	 * Synchronize local selected seats array with server response
	 */
	private syncSelectedSeatsWithResponse(response: SeatSelectionResponse): void {
		// if (response.selectedSeat && Array.isArray(response.selectedSeat)) {
		// 	// Clear current selected seats
		// 	this.selectedSeats = [];
		// 	// Rebuild selected seats from server response
		// 	response.selectedSeat.forEach((selectedSeat: BookingSeat) => {
		// 		const seat = this.seats.find((s) => s.id === selectedSeat.seatId);
		// 		if (seat) {
		// 			const selectedSeatObj: SelectedSeat = {
		// 				...seat,
		// 				price: this.getSeatPrice(seat),
		// 				selected: true,
		// 				status: 'selected',
		// 			};
		// 			this.selectedSeats.push(selectedSeatObj);
		// 		}
		// 	});
		// 	console.log(
		// 		`Synchronized ${this.selectedSeats.length} selected seats with server`
		// 	);
		// }
	}

	/**
	 * Update hall layout from seat availability
	 */
	private updateHallLayoutFromAvailability(): void {
		if (!this.hallLayout || !this.hall) {
			console.log('Cannot update hall layout: missing hallLayout or hall data');
			return;
		}

		console.log('Updating hall layout from seat availability');
		let updatedSeats = 0;

		for (let rowIndex = 0; rowIndex < this.hall.rows; rowIndex++) {
			for (let colIndex = 0; colIndex < this.hall.columns; colIndex++) {
				const seatAtPosition = this.hallLayout[rowIndex][colIndex];
				if (seatAtPosition) {
					const availability =
						this.seatAvailability[seatAtPosition.id.toString()];

					// Only update if the status has changed
					if (seatAtPosition.status !== availability) {
						console.log(
							`Updating seat ${seatAtPosition.id} from ${seatAtPosition.status} to ${availability}`
						);
						seatAtPosition.status = availability as
							| 'available'
							| 'booked'
							| 'selected';
						seatAtPosition.selected = availability === 'selected';
						updatedSeats++;
					}
				}
			}
		}

		console.log(`Updated ${updatedSeats} seats in hall layout`);
	}

	/**
	 * Clear all current seat selections
	 */
	private clearAllSelections(): void {
		console.log('Clearing all seat selections');

		// Update each selected seat
		this.selectedSeats.forEach((seat) => {
			seat.status = 'available';
			seat.selected = false;
			this.seatAvailability[seat.id.toString()] = 'available';
			this.updateSeatInHallLayout(seat);
		});

		// Clear the array
		this.selectedSeats = [];

		// // Clear any running timer
		// if (this.selectionTimer) {
		// 	clearTimeout(this.selectionTimer);
		// 	this.selectionTimer = null;
		// }

		console.log('All selections cleared');
	}

	/**
	 * Periodically refresh occupied seats to handle concurrent user selections
	 */
	private startPeriodicRefresh(): void {
		// Only start periodic refresh if session management is enabled
		if (!this.config.enableSessionManagement) {
			return;
		}

		// Clear any existing timer
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}

		// Refresh every refreshIntervalSeconds (convert to milliseconds)
		this.refreshTimer = setInterval(() => {
			if (this.screeningId && !this.loading) {
				this.refreshOccupiedSeats();
				this.validateSeatSelections();
			}
		}, this.refreshIntervalSeconds * 1000);
	}

	/**
	 * Refresh occupied seats without affecting current selections
	 */
	private refreshOccupiedSeats(): void {
		this.seatSelectionService
			.getSeatOccupancyStatusBySession(this.screeningId, this.sessionId)
			.pipe(takeUntil(this.destroy$))
			.subscribe(
				(seatAvailabilityResponses: SessionSeatOccupancyResponse) => {
					// Assuming the API returns an array, use the first element
					const seatAvailabilityResponse = seatAvailabilityResponses;
					console.log(
						'Refreshed occupied seats:',
						seatAvailabilityResponse?.occupiedSeats
					);
					if (seatAvailabilityResponse) {
						this.updateSeatAvailabilityFromResponse(seatAvailabilityResponse);
					}
				},
				(error) => {
					console.error('Error refreshing occupied seats:', error);
					// Silently fail - don't disrupt user experience
				}
			);
	}

	/**
	 * Validate current seat selections against server state
	 */
	private validateSeatSelections(): void {
		if (this.selectedSeats.length === 0) return;
	}

	// Helper methods for template
	getRows(): number[] {
		if (!this.hall) return [];
		return Array.from({ length: this.hall.rows }, (_, i) => i);
	}

	getColumns(): number[] {
		if (!this.hall) return [];
		return Array.from({ length: this.hall.columns }, (_, i) => i);
	}

	getSeatsByRow(): { [row: string]: SelectedSeat[] } {
		const seatsByRow: { [row: string]: SelectedSeat[] } = {};

		this.seats.forEach((seat) => {
			const rowLabel = this.getRowLabel(seat.rowId - 1);
			if (!seatsByRow[rowLabel]) {
				seatsByRow[rowLabel] = [];
			}

			const price = this.getSeatPrice(seat);
			const status = this.seatAvailability[seat.id.toString()] || 'available';

			seatsByRow[rowLabel].push({
				...seat,
				price,
				selected: status === 'selected',
				status: status as 'available' | 'booked' | 'selected',
			} as SelectedSeat);
		});

		// Sort seats within each row by column
		Object.keys(seatsByRow).forEach((row) => {
			seatsByRow[row].sort((a, b) => a.colId - b.colId);
		});

		return seatsByRow;
	}

	getRowLabel(rowIndex: number): string {
		return String.fromCharCode(65 + rowIndex); // A, B, C, etc.
	}

	getSeatStyles(hexCode: string, seat?: SelectedSeat): any {
		const baseStyle = generateSeatStyle(hexCode || '#000000');

		// Handle different seat statuses
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

		// Default available seat style
		return {
			...baseStyle,
			':hover': {
				opacity: '0.8',
			},
		};
	}

	getSeatStylesForFloatingBar(hexCode: string, seat?: SelectedSeat): any {
		const baseStyle = generateSeatStyle(hexCode || '#000000');

		return {
			...baseStyle,
			':hover': {
				opacity: '0.8',
			},
		};
	}

	// Legend helper methods for consistent styling
	getSelectedLegendStyles(): any {
		return {
			backgroundColor: '#10b981', // green-500
			border: '2px solid #059669', // green-600
			borderRadius: '6px',
		};
	}

	getOccupiedLegendStyles(): any {
		return {
			backgroundColor: '#f3f4f6', // gray-100
			border: '2px solid #e5e7eb', // gray-200
			borderRadius: '6px',
		};
	}

	getCategoryLegendStyles(hexCode: string): any {
		const baseStyle = generateSeatStyle(hexCode || '#000000');
		return {
			...baseStyle,
			borderRadius: '6px',
		};
	}

	getTotalAmount(): number {
		return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
	}

	formatCurrency(amount: number): string {
		return `Nu. ${amount}`;
	}

	formatTime(timeInput: string | number): string {
		if (!timeInput && timeInput !== 0) return '';

		// Convert to string if it's a number
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

	// Navigation methods
	goBack(): void {
		// Clear any pending selections before navigating away
		this.clearAllSelections();
		this.router.navigate(['/movie', this.movie?.id || 'schedule']);
	}

	processPayment(): void {
		if (this.selectedSeats.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Seats Selected',
				detail: 'Please select at least one seat to proceed.',
			});
			return;
		}

		// Validate selections before proceeding to payment
		this.validateSeatSelections();

		// Wait a moment for validation, then proceed if seats are still selected
		setTimeout(() => {
			if (this.selectedSeats.length === 0) {
				this.messageService.add({
					severity: 'error',
					summary: 'Selection Invalid',
					detail:
						'Your selected seats are no longer available. Please select again.',
				});
				return;
			}

			// Call proceedToPayment API to update booking status and extend timeout
			this.processing = true;
			this.seatSelectionService
				.proceedToPayment(this.sessionId, this.screeningId)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response) => {
						console.log('Proceed to payment response:', response);

						if (response.success) {
							// Update session timeout with new payment window (15 minutes)
							this.sessionTimeOutSeconds = response.timeoutSeconds;
							this.sessionExpiresAt = response.expiresAt;
							this.startSessionTimeoutTimer();

							// Prepare booking data for payment component
							const bookingData = {
								movie: this.movie,
								screening: this.screening,
								hall: this.hall,
								selectedSeats: this.selectedSeats,
								totalAmount: this.getTotalAmount(),
								screeningId: this.screeningId,
								sessionId: this.sessionId,
								booking: response.booking, // Include server booking details
								expiresAt: response.expiresAt,
								timeoutSeconds: response.timeoutSeconds,
							};

							this.ref = this.dialogService.open(PaymentComponent, {
								modal: true,
								closable: false,
								dismissableMask: false,
								data: bookingData,
								width: '100vw',
								height: '100vh',
								contentStyle: {
									'max-height': '100vh',
									'overflow-y': 'auto',
									padding: '0',
									'border-radius': '0',
								},
								styleClass: 'payment-modal-mobile',
							});

							// Listen for booking completion
							this.ref.onClose.subscribe((result) => {
								if (result && result.success) {
									// Clear selections after successful booking
									this.clearAllSelections();
									// Refresh seat availability after successful booking
									this.refreshOccupiedSeats();

									this.messageService.add({
										severity: 'success',
										summary: 'Booking Successful',
										detail: 'Your tickets have been booked successfully!',
									});

									// Navigate to e-ticket with sessionId and bookingId
									if (result.booking && result.booking.id) {
										this.router.navigate([
											'/eticket',
											this.sessionId,
											result.booking.id,
										]);
									}
								} else if (result && result.retry) {
									// Payment failed but user wants to retry
									this.messageService.add({
										severity: 'info',
										summary: 'Retrying Payment',
										detail: 'Restarting payment process...',
									});

									// Retrigger payment modal with same data
									setTimeout(() => {
										this.retriggerPaymentModal(result);
									}, 1000);
								} else {
									// Payment failed or cancelled
									this.messageService.add({
										severity: 'warn',
										summary: 'Payment Cancelled',
										detail:
											'Payment was cancelled. Your seats are still reserved.',
									});
								}
								this.processing = false;
							});
						} else {
							this.processing = false;
							this.messageService.add({
								severity: 'error',
								summary: 'Payment Error',
								detail: 'Failed to proceed to payment. Please try again.',
							});
						}
					},
					error: (error) => {
						console.error('Error proceeding to payment:', error);
						this.processing = false;

						this.messageService.add({
							severity: 'error',
							summary: 'Payment Error',
							detail:
								error.error?.message ||
								'Failed to proceed to payment. Please try again.',
						});
					},
				});
		}, 500); // Small delay to allow validation to complete
	}

	/**
	 * Start session timeout timer for payment window
	 */
	private startSessionTimeoutTimer(): void {
		// Clear existing timer
		if (this.timeoutTimer) {
			clearTimeout(this.timeoutTimer);
		}
		if (this.sessionTimeOutSeconds > 0) {
			console.log(
				`Starting session timeout timer: ${this.sessionTimeOutSeconds} seconds`
			);

			this.timeoutTimer = setTimeout(() => {
				console.log('Session timeout reached, handling timeout');
				this.handleSessionTimeout();
			}, this.sessionTimeOutSeconds * 1000);
		}
	}

	/**
	 * Handle session timeout
	 */
	private handleSessionTimeout(): void {
		console.log('Session timeout triggered');

		// Clear all selections and close any open dialogs first
		this.clearAllSelections();
		if (this.ref) {
			this.ref.close();
		}

		// Show confirmation dialog with only OK button
		this.confirmationService.confirm({
			message: 'Your session has expired. Please start again.',
			header: 'Session Expired',
			closable: false,
			closeOnEscape: false,
			icon: 'pi pi-exclamation-triangle',
			rejectVisible: false, // Hide the reject/cancel button
			acceptButtonProps: {
				label: 'OK',
				severity: 'info',
			},
			accept: () => {
				// Navigate to home page
				this.router.navigate(['/']);
			},
		});
	}

	getScreenCenter(): number {
		if (!this.hall) return 0;
		return Math.floor(this.hall.screenStart - 1 + this.hall.screenSpan / 2);
	}

	getRowSummary(): {
		[row: string]: {
			total: number;
			available: number;
			selected: number;
			booked: number;
			percentage: number;
		};
	} {
		const seatsByRow = this.getSeatsByRow();
		const rowSummary: {
			[row: string]: {
				total: number;
				available: number;
				selected: number;
				booked: number;
				percentage: number;
			};
		} = {};

		Object.keys(seatsByRow).forEach((row) => {
			const seats = seatsByRow[row];
			const total = seats.length;
			const available = seats.filter(
				(seat) => seat.status === 'available'
			).length;
			const selected = seats.filter(
				(seat) => seat.status === 'selected'
			).length;
			const booked = seats.filter((seat) => seat.status === 'booked').length;
			const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

			rowSummary[row] = {
				total,
				available,
				selected,
				booked,
				percentage,
			};
		});

		return rowSummary;
	}

	getRowSummaryKeys(): string[] {
		return Object.keys(this.getRowSummary());
	}

	getRowAvailabilityClass(percentage: number): string {
		if (percentage >= 80) return 'bg-green-500';
		if (percentage >= 50) return 'bg-yellow-500';
		if (percentage >= 20) return 'bg-orange-500';
		return 'bg-red-500';
	}

	/**
	 * Retrigger payment modal when payment fails but user wants to retry
	 */
	private retriggerPaymentModal(previousResult: any): void {
		const bookingData = {
			movie: previousResult.movie || this.movie,
			screening: previousResult.screening || this.screening,
			hall: previousResult.hall || this.hall,
			selectedSeats: previousResult.selectedSeats || this.selectedSeats,
			totalAmount: previousResult.totalAmount || this.getTotalAmount(),
			screeningId: previousResult.screeningId || this.screeningId,
			sessionId: previousResult.sessionId || this.sessionId,
		};

		this.ref = this.dialogService.open(PaymentComponent, {
			modal: true,
			closable: false,
			dismissableMask: false,
			data: bookingData,
			width: '100vw',
			height: '100vh',
			contentStyle: {
				'max-height': '100vh',
				'overflow-y': 'auto',
				padding: '0',
				'border-radius': '0',
			},
			styleClass: 'payment-modal-mobile',
		});

		// Listen for booking completion (recursive handling)
		this.ref.onClose.subscribe((result) => {
			if (result && result.success) {
				// Clear selections after successful booking
				this.clearAllSelections();
				// Refresh seat availability after successful booking
				this.refreshOccupiedSeats();

				this.messageService.add({
					severity: 'success',
					summary: 'Booking Successful',
					detail: 'Your tickets have been booked successfully!',
				});

				// Navigate to e-ticket with sessionId and bookingId
				if (result.booking && result.booking.id) {
					this.router.navigate(['/eticket', this.sessionId, result.booking.id]);
				}
			} else if (result && result.retry) {
				// Payment failed again but user wants to retry
				this.messageService.add({
					severity: 'info',
					summary: 'Retrying Payment',
					detail: 'Restarting payment process...',
				});

				// Retrigger payment modal again
				setTimeout(() => {
					this.retriggerPaymentModal(result);
				}, 1000);
			} else {
				// Payment failed or cancelled
				this.messageService.add({
					severity: 'warn',
					summary: 'Payment Cancelled',
					detail: 'Payment was cancelled. Your seats are still reserved.',
				});
			}
			this.processing = false;
		});
	}

	// Enhanced zoom functionality methods
	zoomIn(): void {
		if (this.currentZoom < this.maxZoom) {
			this.currentZoom = Math.min(
				this.maxZoom,
				this.currentZoom + this.zoomStep
			);
			this.updateViewportRect();
			this.invalidateLayoutCache();
		}
	}

	zoomOut(): void {
		if (this.currentZoom > this.minZoom) {
			this.currentZoom = Math.max(
				this.minZoom,
				this.currentZoom - this.zoomStep
			);
			this.updateViewportRect();
			this.invalidateLayoutCache();
		}
	}

	resetZoom(): void {
		this.currentZoom = 1;
		this.updateViewportRect();
		this.invalidateLayoutCache();
		// Center the view
		if (this.seatViewport) {
			const viewport = this.seatViewport.nativeElement;
			viewport.scrollTop = 0;
			viewport.scrollLeft = 0;
		}
	}

	// Wheel zoom support for desktop
	onWheelZoom(event: WheelEvent): void {
		event.preventDefault();

		if (event.ctrlKey || event.metaKey) {
			const delta = -event.deltaY;
			const zoomAmount = delta > 0 ? this.zoomStep : -this.zoomStep;
			const newZoom = Math.max(
				this.minZoom,
				Math.min(this.maxZoom, this.currentZoom + zoomAmount)
			);

			if (newZoom !== this.currentZoom) {
				// Calculate zoom center based on mouse position
				const rect = this.seatViewport.nativeElement.getBoundingClientRect();
				const centerX = event.clientX - rect.left;
				const centerY = event.clientY - rect.top;

				this.zoomToPoint(newZoom, centerX, centerY);
			}
		}
	}

	// Pan functionality
	onPanStart(event: MouseEvent): void {
		if (event.button === 0) {
			// Left mouse button
			this.isPanning = true;
			this.panStartX = event.clientX;
			this.panStartY = event.clientY;
			this.lastPanX = this.seatViewport.nativeElement.scrollLeft;
			this.lastPanY = this.seatViewport.nativeElement.scrollTop;
			event.preventDefault();
		}
	}

	onPanMove(event: MouseEvent): void {
		if (this.isPanning) {
			const deltaX = this.panStartX - event.clientX;
			const deltaY = this.panStartY - event.clientY;

			this.seatViewport.nativeElement.scrollLeft = this.lastPanX + deltaX;
			this.seatViewport.nativeElement.scrollTop = this.lastPanY + deltaY;

			event.preventDefault();
		}
	}

	onPanEnd(event: MouseEvent): void {
		this.isPanning = false;
	}

	// Enhanced touch gesture support
	onTouchStart(event: TouchEvent): void {
		if (event.touches.length === 2) {
			this.isMultiTouch = true;
			this.lastTouchDistance = this.getTouchDistance(event.touches);
			this.touchStartDistance = this.lastTouchDistance;
			this.initialZoom = this.currentZoom;
		} else {
			this.isMultiTouch = false;
		}
	}

	onTouchMove(event: TouchEvent): void {
		if (event.touches.length === 2 && this.isMultiTouch) {
			event.preventDefault();
			const currentDistance = this.getTouchDistance(event.touches);
			const scale = currentDistance / this.touchStartDistance;
			const newZoom = this.initialZoom * scale;

			// Apply zoom constraints
			this.currentZoom = Math.max(
				this.minZoom,
				Math.min(this.maxZoom, newZoom)
			);
			this.updateViewportRect();
			this.invalidateLayoutCache();
		}
	}

	onTouchEnd(event: TouchEvent): void {
		if (event.touches.length < 2) {
			this.isMultiTouch = false;
			this.lastTouchDistance = 0;
		}
	}

	private zoomToPoint(newZoom: number, centerX: number, centerY: number): void {
		const viewport = this.seatViewport.nativeElement;
		const oldZoom = this.currentZoom;

		// Calculate the zoom ratio
		const zoomRatio = newZoom / oldZoom;

		// Calculate new scroll position to keep the zoom centered
		const newScrollLeft = (viewport.scrollLeft + centerX) * zoomRatio - centerX;
		const newScrollTop = (viewport.scrollTop + centerY) * zoomRatio - centerY;

		this.currentZoom = newZoom;
		this.invalidateLayoutCache();

		// Use requestAnimationFrame for smooth scrolling
		requestAnimationFrame(() => {
			viewport.scrollLeft = newScrollLeft;
			viewport.scrollTop = newScrollTop;
			this.updateViewportRect();
		});
	}

	// Layout calculation methods
	getTransformStyle(): string {
		return `scale(${this.currentZoom}) translate3d(0, 0, 0)`;
	}

	getContainerWidth(): number {
		if (!this.hall) return 0;

		if (
			this.layoutCache.containerWidth === 0 ||
			this.layoutCache.lastHallId !== this.hall.id ||
			this.layoutCache.lastZoom !== this.currentZoom
		) {
			const seatSize = this.getSeatSize();
			const gap = this.isMobileDevice() ? 2 : 4;
			const rowLabelWidth = this.isMobileDevice() ? 32 : 48;
			const padding = this.isMobileDevice() ? 16 : 32;

			this.layoutCache.containerWidth =
				rowLabelWidth + // Row label
				this.hall.columns * (seatSize + gap) + // Seats + gaps
				padding; // Padding

			this.layoutCache.lastHallId = this.hall.id;
			this.layoutCache.lastZoom = this.currentZoom;
		}

		return this.layoutCache.containerWidth;
	}

	getContainerHeight(): number {
		if (!this.hall) return 0;

		if (
			this.layoutCache.containerHeight === 0 ||
			this.layoutCache.lastHallId !== this.hall.id ||
			this.layoutCache.lastZoom !== this.currentZoom
		) {
			const seatSize = this.getSeatSize();
			const gap = this.isMobileDevice() ? 2 : 8;
			const screenHeight = this.isMobileDevice() ? 80 : 120;
			const legendHeight = this.isMobileDevice() ? 60 : 100;
			const padding = this.isMobileDevice() ? 32 : 64;

			this.layoutCache.containerHeight =
				screenHeight + // Screen section
				legendHeight + // Legend section
				this.hall.rows * (seatSize + gap) + // Seats + gaps
				padding; // Padding

			this.layoutCache.lastHallId = this.hall.id;
			this.layoutCache.lastZoom = this.currentZoom;
		}

		return this.layoutCache.containerHeight;
	}

	getSeatSize(): number {
		if (this.layoutCache.seatSize === 0) {
			this.layoutCache.seatSize = this.isMobileDevice() ? 28 : 48;
		}
		return this.layoutCache.seatSize;
	}

	getSeatFontSize(): number {
		return this.isMobileDevice() ? 9 : 12;
	}

	getScreenWidth(): number {
		if (!this.hall) return 0;

		if (
			this.layoutCache.screenWidth === 0 ||
			this.layoutCache.lastHallId !== this.hall.id
		) {
			const seatSize = this.getSeatSize();
			const gap = this.isMobileDevice() ? 2 : 4;

			this.layoutCache.screenWidth =
				this.hall.screenSpan * (seatSize + gap) - gap;
			this.layoutCache.lastHallId = this.hall.id;
		}

		return this.layoutCache.screenWidth;
	}

	// Device detection
	isMobileDevice(): boolean {
		return window.innerWidth < 640;
	}

	// Performance optimization methods
	trackByCategory(index: number, category: SeatCategory): number {
		return category.id;
	}

	trackByRowIndex(index: number, rowIndex: number): number {
		return rowIndex;
	}

	trackByColIndex(index: number, colIndex: number): number {
		return colIndex;
	}

	// Seat helper methods
	getSeatTooltip(seat: SelectedSeat): string {
		return `${seat.seatNumber} - ${this.formatCurrency(seat.price)}`;
	}

	getSeatAriaLabel(seat: SelectedSeat): string {
		const statusText =
			seat.status === 'available'
				? 'Available'
				: seat.status === 'selected'
				? 'Selected'
				: 'Occupied';
		return `Seat ${seat.seatNumber}, ${statusText}, Price ${this.formatCurrency(
			seat.price
		)}`;
	}

	// Cache invalidation
	private invalidateLayoutCache(): void {
		this.layoutCache = {
			containerWidth: 0,
			containerHeight: 0,
			seatSize: 0,
			screenWidth: 0,
			lastHallId: this.layoutCache.lastHallId,
			lastZoom: this.currentZoom,
		};
	}

	// Enhanced mini map functionality methods
	toggleMiniMap(): void {
		this.showMiniMap = !this.showMiniMap;
		if (this.showMiniMap) {
			// Determine mini map size based on screen size
			const isMobile = this.isMobileDevice();
			this.miniMapWidth = isMobile ? 140 : 200;
			this.miniMapHeight = isMobile ? 100 : 150;
			this.updateViewportRect();
		}
	}

	onMiniMapClick(event: MouseEvent): void {
		if (!this.hall || !this.seatViewport) return;

		const miniMapRect = (
			event.currentTarget as HTMLElement
		).getBoundingClientRect();
		const clickX = event.clientX - miniMapRect.left;
		const clickY = event.clientY - miniMapRect.top;

		// Convert mini map coordinates to main view coordinates
		const miniMapContentWidth = this.miniMapWidth - 16; // Account for padding
		const miniMapContentHeight = this.miniMapHeight - 40; // Account for header and padding

		const mainViewWidth = this.getContainerWidth();
		const mainViewHeight = this.getContainerHeight();

		const scaleX = mainViewWidth / miniMapContentWidth;
		const scaleY = mainViewHeight / miniMapContentHeight;

		const targetX = (clickX - 8) * scaleX; // Account for padding
		const targetY = (clickY - 20) * scaleY; // Account for header

		// Center the view on the clicked position
		const viewport = this.seatViewport.nativeElement;
		viewport.scrollLeft = targetX - viewport.offsetWidth / 2;
		viewport.scrollTop = targetY - viewport.offsetHeight / 2;
	}

	getMiniMapScreenWidth(): number {
		if (!this.hall) return 0;

		// Calculate available width for mini map content
		const isMobile = this.isMobileDevice();
		const miniMapContentWidth = (isMobile ? 140 : 200) - 16; // Account for padding

		// Calculate proportional screen width based on hall layout
		const totalColumns = this.hall.columns;
		const screenSpan = this.hall.screenSpan;
		const screenRatio = screenSpan / totalColumns;

		return Math.floor(miniMapContentWidth * screenRatio);
	}

	// Add method to get mini map seat dimensions that fit within container
	getMiniMapSeatDimensions(): { width: number; height: number; gap: number } {
		if (!this.hall) return { width: 1, height: 1, gap: 0.3 };

		const isMobile = this.isMobileDevice();
		const miniMapContentWidth = (isMobile ? 140 : 200) - 16; // Account for padding
		const miniMapContentHeight = (isMobile ? 100 : 150) - 40; // Account for header and padding

		// Reserve space for screen (about 10% of height)
		const availableSeatsHeight = miniMapContentHeight * 0.85;

		// Calculate seat dimensions to fit all seats within the container
		const seatWidth = Math.max(
			1,
			Math.floor(
				(miniMapContentWidth - this.hall.columns * 0.3) / this.hall.columns
			)
		);
		const seatHeight = Math.max(
			1,
			Math.floor((availableSeatsHeight - this.hall.rows * 0.3) / this.hall.rows)
		);

		// Use the smaller dimension to maintain square-ish seats
		const seatSize = Math.min(seatWidth, seatHeight, 3); // Max 3px

		return {
			width: seatSize,
			height: seatSize,
			gap: Math.max(0.2, seatSize * 0.15),
		};
	}

	getMiniMapSeatStyle(rowIndex: number, colIndex: number): any {
		const seat = this.getSeatAtPosition(rowIndex, colIndex);

		if (!seat) {
			return { backgroundColor: 'transparent' };
		}

		// Return simplified styles for mini map
		if (seat.status === 'selected') {
			return { backgroundColor: '#10b981' }; // green-500
		} else if (seat.status === 'booked') {
			return { backgroundColor: '#f3f4f6' }; // gray-100
		} else {
			// Use a simplified version of the category color
			return { backgroundColor: seat.category?.baseColorHexCode || '#6b7280' };
		}
	}

	onViewportScroll(): void {
		// Debounce scroll updates for performance
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.updateViewportRect();
		}, 16); // ~60fps
	}

	private updateViewportRect(): void {
		if (!this.seatViewport || !this.hall || !this.showMiniMap) return;

		// Cancel previous RAF
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
		}

		this.rafId = requestAnimationFrame(() => {
			const viewport = this.seatViewport.nativeElement;
			const viewportWidth = viewport.offsetWidth;
			const viewportHeight = viewport.offsetHeight;
			const scrollLeft = viewport.scrollLeft;
			const scrollTop = viewport.scrollTop;

			// Calculate the total content size
			const totalWidth = this.getContainerWidth() * this.currentZoom;
			const totalHeight = this.getContainerHeight() * this.currentZoom;

			// Calculate mini map content area
			const miniMapContentWidth = this.miniMapWidth - 16; // Account for padding
			const miniMapContentHeight = this.miniMapHeight - 40; // Account for header and padding

			// Calculate scale factors
			const scaleX = miniMapContentWidth / totalWidth;
			const scaleY = miniMapContentHeight / totalHeight;

			// Calculate viewport rectangle position and size in mini map coordinates
			this.viewportRect = {
				x: scrollLeft * scaleX,
				y: scrollTop * scaleY,
				width: Math.min(viewportWidth * scaleX, miniMapContentWidth),
				height: Math.min(viewportHeight * scaleY, miniMapContentHeight),
			};
		});
	}

	private initializeMiniMap(): void {
		// Mini map should always be visible
		this.showMiniMap = true;

		// Set mini map size based on screen size
		const isMobile = this.isMobileDevice();
		this.miniMapWidth = isMobile ? 140 : 200;
		this.miniMapHeight = isMobile ? 100 : 150;

		// Listen for window resize to adjust mini map
		const resizeHandler = () => {
			const nowMobile = this.isMobileDevice();
			this.miniMapWidth = nowMobile ? 140 : 200;
			this.miniMapHeight = nowMobile ? 100 : 150;
			this.invalidateLayoutCache();
		};

		window.addEventListener('resize', resizeHandler);

		// Clean up on destroy
		this.destroy$.subscribe(() => {
			window.removeEventListener('resize', resizeHandler);
		});
	}

	private getTouchDistance(touches: TouchList): number {
		const touch1 = touches[0];
		const touch2 = touches[1];
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private setupKeyboardShortcuts(): void {
		// Global keyboard shortcuts
		const keyHandler = (event: KeyboardEvent) => {
			// Only handle shortcuts when not typing in inputs
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			switch (event.key) {
				case 'm':
				case 'M':
					// Toggle mini map
					this.toggleMiniMap();
					event.preventDefault();
					break;
				case '+':
				case '=':
					// Zoom in
					this.zoomIn();
					event.preventDefault();
					break;
				case '-':
				case '_':
					// Zoom out
					this.zoomOut();
					event.preventDefault();
					break;
				case '0':
					// Reset zoom
					this.resetZoom();
					event.preventDefault();
					break;
			}
		};

		document.addEventListener('keydown', keyHandler);

		// Clean up on destroy
		this.destroy$.subscribe(() => {
			document.removeEventListener('keydown', keyHandler);
		});
	}
}
