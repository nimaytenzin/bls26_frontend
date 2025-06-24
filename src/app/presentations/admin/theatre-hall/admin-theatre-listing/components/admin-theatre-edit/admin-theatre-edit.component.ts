import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';

import { PrimeNgModules } from '../../../../../../primeng.modules';
import { TheatreDataService } from '../../../../../../core/dataservice/theatre/theatre.dataservice';
import {
	UpdateTheatreDto,
	Theatre,
} from '../../../../../../core/dataservice/theatre/theatre.interface';
import { DzongkhagDataService } from '../../../../../../core/dataservice/dzonkhag/dzongkhag.dataservice';

@Component({
	selector: 'app-admin-theatre-edit',
	templateUrl: './admin-theatre-edit.component.html',
	styleUrls: ['./admin-theatre-edit.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminTheatreEditComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	theatreForm: FormGroup;
	loading = false;
	selectedFile: File | null = null;
	imagePreview: string | null = null;
	theatre: Theatre;

	// Location options
	dzongkhagOptions: { label: string; value: string }[] = [];

	// Predefined city options (Bhutanese cities)
	cityOptions = [
		{ label: 'Thimphu', value: 'Thimphu' },
		{ label: 'Paro', value: 'Paro' },
		{ label: 'Punakha', value: 'Punakha' },
		{ label: 'Wangdue Phodrang', value: 'Wangdue Phodrang' },
		{ label: 'Bumthang', value: 'Bumthang' },
		{ label: 'Trongsa', value: 'Trongsa' },
		{ label: 'Mongar', value: 'Mongar' },
		{ label: 'Lhuntse', value: 'Lhuntse' },
		{ label: 'Trashigang', value: 'Trashigang' },
		{ label: 'Trashiyangtse', value: 'Trashiyangtse' },
		{ label: 'Pemagatshel', value: 'Pemagatshel' },
		{ label: 'Samdrup Jongkhar', value: 'Samdrup Jongkhar' },
		{ label: 'Sarpang', value: 'Sarpang' },
		{ label: 'Zhemgang', value: 'Zhemgang' },
		{ label: 'Dagana', value: 'Dagana' },
		{ label: 'Samtse', value: 'Samtse' },
		{ label: 'Chhukha', value: 'Chhukha' },
		{ label: 'Haa', value: 'Haa' },
		{ label: 'Gasa', value: 'Gasa' },
		{ label: 'Phuntsholing', value: 'Phuntsholing' },
	];

	constructor(
		private fb: FormBuilder,
		private theatreService: TheatreDataService,
		private dzongkhagService: DzongkhagDataService,
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private messageService: MessageService
	) {
		this.theatre = this.config.data?.theatre;
		this.theatreForm = this.createForm();
	}

	ngOnInit(): void {
		this.loadDzongkhags();
		this.populateForm();
		this.loadExistingImage();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private createForm(): FormGroup {
		return this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],

			address: ['', [Validators.required]],
			googleMapAddressUrl: ['', [Validators.required]],

			dzongkhagId: ['', [Validators.required]],
		});
	}

	private populateForm(): void {
		if (this.theatre) {
			this.theatreForm.patchValue({
				name: this.theatre.name,
				googleMapAddressUrl: this.theatre.googleMapAddressUrl,
				address: this.theatre.address,
				dzongkhagId: this.theatre.dzongkhagId,
			});
		}
	}

	private loadExistingImage(): void {
		if (this.theatre?.imageUrl) {
			this.imagePreview = this.theatreService.getTheatreImageUrlOrDefault(
				this.theatre
			);
		}
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
					// Fallback to mock data if API fails
					this.dzongkhagOptions = [
						{ label: 'Thimphu Dzongkhag', value: '1' },
						{ label: 'Paro Dzongkhag', value: '2' },
						{ label: 'Punakha Dzongkhag', value: '3' },
						{ label: 'Wangdue Phodrang Dzongkhag', value: '4' },
						{ label: 'Bumthang Dzongkhag', value: '5' },
					];
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
			if (field.errors['min'])
				return `${fieldName} must be greater than or equal to ${field.errors['min'].min}`;
			if (field.errors['max'])
				return `${fieldName} must be less than or equal to ${field.errors['max'].max}`;
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
			return;
		}

		this.loading = true;

		const formData = this.theatreForm.value as UpdateTheatreDto;

		if (this.selectedFile) {
			// Update theatre image first, then update theatre details
			this.theatreService
				.updateTheatreImage(this.theatre.id, this.selectedFile)
				.subscribe({
					next: () => {
						// Then update theatre details
						this.updateTheatreDetails(formData);
					},
					error: (error) => {
						console.error('Error updating theatre image:', error);
						this.loading = false;
					},
				});
		} else {
			// Update theatre details only
			this.updateTheatreDetails(formData);
		}
	}

	private updateTheatreDetails(formData: UpdateTheatreDto): void {
		this.theatreService.updateTheatre(this.theatre.id, formData).subscribe({
			next: (response) => {
				console.log('Theatre updated successfully:', response);
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Theatre updated successfully!',
				});
				this.ref.close({ success: true, data: response.data });
			},
			error: (error) => {
				console.error('Error updating theatre:', error);
				this.loading = false;
			},
		});
	}

	onCancel(): void {
		this.ref.close({ success: false });
	}
}
