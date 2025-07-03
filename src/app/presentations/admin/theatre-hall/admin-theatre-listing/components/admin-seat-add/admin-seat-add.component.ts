import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../../../primeng.modules';
import { SeatDataService } from '../../../../../../core/dataservice/seat/seat.dataservice';
import { SeatCategoryDataService } from '../../../../../../core/dataservice/seat-category/seat-category.dataservice';
import {
	CreateSeatDto,
	Seat,
} from '../../../../../../core/dataservice/seat/seat.interface';
import { SeatCategory } from '../../../../../../core/dataservice/seat-category/seat-category.interface';
import { Hall } from '../../../../../../core/dataservice/hall/hall.interface';

@Component({
	selector: 'app-admin-seat-add',
	templateUrl: './admin-seat-add.component.html',
	styleUrls: ['./admin-seat-add.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminSeatAddComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	seatForm!: FormGroup;
	hall: Hall;
	isSubmitting = false;
	seatCategories: SeatCategory[] = [];
	selectedCells: { row: number; col: number }[] = [];
	hallLayout: boolean[][] = [];
	existingSeats: Seat[] = [];
	existingSeatPositions: Map<string, Seat> = new Map();
	deletingSeats: Set<number> = new Set(); // Track seats being deleted

	constructor(
		private fb: FormBuilder,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private seatService: SeatDataService,
		private seatCategoryService: SeatCategoryDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {
		this.hall = this.config.data?.hall;
		this.initializeForm();
	}

	ngOnInit(): void {
		if (!this.hall) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No hall selected. Please try again.',
			});
			this.onClose();
			return;
		}

		this.initializeHallLayout();
		this.loadSeatCategories();
		this.loadExistingSeats();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeForm(): void {
		this.seatForm = this.fb.group({
			categoryId: ['', [Validators.required]],
			annotation: ['', [Validators.maxLength(100)]],
		});
	}

	private initializeHallLayout(): void {
		// Initialize layout grid with false values (not selected)
		this.hallLayout = Array(this.hall.rows)
			.fill(null)
			.map(() => Array(this.hall.columns).fill(false));
	}

	private loadSeatCategories(): void {
		// Load existing seat categories for this hall
		// Note: This would typically be done through the seat category service
		// For now, we'll use the hall's existing seat categories
		this.seatCategories = this.hall.seatCategories || [];
	}

	private loadExistingSeats(): void {
		this.seatService
			.findSeatsByHallId(this.hall.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (seats) => {
					this.existingSeats = seats;
					this.buildExistingSeatPositions();
				},
				error: (error) => {
					console.error('Error loading existing seats:', error);
					this.messageService.add({
						severity: 'warn',
						summary: 'Warning',
						detail: 'Could not load existing seats.',
					});
				},
			});
	}

	private buildExistingSeatPositions(): void {
		this.existingSeatPositions.clear();
		this.existingSeats.forEach((seat) => {
			const key = `${seat.rowId}-${seat.colId}`;
			this.existingSeatPositions.set(key, seat);
		});
	}

	hasExistingSeat(row: number, col: number): boolean {
		const key = `${row + 1}-${col + 1}`;
		return this.existingSeatPositions.has(key);
	}

	getExistingSeat(row: number, col: number): Seat | undefined {
		const key = `${row + 1}-${col + 1}`;
		return this.existingSeatPositions.get(key);
	}

	onCellClick(row: number, col: number): void {
		// Check if there's an existing seat at this position
		if (this.hasExistingSeat(row, col)) {
			this.handleExistingSeatClick(row, col);
			return;
		}

		// Handle new seat selection
		const cellIndex = this.selectedCells.findIndex(
			(cell) => cell.row === row && cell.col === col
		);

		if (cellIndex > -1) {
			// Deselect cell
			this.selectedCells.splice(cellIndex, 1);
			this.hallLayout[row][col] = false;
		} else {
			// Select cell
			this.selectedCells.push({ row, col });
			this.hallLayout[row][col] = true;
		}
	}

	private handleExistingSeatClick(row: number, col: number): void {
		const seat = this.getExistingSeat(row, col);
		if (!seat) return;

		this.confirmationService.confirm({
			message: `Are you sure you want to delete seat ${seat.seatNumber}? This action cannot be undone.`,
			header: 'Confirm Seat Deletion',
			icon: 'pi pi-exclamation-triangle',
			acceptIcon: 'none',
			rejectIcon: 'none',
			rejectButtonStyleClass: 'p-button-text',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.deleteSeat(seat);
			},
			reject: () => {
				// User cancelled - do nothing
			},
		});
	}

	private deleteSeat(seat: Seat): void {
		this.deletingSeats.add(seat.id);

		this.seatService
			.deleteSeat(seat.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Seat ${seat.seatNumber} has been deleted successfully!`,
					});

					// Remove seat from local arrays
					this.existingSeats = this.existingSeats.filter(
						(s) => s.id !== seat.id
					);
					this.buildExistingSeatPositions();
					this.deletingSeats.delete(seat.id);
				},
				error: (error) => {
					console.error('Error deleting seat:', error);
					this.deletingSeats.delete(seat.id);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error.error?.message ||
							'Failed to delete seat. Please try again.',
					});
				},
			});
	}

	isCellSelected(row: number, col: number): boolean {
		return this.hallLayout[row][col];
	}

	getCellClass(row: number, col: number): string {
		let baseClass =
			'w-8 h-8 border border-gray-300 cursor-pointer transition-colors duration-200 flex items-center justify-center text-xs font-medium ';

		// Check if there's an existing seat
		if (this.hasExistingSeat(row, col)) {
			const seat = this.getExistingSeat(row, col);
			if (seat && this.deletingSeats.has(seat.id)) {
				// Seat is being deleted - show loading state
				baseClass +=
					'bg-red-400 text-white border-red-600 opacity-50 animate-pulse';
			} else {
				const categoryClass =
					seat?.category?.baseColorHexCode || 'bg-green-500';
				baseClass += `${categoryClass} text-white border-gray-700 hover:opacity-80`;
			}
		} else if (this.isCellSelected(row, col)) {
			baseClass += 'bg-blue-500 text-white border-blue-600';
		} else {
			baseClass += 'bg-gray-100 hover:bg-gray-200 text-gray-600';
		}

		return baseClass;
	}

	getCellContent(row: number, col: number): string {
		if (this.hasExistingSeat(row, col)) {
			const seat = this.getExistingSeat(row, col);
			return seat?.seatNumber.slice(-2) || '';
		}
		return `${this.getRowLabel(row)}${col + 1}`;
	}

	getCellTitle(row: number, col: number): string {
		if (this.hasExistingSeat(row, col)) {
			const seat = this.getExistingSeat(row, col);
			if (seat && this.deletingSeats.has(seat.id)) {
				return `Deleting seat: ${seat.seatNumber}...`;
			}
			const categoryName = seat?.category?.name || 'Unknown';
			return `Existing seat: ${seat?.seatNumber} (${categoryName}) - Click to delete`;
		}
		return `Cell ${this.getRowLabel(row)}${
			col + 1
		} - Click to select for new seat`;
	}

	getRowLabel(rowIndex: number): string {
		return String.fromCharCode(65 + rowIndex); // A, B, C, etc.
	}

	generateSeats(): void {
		if (this.seatForm.invalid) {
			this.markFormGroupTouched();
			return;
		}

		if (this.selectedCells.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Cells Selected',
				detail: 'Please select at least one cell to create seats.',
			});
			return;
		}

		this.isSubmitting = true;
		const formValue = this.seatForm.value;

		// Generate seat data for selected cells
		const seatsToCreate: CreateSeatDto[] = this.selectedCells.map((cell) => ({
			hallId: this.hall.id,
			rowId: cell.row + 1, // Convert to 1-based indexing
			colId: cell.col + 1, // Convert to 1-based indexing
			seatNumber: `${this.getRowLabel(cell.row)}${cell.col + 1}`,
			annotation: formValue.annotation?.trim() || undefined,
			categoryId: formValue.categoryId,
		}));

		this.seatService
			.createMultipleSeats(seatsToCreate)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Create multiple seats response:', response);

					// Update local existing seats list
					if (response && response.data) {
						this.existingSeats.push(...response.data);
						this.buildExistingSeatPositions();

						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `${response.data.length} seats have been created successfully!`,
						});

						// Clear selection after successful creation
						this.clearSelection();
						this.isSubmitting = false;

						// Close dialog with success flag
						this.ref.close({ success: true, seats: response.data });
					} else {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Seats have been created successfully!',
						});
						this.ref.close({ success: true, seats: response });
					}
				},
				error: (error) => {
					console.error('Error creating seats:', error);
					this.isSubmitting = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error.error?.message ||
							'Failed to create seats. Please try again.',
					});
				},
			});
	}

	clearSelection(): void {
		this.selectedCells = [];
		this.initializeHallLayout();
	}

	selectAll(): void {
		this.selectedCells = [];
		for (let row = 0; row < this.hall.rows; row++) {
			for (let col = 0; col < this.hall.columns; col++) {
				// Only select cells that don't have existing seats
				if (!this.hasExistingSeat(row, col)) {
					this.selectedCells.push({ row, col });
					this.hallLayout[row][col] = true;
				}
			}
		}
	}

	private markFormGroupTouched(): void {
		Object.keys(this.seatForm.controls).forEach((key) => {
			const control = this.seatForm.get(key);
			control?.markAsTouched();
		});
	}

	isFieldInvalid(fieldName: string): boolean {
		const field = this.seatForm.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getFieldError(fieldName: string): string {
		const field = this.seatForm.get(fieldName);
		if (field?.errors && field.touched) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['maxlength'])
				return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
		}
		return '';
	}

	onClose(): void {
		this.ref.close();
	}

	// Helper methods for template
	Array = Array;

	getExistingSeatsByCategory(): {
		name: string;
		className: string;
		count: number;
	}[] {
		const categoryMap = new Map<
			string,
			{ name: string; className: string; count: number }
		>();

		this.existingSeats.forEach((seat) => {
			if (seat.category) {
				const key = seat.category.name;
				if (categoryMap.has(key)) {
					categoryMap.get(key)!.count++;
				} else {
					categoryMap.set(key, {
						name: seat.category.name,
						className: seat.category.baseColorHexCode,
						count: 1,
					});
				}
			}
		});

		return Array.from(categoryMap.values()).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	getSeatCategoryColor(categoryId: number): string {
		const category = this.seatCategories.find((c) => c.id === categoryId);
		if (!category) return '#6b7280';

		const colorMap: { [key: string]: string } = {
			'standard-seat': '#6b7280',
			'premium-seat': '#3b82f6',
			'vip-seat': '#8b5cf6',
			'deluxe-seat': '#10b981',
			'executive-seat': '#f59e0b',
			'gold-seat': '#eab308',
			'platinum-seat': '#64748b',
			'diamond-seat': '#06b6d4',
		};
		return colorMap[category.baseColorHexCode] || '#6b7280';
	}
}
