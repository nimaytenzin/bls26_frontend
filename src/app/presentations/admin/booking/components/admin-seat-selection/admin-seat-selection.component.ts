import {
	Component,
	Input,
	Output,
	EventEmitter,
	OnChanges,
	SimpleChanges,
	OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Hall } from '../../../../../core/dataservice/hall/hall.interface';
import { Seat } from '../../../../../core/dataservice/seat/seat.interface';
import {
	Screening,
	ScreeningSeatPrice,
} from '../../../../../core/dataservice/screening/screening.interface';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { SeatDataService } from '../../../../../core/dataservice/seat/seat.dataservice';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';
import {
	Booking,
	BookingStatusEnum,
	OccupiedSeatResponse,
	SeatSelectionDto,
	SeatSelectionResponse,
} from '../../../../../core/dataservice/booking/booking.interface';

interface SelectedSeat extends Seat {
	price: number;
	selected: boolean;
	status: 'available' | 'booked' | 'selected';
}

@Component({
	selector: 'app-admin-seat-selection',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	templateUrl: './admin-seat-selection.component.html',
	styleUrls: ['./admin-seat-selection.component.scss'],
	providers: [MessageService],
})
export class AdminSeatSelectionComponent implements OnChanges, OnDestroy {
	private destroy$ = new Subject<void>();

	@Input() screeningId: number | null = null;

	@Output() seatsSelected = new EventEmitter<SelectedSeat[]>();
	@Output() totalAmountChange = new EventEmitter<number>();

	// Internal data properties
	isLoading = false;
	screening: Screening | null = null;
	hall: Hall | null = null;
	seats: Seat[] = [];
	screeningPrices: ScreeningSeatPrice[] = [];
	seatAvailability: { [seatId: string]: 'available' | 'booked' | 'selected' } =
		{};

	hallLayout: (SelectedSeat | null)[][] = [];
	selectedSeats: SelectedSeat[] = [];

	// Session management for seat selection (new)
	sessionId: string = '';
	selectionTimer: any = null;
	seatSelectionTimeout: number = 0;

	constructor(
		private messageService: MessageService,
		private screeningDataService: ScreeningDataService,
		private seatDataService: SeatDataService,
		private bookingDataService: BookingDataService
	) {
		// Generate a unique session ID for this admin session
		this.sessionId = this.generateSessionId();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['screeningId'] && this.screeningId) {
			this.loadScreeningData();
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();

		// Clear seat selection timer if exists
		if (this.selectionTimer) {
			clearTimeout(this.selectionTimer);
		}
	}

	/**
	 * Generate a unique session ID for this admin session
	 */
	private generateSessionId(): string {
		return (
			'admin_session_' +
			Date.now() +
			'_' +
			Math.random().toString(36).substr(2, 9)
		);
	}

