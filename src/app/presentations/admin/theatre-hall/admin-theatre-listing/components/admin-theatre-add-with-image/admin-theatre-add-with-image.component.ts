import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../../../primeng.modules';
import { TheatreDataService } from '../../../../../../core/dataservice/theatre/theatre.dataservice';
import { CreateTheatreWithImageDto } from '../../../../../../core/dataservice/theatre/theatre.interface';
import { DzongkhagDataService } from '../../../../../../core/dataservice/dzonkhag/dzongkhag.dataservice';

@Component({
	selector: 'app-admin-theatre-add-with-image',
	templateUrl: './admin-theatre-add-with-image.component.html',
	styleUrls: ['./admin-theatre-add-with-image.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminTheatreAddWithImageComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	theatreForm: FormGroup;
	loading = false;
	selectedFile: File | null = null;
	imagePreview: string | null = null;

	// Location options
	dzongkhagOptions: { label: string; value: string }[] = [];

	constructor(
		private fb: FormBuilder,
		private theatreService: TheatreDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService,
		private ref: DynamicDialogRef
	) {
		this.theatreForm = this.createForm();
	}

	ngOnInit(): void {
		this.loadDzongkhags();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private createForm(): FormGroup {
		return this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],

			address: ['', [Validators.required]],
			googleMapAddressUrl: [
				'',
				[Validators.required, Validators.pattern('https?://.+')],
			], // URL validation for Google Maps link
			dzongkhagId: ['', [Validators.required]],
		});
	}

	// Load dzongkhags for dropdown options
	private loadDzongkhags(): void {
		this.dzongkhagService
			.findAllDzongkhags()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (dzongkhags) => {
					this.dzongkhagOptions = dzongkhags.map((dzongkhag) => ({
						label: dzongkhag.name,
						value: String(dzongkhag.id),
					}));
				},
				error: (error: any) => {
					console.error('Error loading dzongkhags:', error);
				},
			});
	}

	// File handling
	onFileSelect(event: any): void {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('Please select an image file');
				return;
			}

			// Validate file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				alert('File size must be less than 5MB');
				return;
			}

			this.selectedFile = file;

			// Create preview
			const reader = new FileReader();
			reader.onload = (e: any) => {
				this.imagePreview = e.target.result;
			};
			reader.readAsDataURL(file);
		}
	}

	removeImage(): void {
		this.selectedFile = null;
		this.imagePreview = null;
		// Note: File input will be reset when user clicks the upload button again
	}

	// Form validation helpers
	isFieldInvalid(fieldName: string): boolean {
		const field = this.theatreForm.get(fieldName);
		return !!(field && field.invalid && (field.dirty || field.touched));
	}

	getFieldErrorMessage(fieldName: string): string {
		const field = this.theatreForm.get(fieldName);
		if (field?.errors) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['minlength']) return `${fieldName} is too short`;
			if (field.errors['email']) return 'Please enter a valid email';
			if (field.errors['pattern']) return `Invalid ${fieldName} format`;
			if (field.errors['min'])
				return `${fieldName} must be greater than or equal to ${field.errors['min'].min}`;
		}
		return '';
	}

	// Form submission
	onSubmit(): void {
		if (this.theatreForm.invalid) {
			// Mark all fields as touched to show validation errors
			Object.keys(this.theatreForm.controls).forEach((key) => {
				this.theatreForm.get(key)?.markAsTouched();
			});
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please check all required fields and correct any errors.',
			});
			return;
		}

		this.loading = true;

		const formData = this.theatreForm.value as CreateTheatreWithImageDto;

		if (this.selectedFile) {
			// Create theatre with image
			this.theatreService
				.createTheatreWithImage(this.selectedFile, formData)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response) => {
						console.log('Theatre created successfully:', response);
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Theatre "${formData.name}" has been created successfully!`,
						});
						setTimeout(() => {
							this.ref.close({ success: true, data: response.data });
						}, 1500);
					},
					error: (error) => {
						console.error('Error creating theatre:', error);
						this.loading = false;
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail:
								error.error?.message ||
								'Failed to create theatre. Please try again.',
						});
					},
				});
		} else {
			// Create theatre without image
			this.theatreService
				.createTheatre(formData)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (response) => {
						console.log('Theatre created successfully:', response);
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Theatre "${formData.name}" has been created successfully!`,
						});
						setTimeout(() => {
							this.ref.close({ success: true, data: response.data });
						}, 1500);
					},
					error: (error) => {
						console.error('Error creating theatre:', error);
						this.loading = false;
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail:
								error.error?.message ||
								'Failed to create theatre. Please try again.',
						});
					},
				});
		}
	}

	onCancel(): void {
		this.ref.close({ success: false });
	}
}
