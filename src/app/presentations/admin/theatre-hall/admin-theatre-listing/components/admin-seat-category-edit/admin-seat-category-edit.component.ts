import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../../../primeng.modules';
import { SeatCategoryDataService } from '../../../../../../core/dataservice/seat-category/seat-category.dataservice';
import {
	UpdateSeatCategoryDto,
	SeatCategory,
} from '../../../../../../core/dataservice/seat-category/seat-category.interface';

@Component({
	selector: 'app-admin-seat-category-edit',
	templateUrl: './admin-seat-category-edit.component.html',
	styleUrls: ['./admin-seat-category-edit.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSeatCategoryEditComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	seatCategoryForm!: FormGroup;
	seatCategory: SeatCategory;
	isSubmitting = false;

	// Predefined seat category types
	seatCategoryTypes = [
		{ name: 'Standard', className: 'standard-seat', color: '#6b7280' },
		{ name: 'Premium', className: 'premium-seat', color: '#3b82f6' },
		{ name: 'VIP', className: 'vip-seat', color: '#8b5cf6' },
		{ name: 'Deluxe', className: 'deluxe-seat', color: '#10b981' },
		{ name: 'Executive', className: 'executive-seat', color: '#f59e0b' },
		{ name: 'Gold', className: 'gold-seat', color: '#eab308' },
		{ name: 'Platinum', className: 'platinum-seat', color: '#64748b' },
		{ name: 'Diamond', className: 'diamond-seat', color: '#06b6d4' },
	];

	constructor(
		private fb: FormBuilder,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private seatCategoryService: SeatCategoryDataService,
		private messageService: MessageService
	) {
		this.seatCategory = this.config.data?.seatCategory;
		this.initializeForm();
	}

	ngOnInit(): void {
		if (!this.seatCategory) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No seat category selected. Please try again.',
			});
			this.onClose();
			return;
		}

		this.populateForm();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeForm(): void {
		this.seatCategoryForm = this.fb.group({
			name: [
				'',
				[
					Validators.required,
					Validators.minLength(2),
					Validators.maxLength(50),
				],
			],
			description: ['', [Validators.maxLength(200)]],
			baseColorHexCode: ['', [Validators.required]],
		});
	}

	private populateForm(): void {
		this.seatCategoryForm.patchValue({
			name: this.seatCategory.name,
			description: this.seatCategory.description || '',
			className: this.seatCategory.baseColorHexCode,
		});
	}

	onSeatCategoryTypeSelect(type: any): void {
		this.seatCategoryForm.patchValue({
			name: type.name,
			className: type.className,
			description: `${type.name} seating category`,
		});
	}

	onSubmit(): void {
		if (this.seatCategoryForm.invalid) {
			this.markFormGroupTouched();
			return;
		}

		this.isSubmitting = true;
		const formValue = this.seatCategoryForm.value;

		const updateData: UpdateSeatCategoryDto = {
			name: formValue.name.trim(),
			description: formValue.description?.trim() || undefined,
			baseColorHexCode: formValue.baseColorHexCode.trim(),
		};

		this.seatCategoryService
			.updateSeatCategory(this.seatCategory.id, updateData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Update seat category response:', response);

					// Check if response and response.data exist
					if (response && response.data) {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Seat category "${
								response.data.name || 'Category'
							}" has been updated successfully!`,
						});
						this.ref.close({ success: true, seatCategory: response.data });
					} else {
						// Handle case where response structure is different
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Seat category has been updated successfully!',
						});
						this.ref.close({ success: true, seatCategory: response });
					}
				},
				error: (error) => {
					console.error('Error updating seat category:', error);
					this.isSubmitting = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error.error?.message ||
							'Failed to update seat category. Please try again.',
					});
				},
			});
	}

	private markFormGroupTouched(): void {
		Object.keys(this.seatCategoryForm.controls).forEach((key) => {
			const control = this.seatCategoryForm.get(key);
			control?.markAsTouched();
		});
	}

	isFieldInvalid(fieldName: string): boolean {
		const field = this.seatCategoryForm.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getFieldError(fieldName: string): string {
		const field = this.seatCategoryForm.get(fieldName);
		if (field?.errors && field.touched) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['minlength'])
				return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
			if (field.errors['maxlength'])
				return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
		}
		return '';
	}

	onClose(): void {
		this.ref.close();
	}

	getSeatCategoryColor(className: string): string {
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
		return colorMap[className] || '#6b7280';
	}
}