	private loadScreeningData(): void {
		if (!this.screeningId) {
			return;
		}

		this.isLoading = true;
		this.resetData();

		// Fetch screening details with all related data
		this.screeningDataService
			.findScreeningById(this.screeningId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (screening) => {
					console.log('Loaded screening:', screening);
					this.screening = screening;
					this.hall = screening.hall || null;
					this.screeningPrices = screening.screeningSeatPrices || [];

					if (screening.hallId) {
						this.loadSeatsForHall(screening.hallId);
					} else {
						this.isLoading = false;
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'No hall information found for this screening.',
						});
					}
				},
				error: (error) => {
					console.error('Error loading screening:', error);
					this.isLoading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load screening information.',
					});
				},
			});
	}

	private loadSeatsForHall(hallId: number): void {
		// Load seats and occupied seats in parallel using the new API
		// forkJoin({
		// 	seats: this.seatDataService.findSeatsByHallId(hallId),
		// 	occupiedSeats: this.bookingDataService.getOccupiedSeats(
		// 		this.screeningId!,
		// 		this.sessionId
		// 	),
		// })
		// 	.pipe(takeUntil(this.destroy$))
		// 	.subscribe({
		// 		next: (result) => {
		// 			console.log('Admin loaded seats:', result.seats);
		// 			console.log('Admin loaded occupied seats:', result.occupiedSeats);
		// 			this.seats = result.seats;
		// 			// If hall info not available from screening, get it from first seat
		// 			if (!this.hall && result.seats.length > 0 && result.seats[0].hall) {
		// 				this.hall = result.seats[0].hall;
		// 			}
		// 			// Initialize seat availability using occupied seats API
		// 			this.initializeSeatAvailabilityFromOccupied(
		// 				result.seats,
		// 				result.occupiedSeats
		// 			);
		// 			this.generateHallLayout();
		// 			this.isLoading = false;
		// 			// Start periodic refresh of occupied seats for real-time updates
		// 			this.startPeriodicRefresh();
		// 		},
		// 		error: (error) => {
		// 			console.error('Error loading seats or occupied seats:', error);
		// 			this.isLoading = false;
		// 			this.messageService.add({
		// 				severity: 'error',
		// 				summary: 'Error',
		// 				detail: 'Failed to load seat or booking information.',
		// 			});
		// 		},
		// 	});
	}

	/**
	 * Initialize seat availability using the new occupied seats API
	 */
	private initializeSeatAvailabilityFromOccupied(
		seats: Seat[],
		occupiedSeats: OccupiedSeatResponse[]
	): void {
		// Initialize all seats as available
		this.seatAvailability = {};
		seats.forEach((seat) => {
			this.seatAvailability[seat.id.toString()] = 'available';
		});

		// // Mark occupied seats as booked (both CONFIRMED and active PENDING)
		// occupiedSeats.forEach((occupiedSeat) => {
		// 	this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
		// });

		console.log(
			'Admin seat availability from occupied seats API:',
			this.seatAvailability
		);
		console.log('Admin occupied seats:', occupiedSeats);
	}

	private resetData(): void {
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
		this.emitChanges();

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

	toggleSeatSelection(seat: SelectedSeat): void {
		if (seat.status === 'booked') {
			this.messageService.add({
				severity: 'warn',
				summary: 'Seat Unavailable',
				detail: 'This seat is already booked.',
			});
			return;
		}

		const seatIndex = this.selectedSeats.findIndex((s) => s.id === seat.id);

		if (seatIndex > -1) {
			// Remove from selection (deselect)
			this.deselectSeat(seat);
		} else {
			// Add to selection (select)
			this.selectSeat(seat);
		}
	}

	/**
	 * Select a seat and update via API
	 */
	private selectSeat(seat: SelectedSeat): void {
		// Update UI immediately for better UX
		seat.status = 'selected';
		seat.selected = true;
		this.selectedSeats.push(seat);
		this.seatAvailability[seat.id.toString()] = 'selected';

		// Update the layout
		const rowIndex = seat.rowId - 1;
		const colIndex = seat.colId - 1;
		if (this.hallLayout[rowIndex] && this.hallLayout[rowIndex][colIndex]) {
			this.hallLayout[rowIndex][colIndex]!.selected = true;
			this.hallLayout[rowIndex][colIndex]!.status = 'selected';
		}

		this.emitChanges();

		// Call the seat selection API
		this.updateSeatSelection(seat);
	}

	/**
	 * Deselect a seat and update via API
	 */
	private deselectSeat(seat: SelectedSeat): void {
		// Update UI immediately for better UX
		seat.status = 'available';
		seat.selected = false;
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}
		this.seatAvailability[seat.id.toString()] = 'available';

		// Update the layout
		const rowIndex = seat.rowId - 1;
		const colIndex = seat.colId - 1;
		if (this.hallLayout[rowIndex] && this.hallLayout[rowIndex][colIndex]) {
			this.hallLayout[rowIndex][colIndex]!.selected = false;
			this.hallLayout[rowIndex][colIndex]!.status = 'available';
		}

		this.emitChanges();

		// Call the seat deselection API
		this.updateSeatDeselection(seat);
	}

	/**
	 * Update seat selection using the new API with session management
	 */
	private updateSeatSelection(seat: SelectedSeat): void {
		const seatSelectionDto: SeatSelectionDto = {
			seatId: seat.id,
			screeningId: this.screeningId!,
			userMetadata: {
				userAgent: navigator.userAgent,
				ipAddress: '', // Will be populated by backend
			},
		};

		// this.bookingDataService
		// 	.selectSeat(seatSelectionDto)
		// 	.pipe(takeUntil(this.destroy$))
		// 	.subscribe({
		// 		next: (response: SeatSelectionResponse) => {
		// 			console.log('Admin seat selection response:', response);

		// 			if (response.success) {
		// 				// Update seat availability based on response
		// 				this.updateSeatAvailabilityFromResponse(
		// 					response.occupiedSeats ?? []
		// 				);

		// 				this.messageService.add({
		// 					severity: 'success',
		// 					summary: 'Seat Selected',
		// 					detail: `${seat.seatNumber} selected successfully`,
		// 				});
		// 			}
		// 		},
		// 		error: (error) => {
		// 			console.error('Error updating admin seat selection:', error);

		// 			// Handle seat conflict (409 error)
		// 			if (error.status === 409) {
		// 				this.handleSeatConflict(error.error);
		// 			} else {
		// 				this.messageService.add({
		// 					severity: 'error',
		// 					summary: 'Selection Failed',
		// 					detail: 'Failed to update seat selection. Please try again.',
		// 				});

		// 				// Revert UI changes on error
		// 				this.revertSingleSeatSelection(seat);
		// 			}
		// 		},
		// 	});
	}

	/**
	 * Update seat deselection using the new API with session management
	 */
	private updateSeatDeselection(seat: SelectedSeat): void {
		const seatSelectionDto: SeatSelectionDto = {
			seatId: seat.id,
			screeningId: this.screeningId!,
			userMetadata: {
				userAgent: navigator.userAgent,
				ipAddress: '', // Will be populated by backend
			},
		};

		// this.bookingDataService
		// 	.deselectSeat(seatSelectionDto)
		// 	.pipe(takeUntil(this.destroy$))
		// 	.subscribe({
		// 		next: (response: SeatSelectionResponse) => {
		// 			console.log('Admin seat deselection response:', response);

		// 			if (response.success) {
		// 				// Update seat availability based on response
		// 				this.updateSeatAvailabilityFromResponse(
		// 					response.occupiedSeats ?? []
		// 				);

		// 				this.messageService.add({
		// 					severity: 'success',
		// 					summary: 'Seat Deselected',
		// 					detail: `${seat.seatNumber} deselected successfully`,
		// 				});
		// 			}
		// 		},
		// 		error: (error) => {
		// 			console.error('Error deselecting seat:', error);
		// 			this.messageService.add({
		// 				severity: 'error',
		// 				summary: 'Deselection Failed',
		// 				detail: 'Failed to deselect seat. Please try again.',
		// 			});

		// 			// Revert the UI changes since the API call failed
		// 			seat.status = 'selected';
		// 			seat.selected = true;
		// 			this.selectedSeats.push(seat);
		// 			this.seatAvailability[seat.id.toString()] = 'selected';

		// 			// Update the layout
		// 			const rowIndex = seat.rowId - 1;
		// 			const colIndex = seat.colId - 1;
		// 			if (
		// 				this.hallLayout[rowIndex] &&
		// 				this.hallLayout[rowIndex][colIndex]
		// 			) {
		// 				this.hallLayout[rowIndex][colIndex]!.selected = true;
		// 				this.hallLayout[rowIndex][colIndex]!.status = 'selected';
		// 			}

		// 			this.emitChanges();
		// 		},
		// 	});
	}

	/**
	 * Revert single seat selection on error
	 */
	private revertSingleSeatSelection(seat: SelectedSeat): void {
		// Revert UI changes for the specific seat
		seat.status = 'available';
		seat.selected = false;
		const index = this.selectedSeats.findIndex((s) => s.id === seat.id);
		if (index > -1) {
			this.selectedSeats.splice(index, 1);
		}
		this.seatAvailability[seat.id.toString()] = 'available';

		// Update the layout
		const rowIndex = seat.rowId - 1;
		const colIndex = seat.colId - 1;
		if (this.hallLayout[rowIndex] && this.hallLayout[rowIndex][colIndex]) {
			this.hallLayout[rowIndex][colIndex]!.selected = false;
			this.hallLayout[rowIndex][colIndex]!.status = 'available';
		}

		this.emitChanges();
	}

	/**
	 * Update seat availability from the API response
	 */
	private updateSeatAvailabilityFromResponse(
		occupiedSeats: OccupiedSeatResponse[],
		isConflictUpdate: boolean = false
	): void {
		console.log(
			'Updating seat availability from response:',
			occupiedSeats,
			'isConflict:',
			isConflictUpdate
		);

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
		occupiedSeats.forEach((occupiedSeat) => {
			// // In conflict scenarios, mark ALL occupied seats as booked (including previously selected ones)
			// if (isConflictUpdate) {
			// 	console.log(
			// 		`Conflict: Marking seat ${occupiedSeat.seatId} as booked (was occupied by another user)`
			// 	);
			// 	this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
			// } else {
			// 	// In normal updates, don't mark our own selected seats as booked
			// 	const isOurSelection = this.selectedSeats.some(
			// 		(seat) => seat.id === occupiedSeat.seatId
			// 	);
			// 	if (!isOurSelection) {
			// 		console.log(`Marking seat ${occupiedSeat.seatId} as booked`);
			// 		this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
			// 	} else {
			// 		console.log(
			// 			`Seat ${occupiedSeat.seatId} is our selection, keeping as selected`
			// 		);
			// 	}
			// }
		});

		// Update hall layout to reflect changes
		this.updateHallLayoutFromAvailability();

		console.log('Updated seat availability:', this.seatAvailability);
	}

	/**
	 * Update seat availability specifically for conflict scenarios
	 */
	private updateSeatAvailabilityFromConflict(
		occupiedSeats: OccupiedSeatResponse[]
	): void {
		console.log('Updating seat availability from conflict:', occupiedSeats);

		// // Mark only the conflicted seats as booked (don't reset all seats)
		// occupiedSeats.forEach((occupiedSeat) => {
		// 	console.log(`Conflict: Marking seat ${occupiedSeat.seatId} as booked`);
		// 	this.seatAvailability[occupiedSeat.seatId.toString()] = 'booked';
		// });

		console.log(
			'Updated seat availability after conflict:',
			this.seatAvailability
		);
	}

	/**
	 * Clear user selections without affecting other seat states
	 */
	private clearUserSelections(): void {
		console.log('Clearing user seat selections');

		// Clear selected seats array and reset their status to available
		this.selectedSeats.forEach((seat) => {
			seat.status = 'available';
			seat.selected = false;
			this.seatAvailability[seat.id.toString()] = 'available';

			// Update layout
			const rowIndex = seat.rowId - 1;
			const colIndex = seat.colId - 1;
			if (this.hallLayout[rowIndex] && this.hallLayout[rowIndex][colIndex]) {
				this.hallLayout[rowIndex][colIndex]!.selected = false;
				this.hallLayout[rowIndex][colIndex]!.status = 'available';
			}
			console.log(`Cleared selection for seat ${seat.id}`);
		});

		this.selectedSeats = [];
		this.emitChanges();
		console.log('User selections cleared');
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
	 * Handle seat conflict response (409 error)
	 */
	private handleSeatConflict(conflictResponse: any): void {
		this.messageService.add({
			severity: 'warn',
			summary: 'Seat Conflict',
			detail: conflictResponse.message || 'Some seats are no longer available',
		});

		console.log(
			'Occupied seats from conflict response:',
			conflictResponse.occupiedSeats
		);

		// First, mark conflicted seats as booked
		if (
			conflictResponse.occupiedSeats &&
			conflictResponse.occupiedSeats.length > 0
		) {
			console.log(
				'Updating UI with occupied seats from conflict:',
				conflictResponse.occupiedSeats
			);
			this.updateSeatAvailabilityFromConflict(conflictResponse.occupiedSeats);
		}

		// Then, revert only the conflicted seats while preserving successful selections
		this.revertConflictedSeats(conflictResponse.occupiedSeats || []);

		// Force update the hall layout to reflect the changes
		this.updateHallLayoutFromAvailability();
	}

	/**
	 * Revert seat selection on error
	 */
	private revertSeatSelection(): void {
		console.log('Reverting seat selection for conflicted seats');

		// Clear all selected seats and revert only our selections to available
		// Do not change seats that are marked as 'booked' from the conflict response
		this.selectedSeats.forEach((seat) => {
			// Only revert to available if the seat isn't marked as booked by someone else
			const currentAvailability = this.seatAvailability[seat.id.toString()];
			if (currentAvailability !== 'booked') {
				seat.status = 'available';
				seat.selected = false;
				this.seatAvailability[seat.id.toString()] = 'available';
				console.log(`Reverted seat ${seat.id} to available`);
			} else {
				// This seat was taken by someone else, mark it properly
				seat.status = 'booked';
				seat.selected = false;
				console.log(
					`Seat ${seat.id} was taken by another user, marked as booked`
				);
			}
		});

		this.selectedSeats = [];
		this.updateHallLayoutFromAvailability();
		this.emitChanges();

		console.log('Seat selection reversion complete');
	}

	/**
	 * Revert only conflicted seats while preserving successful selections
	 */
	private revertConflictedSeats(occupiedSeats: OccupiedSeatResponse[]): void {
		console.log('Reverting only conflicted seats');

		// Get the IDs of seats that are now occupied by others
		// const conflictedSeatIds = occupiedSeats.map((os) => os.seatId);

		// // // Only remove seats from our selection if they are in the conflict list
		// // this.selectedSeats = this.selectedSeats.filter((seat) => {
		// // 	const isConflicted = conflictedSeatIds.includes(seat.id);

		// // 	if (isConflicted) {
		// // 		// This seat was taken by someone else, remove from our selection
		// // 		console.log(`Removing conflicted seat ${seat.id} from selection`);
		// // 		seat.status = 'booked';
		// // 		seat.selected = false;

		// // 		// Update the layout
		// // 		const rowIndex = seat.rowId - 1;
		// // 		const colIndex = seat.colId - 1;
		// // 		if (this.hallLayout[rowIndex] && this.hallLayout[rowIndex][colIndex]) {
		// // 			this.hallLayout[rowIndex][colIndex]!.selected = false;
		// // 			this.hallLayout[rowIndex][colIndex]!.status = 'booked';
		// // 		}

		// 		return false; // Remove from selectedSeats array
		// 	} else {
		// 		// This seat is still ours, keep it selected
		// 		console.log(`Keeping successfully selected seat ${seat.id}`);
		// // 		return true; // Keep in selectedSeats array
		// // 	}
		// });

		// Emit changes to parent component
		this.emitChanges();

		console.log(
			`Conflict resolution complete. Remaining selected seats: ${this.selectedSeats.length}`
		);
	}

	/**
	 * Start timer for seat selection timeout
	 */
	private startSeatSelectionTimer(timeoutSeconds: number): void {
		// Clear existing timer
		if (this.selectionTimer) {
			clearTimeout(this.selectionTimer);
		}

		this.seatSelectionTimeout = timeoutSeconds;

		// Set timeout to automatically clear selections
		this.selectionTimer = setTimeout(() => {
			this.messageService.add({
				severity: 'warn',
				summary: 'Selection Expired',
				detail: 'Your seat selection has expired. Please select seats again.',
			});
			this.revertSeatSelection();
		}, timeoutSeconds * 1000);
	}

	/**
	 * Periodically refresh occupied seats to handle concurrent user selections
	 */
	private startPeriodicRefresh(): void {
		// Refresh every 30 seconds
		setInterval(() => {
			if (this.screeningId && !this.isLoading) {
				this.refreshOccupiedSeats();
			}
		}, 30000);
	}

	/**
	 * Refresh occupied seats without affecting current selections
	 */
	private refreshOccupiedSeats(): void {
		// this.bookingDataService
		// 	.getOccupiedSeats(this.screeningId!, this.sessionId)
		// 	.pipe(takeUntil(this.destroy$))
		// 	.subscribe({
		// 		next: (occupiedSeats: OccupiedSeatResponse[]) => {
		// 			console.log('Admin refreshed occupied seats:', occupiedSeats);
		// 			this.updateSeatAvailabilityFromResponse(occupiedSeats);
		// 		},
		// 		error: (error) => {
		// 			console.error('Error refreshing occupied seats:', error);
		// 			// Silently fail - don't disrupt user experience
		// 		},
		// 	});
	}

	getSeatClass(seat: SelectedSeat): string {
		const baseClass =
			'w-8 h-8 rounded-t-lg text-xs font-bold flex items-center justify-center transition-all duration-200 cursor-pointer border-2';

		if (seat.status === 'booked') {
			return `${baseClass} bg-red-500 text-white border-red-600 cursor-not-allowed`;
		}

		if (seat.status === 'selected') {
			return `${baseClass} bg-green-500 text-white border-green-600 shadow-lg transform scale-110`;
		}

		// Available seat - color by category
		if (seat.category?.className) {
			return `${baseClass} ${seat.category.className} border-white hover:scale-105`;
		}

		return `${baseClass} bg-blue-500 text-white border-blue-600 hover:scale-105`;
	}

	getSeatDisplayText(seat: SelectedSeat): string {
		return seat.seatNumber || '';
	}

	getHallRows(): number[] {
		if (!this.hall) return [];
		return Array.from({ length: this.hall.rows }, (_, i) => i);
	}

	getHallColumns(): number[] {
		if (!this.hall) return [];
		return Array.from({ length: this.hall.columns }, (_, i) => i);
	}

	getRowLabel(rowIndex: number): string {
		return String.fromCharCode(65 + rowIndex); // A, B, C, etc.
	}

	getTotalAmount(): number {
		return this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
	}

	getUniqueSeatCategories(): Array<{
		category: any;
		price: number;
		count: number;
	}> {
		const categoryMap = new Map<
			string,
			{
				category: any;
				price: number;
				count: number;
			}
		>();

		this.seats.forEach((seat) => {
			if (seat.category && seat.categoryId) {
				const price = this.getSeatPrice(seat);
				const key = seat.categoryId.toString();

				if (categoryMap.has(key)) {
					categoryMap.get(key)!.count++;
				} else {
					categoryMap.set(key, {
						category: seat.category,
						price: price,
						count: 1,
					});
				}
			}
		});

		return Array.from(categoryMap.values()).sort((a, b) => a.price - b.price);
	}

	getSelectedSeatsByCategory(): Array<{
		category: any;
		seats: SelectedSeat[];
		totalPrice: number;
	}> {
		const categoryMap = new Map<
			string,
			{
				category: any;
				seats: SelectedSeat[];
				totalPrice: number;
			}
		>();

		this.selectedSeats.forEach((seat) => {
			if (seat.category && seat.categoryId) {
				const key = seat.categoryId.toString();

				if (categoryMap.has(key)) {
					const existing = categoryMap.get(key)!;
					existing.seats.push(seat);
					existing.totalPrice += seat.price;
				} else {
					categoryMap.set(key, {
						category: seat.category,
						seats: [seat],
						totalPrice: seat.price,
					});
				}
			}
		});

		return Array.from(categoryMap.values()).sort((a, b) =>
			a.category.name.localeCompare(b.category.name)
		);
	}

	private emitChanges(): void {
		this.seatsSelected.emit([...this.selectedSeats]);
		this.totalAmountChange.emit(this.getTotalAmount());
	}

	clearSelection(): void {
		// Clear selections one by one using the deselect API
		const seatsToDeselect = [...this.selectedSeats];

		seatsToDeselect.forEach((seat) => {
			this.deselectSeat(seat);
		});
	}
}
