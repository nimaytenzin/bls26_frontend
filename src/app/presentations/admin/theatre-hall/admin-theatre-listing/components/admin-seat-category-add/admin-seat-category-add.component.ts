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
import { CreateSeatCategoryDto } from '../../../../../../core/dataservice/seat-category/seat-category.interface';
import { Hall } from '../../../../../../core/dataservice/hall/hall.interface';

@Component({
	selector: 'app-admin-seat-category-add',
	templateUrl: './admin-seat-category-add.component.html',
	styleUrls: ['./admin-seat-category-add.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSeatCategoryAddComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	seatCategoryForm!: FormGroup;
	hall: Hall;
	isSubmitting = false;

	// Predefined seat category types
	seatCategoryTypes = [
		{ name: 'Standard', baseColorHexCode: '#6b7280', color: '#6b7280' },
		{ name: 'Premium', baseColorHexCode: '#3b82f6', color: '#3b82f6' },
		{ name: 'VIP', baseColorHexCode: '#8b5cf6', color: '#8b5cf6' },
		{ name: 'Deluxe', baseColorHexCode: '#10b981', color: '#10b981' },
		{ name: 'Executive', baseColorHexCode: '#f59e0b', color: '#f59e0b' },
		{ name: 'Gold', baseColorHexCode: '#eab308', color: '#eab308' },
		{ name: 'Platinum', baseColorHexCode: '#64748b', color: '#64748b' },
		{ name: 'Diamond', baseColorHexCode: '#06b6d4', color: '#06b6d4' },
	];

	constructor(
		private fb: FormBuilder,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private seatCategoryService: SeatCategoryDataService,
		private messageService: MessageService
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
		}
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

	onSeatCategoryTypeSelect(type: any): void {
		this.seatCategoryForm.patchValue({
			name: type.name,
			baseColorHexCode: type.baseColorHexCode,
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

		const seatCategoryData: CreateSeatCategoryDto = {
			hallId: this.hall.id,
			name: formValue.name.trim(),
			description: formValue.description?.trim() || undefined,
			baseColorHexCode: formValue.baseColorHexCode.trim(),
		};
		console.log('Creating seat category with data:', seatCategoryData);

		this.seatCategoryService
			.createSeatCategory(seatCategoryData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Create seat category response:', response);

					// Check if response and response.data exist
					if (response && response.data) {
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Seat category "${
								response.data.name || 'New Category'
							}" has been created successfully!`,
						});
						this.ref.close({ success: true, seatCategory: response.data });
					} else {
						// Handle case where response structure is different
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: 'Seat category has been created successfully!',
						});
						this.ref.close({ success: true, seatCategory: response });
					}
				},
				error: (error) => {
					console.error('Error creating seat category:', error);
					this.isSubmitting = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error.error?.message ||
							'Failed to create seat category. Please try again.',
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

	// Utility methods for generating CSS styles from hex codes
	generateSeatStyles(hexCode: string): { [key: string]: string } {
		if (!hexCode) return {};

		return {
			'background-color': hexCode,
			'border-color': this.adjustBrightness(hexCode, -20),
			color: this.getContrastTextColor(hexCode),
		};
	}

	// Adjust brightness of a hex color
	adjustBrightness(hex: string, percent: number): string {
		const num = parseInt(hex.replace('#', ''), 16);
		const amt = Math.round(2.55 * percent);
		const R = (num >> 16) + amt;
		const G = ((num >> 8) & 0x00ff) + amt;
		const B = (num & 0x0000ff) + amt;
		return (
			'#' +
			(
				0x1000000 +
				(R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
				(G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
				(B < 255 ? (B < 1 ? 0 : B) : 255)
			)
				.toString(16)
				.slice(1)
		);
	}

	// Get contrasting text color (white or black) based on background color
	getContrastTextColor(hexColor: string): string {
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 128 ? '#000000' : '#ffffff';
	}
}
