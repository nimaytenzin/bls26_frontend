import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

// Import specific PrimeNG modules
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SeatDataService } from '../../../../../../core/dataservice/seat/seat.dataservice';
import {
	Seat,
	UpdateSeatDto,
} from '../../../../../../core/dataservice/seat/seat.interface';
import { SeatCategory } from '../../../../../../core/dataservice/seat-category/seat-category.interface';
import { Hall } from '../../../../../../core/dataservice/hall/hall.interface';

@Component({
	selector: 'app-admin-seat-edit',
	templateUrl: './admin-seat-edit.component.html',
	styleUrls: ['./admin-seat-edit.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		InputTextModule,
		DropdownModule,
		TextareaModule,
		ButtonModule,
		ToastModule,
	],
	providers: [MessageService],
})
export class AdminSeatEditComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Form data
	seatNumber: string = '';
	categoryId: number | null = null;
	annotation: string = '';

	seat: Seat;
	hall: Hall;
	seatCategories: SeatCategory[] = [];
	isSubmitting = false;

	constructor(
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private seatService: SeatDataService,
		private messageService: MessageService
	) {
		this.seat = this.config.data?.seat;
		this.hall = this.config.data?.hall;
	}

	ngOnInit(): void {
		if (!this.seat) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No seat selected. Please try again.',
			});
			this.onClose();
			return;
		}

		if (!this.hall) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No hall data provided. Please try again.',
			});
			this.onClose();
			return;
		}

		this.loadSeatCategories();
		this.populateForm();
		console.log(this.seat, this.hall);
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private populateForm(): void {
		if (this.seat) {
			this.seatNumber = this.seat.seatNumber;
			this.categoryId = this.seat.categoryId;
			this.annotation = this.seat.annotation || '';
		}
	}

	private loadSeatCategories(): void {
		// Use seat categories from hall data
		this.seatCategories = this.hall.seatCategories || [];

		if (this.seatCategories.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail:
					'No seat categories found for this hall. Please add seat categories first.',
			});
		}
	}

	onSubmit(): void {
		// Simple validation
		if (!this.seatNumber || !this.seatNumber.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Seat Number is required.',
			});
			return;
		}

		if (!this.categoryId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Seat Category is required.',
			});
			return;
		}

		this.isSubmitting = true;

		const updateData: UpdateSeatDto = {
			seatNumber: this.seatNumber.trim(),
			categoryId: this.categoryId,
			annotation: this.annotation?.trim() || undefined,
		};

		this.seatService
			.updateSeat(this.seat.id, updateData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Update seat response:', response);

					if (response && response.data) {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Seat "${response.data.seatNumber}" has been updated successfully!`,
						});
						this.ref.close({ success: true, seat: response.data });
					} else {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Seat has been updated successfully!',
						});
						this.ref.close({
							success: true,
							seat: { ...this.seat, ...updateData },
						});
					}
				},
				error: (error) => {
					console.error('Error updating seat:', error);
					this.isSubmitting = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error.error?.message ||
							'Failed to update seat. Please try again.',
					});
				},
			});
	}

	isFormValid(): boolean {
		return !!(this.seatNumber && this.seatNumber.trim() && this.categoryId);
	}

	getSeatCategoryName(categoryId: number): string {
		const category = this.seatCategories.find((c) => c.id === categoryId);
		return category ? category.name : 'Unknown';
	}

	getSeatCategoryColor(categoryId: number): string {
		const category = this.seatCategories.find((c) => c.id === categoryId);
		return category ? category.baseColorHexCode : 'bg-gray-500';
	}

	onClose(): void {
		this.ref.close();
	}

	// Helper for template
	String = String;
}
