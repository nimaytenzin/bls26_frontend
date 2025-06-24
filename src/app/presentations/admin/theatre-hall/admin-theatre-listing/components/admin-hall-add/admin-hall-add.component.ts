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
import { HallDataService } from '../../../../../../core/dataservice/hall/hall.dataservice';
import { CreateHallDto } from '../../../../../../core/dataservice/hall/hall.interface';
import { Theatre } from '../../../../../../core/dataservice/theatre/theatre.interface';

@Component({
	selector: 'app-admin-hall-add',
	templateUrl: './admin-hall-add.component.html',
	styleUrls: ['./admin-hall-add.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminHallAddComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	hallForm: FormGroup;
	loading = false;
	theatre: Theatre;

	constructor(
		private fb: FormBuilder,
		private hallService: HallDataService,
		private messageService: MessageService,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig
	) {
		this.theatre = this.config.data?.theatre;
		this.hallForm = this.createForm();
	}

	ngOnInit(): void {
		if (!this.theatre) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No theatre selected. Please try again.',
			});
			this.onCancel();
		}
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private createForm(): FormGroup {
		return this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			description: [''],
			capacity: [0, [Validators.required, Validators.min(1)]],
			rows: [0, [Validators.required, Validators.min(1)]],
			columns: [0, [Validators.required, Validators.min(1)]],
			screenStart: [1, [Validators.required, Validators.min(1)]],
			screenSpan: [1, [Validators.required, Validators.min(1)]],
		});
	}

	// Validation helpers
	isFieldInvalid(fieldName: string): boolean {
		const field = this.hallForm.get(fieldName);
		return !!(field && field.invalid && (field.dirty || field.touched));
	}

	getFieldErrorMessage(fieldName: string): string {
		const field = this.hallForm.get(fieldName);
		if (field?.errors) {
			if (field.errors['required']) {
				return `${this.getFieldLabel(fieldName)} is required`;
			}
			if (field.errors['minlength']) {
				return `${this.getFieldLabel(fieldName)} must be at least ${
					field.errors['minlength'].requiredLength
				} characters`;
			}
			if (field.errors['min']) {
				return `${this.getFieldLabel(fieldName)} must be at least ${
					field.errors['min'].min
				}`;
			}
		}
		return '';
	}

	private getFieldLabel(fieldName: string): string {
		const labels: { [key: string]: string } = {
			name: 'Hall Name',
			description: 'Description',
			capacity: 'Capacity',
			rows: 'Number of Rows',
			columns: 'Number of Columns',
			screenStart: 'Screen Start Position',
			screenSpan: 'Screen Span',
		};
		return labels[fieldName] || fieldName;
	}

	// Calculate capacity based on rows and columns
	onRowsOrColumnsChange(): void {
		const rows = this.hallForm.get('rows')?.value || 0;
		const columns = this.hallForm.get('columns')?.value || 0;
		const calculatedCapacity = rows * columns;

		if (calculatedCapacity > 0) {
			this.hallForm.patchValue({ capacity: calculatedCapacity });
		}
	}

	// Validate screen positioning
	onScreenStartChange(): void {
		const columns = this.hallForm.get('columns')?.value || 0;
		const screenStart = this.hallForm.get('screenStart')?.value || 1;
		const screenSpan = this.hallForm.get('screenSpan')?.value || 1;

		// Ensure screen doesn't exceed hall width
		if (screenStart + screenSpan - 1 > columns) {
			this.hallForm.patchValue({
				screenSpan: Math.max(1, columns - screenStart + 1),
			});
		}
	}

	onScreenSpanChange(): void {
		const columns = this.hallForm.get('columns')?.value || 0;
		const screenStart = this.hallForm.get('screenStart')?.value || 1;
		const screenSpan = this.hallForm.get('screenSpan')?.value || 1;

		// Ensure screen doesn't exceed hall width
		if (screenStart + screenSpan - 1 > columns) {
			this.hallForm.patchValue({
				screenStart: Math.max(1, columns - screenSpan + 1),
			});
		}
	}

	// Helper for template
	Array = Array;

	// Check if seat position represents screen area
	isScreenPosition(index: number): boolean {
		const columns = this.hallForm.get('columns')?.value || 1;
		const screenStart = this.hallForm.get('screenStart')?.value || 1;
		const screenSpan = this.hallForm.get('screenSpan')?.value || 1;

		const column = (index % columns) + 1;
		return column >= screenStart && column < screenStart + screenSpan;
	}

	// Form submission
	onSubmit(): void {
		if (this.hallForm.invalid) {
			// Mark all fields as touched to show validation errors
			Object.keys(this.hallForm.controls).forEach((key) => {
				this.hallForm.get(key)?.markAsTouched();
			});
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please check all required fields and correct any errors.',
			});
			return;
		}

		this.loading = true;

		const formData = this.hallForm.value as Omit<CreateHallDto, 'theatreId'>;
		const hallData: CreateHallDto = {
			...formData,
			theatreId: parseInt(this.theatre.id), // Convert string ID to number
		};

		this.hallService
			.createHall(hallData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Hall created successfully:', response);
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Hall "${hallData.name}" has been created successfully!`,
					});
					setTimeout(() => {
						this.ref.close({ success: true, data: response.data });
					}, 1500);
				},
				error: (error) => {
					console.error('Error creating hall:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail:
							error.error?.message ||
							'Failed to create hall. Please try again.',
					});
				},
			});
	}

	onCancel(): void {
		this.ref.close({ success: false });
	}
}
