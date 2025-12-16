import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { CreateTwoSazsWithEaResponse } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';

@Component({
	selector: 'app-admin-two-sazs-ea-upload',
	templateUrl: './admin-two-sazs-ea-upload.component.html',
	styleUrls: ['./admin-two-sazs-ea-upload.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminTwoSazsEaUploadComponent implements OnInit {
	uploadForm: FormGroup;
	saz1File: File | null = null;
	saz2File: File | null = null;
	uploadResponse: CreateTwoSazsWithEaResponse | null = null;
	error: string | undefined = undefined;
	uploading = false;

	// Location selection
	dzongkhags: Dzongkhag[] = [];
	selectedDzongkhag: Dzongkhag | null = null;
	administrativeZones: AdministrativeZone[] = [];
	selectedAdministrativeZone: AdministrativeZone | null = null;
	loadingDzongkhags = false;
	loadingAdminZones = false;

	constructor(
		private fb: FormBuilder,
		private enumerationAreaService: EnumerationAreaDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService
	) {
		this.uploadForm = this.fb.group({
			// Common field
			administrativeZoneId: ['', [Validators.required]],
			
			// SAZ1 fields
			saz1Name: ['', Validators.required],
			saz1AreaCode: ['', Validators.required],
			saz1Type: ['chiwog', Validators.required],
			
			// SAZ2 fields
			saz2Name: ['', Validators.required],
			saz2AreaCode: ['', Validators.required],
			saz2Type: ['chiwog', Validators.required],
		});
	}

	ngOnInit(): void {
		this.loadDzongkhags();
	}

	loadDzongkhags(): void {
		this.loadingDzongkhags = true;
		this.dzongkhagService.findAllDzongkhags().subscribe({
			next: (data) => {
				this.dzongkhags = data;
				this.loadingDzongkhags = false;
			},
			error: (error) => {
				console.error('Error loading dzongkhags:', error);
				this.loadingDzongkhags = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load dzongkhags',
					life: 3000,
				});
			},
		});
	}

	onDzongkhagChange(): void {
		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones();
		} else {
			this.administrativeZones = [];
			this.selectedAdministrativeZone = null;
			this.uploadForm.patchValue({ administrativeZoneId: '' });
		}
	}

	loadAdministrativeZones(): void {
		if (!this.selectedDzongkhag) return;

		this.loadingAdminZones = true;
		this.dzongkhagService
			.getAdministrativeZonesByDzongkhag(this.selectedDzongkhag.id, false, false, false)
			.subscribe({
				next: (data) => {
					this.administrativeZones = data;
					this.loadingAdminZones = false;
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.loadingAdminZones = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load administrative zones',
						life: 3000,
					});
				},
			});
	}

	onAdministrativeZoneChange(): void {
		if (this.selectedAdministrativeZone) {
			this.uploadForm.patchValue({
				administrativeZoneId: this.selectedAdministrativeZone.id,
			});
		} else {
			this.uploadForm.patchValue({ administrativeZoneId: '' });
		}
	}

	onSaz1FileSelected(event: any): void {
		if (event.files && event.files.length > 0) {
			const file = event.files[0];
			if (this.validateFile(file)) {
				this.saz1File = file;
			}
		}
	}

	onSaz2FileSelected(event: any): void {
		if (event.files && event.files.length > 0) {
			const file = event.files[0];
			if (this.validateFile(file)) {
				this.saz2File = file;
			}
		}
	}

	validateFile(file: File): boolean {
		// Validate file type
		const validTypes = ['application/json', 'application/geo+json'];
		const validExtensions = ['.json', '.geojson'];
		const fileExtension = file.name
			.toLowerCase()
			.substring(file.name.lastIndexOf('.'));

		if (
			!validTypes.includes(file.type) &&
			!validExtensions.includes(fileExtension)
		) {
			this.error = 'Invalid file type. Only JSON or GeoJSON files are allowed.';
			this.messageService.add({
				severity: 'error',
				summary: 'Invalid File',
				detail: this.error,
				life: 3000,
			});
			return false;
		}

		// Check file size (50MB limit)
		const maxSize = 50 * 1024 * 1024; // 50MB in bytes
		if (file.size > maxSize) {
			this.error = 'File size exceeds 50MB limit.';
			this.messageService.add({
				severity: 'error',
				summary: 'File Too Large',
				detail: this.error,
				life: 3000,
			});
			return false;
		}

		this.error = undefined;
		return true;
	}

	onSubmit(): void {
		if (this.uploadForm.invalid) {
			this.markFormGroupTouched(this.uploadForm);
			this.error = 'Please fill all required fields.';
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: this.error,
				life: 3000,
			});
			return;
		}

		if (!this.saz1File || !this.saz2File) {
			this.error = 'Please select both GeoJSON files.';
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: this.error,
				life: 3000,
			});
			return;
		}

		// Validate that both SAZs have the same administrativeZoneId
		const formValue = this.uploadForm.value;
		const administrativeZoneId = parseInt(formValue.administrativeZoneId, 10);

		const saz1Data = {
			name: formValue.saz1Name,
			areaCode: formValue.saz1AreaCode,
			type: formValue.saz1Type,
			administrativeZoneId: administrativeZoneId,
		};

		const saz2Data = {
			name: formValue.saz2Name,
			areaCode: formValue.saz2AreaCode,
			type: formValue.saz2Type,
			administrativeZoneId: administrativeZoneId,
		};

		this.uploading = true;
		this.error = undefined;
		this.uploadResponse = null;

		this.enumerationAreaService
			.createTwoSazsWithEa(this.saz1File, this.saz2File, saz1Data, saz2Data)
			.subscribe({
				next: (response) => {
					this.uploadResponse = response;
					this.uploading = false;
					this.uploadForm.reset();
					this.uploadForm.patchValue({ 
						saz1Type: 'chiwog',
						saz2Type: 'chiwog'
					});
					this.saz1File = null;
					this.saz2File = null;
					this.selectedDzongkhag = null;
					this.selectedAdministrativeZone = null;
					this.administrativeZones = [];

					this.messageService.add({
						severity: 'success',
						summary: 'Upload Successful',
						detail: `SAZ1 "${response.subAdministrativeZone1.name}", SAZ2 "${response.subAdministrativeZone2.name}", and EA "${response.enumerationArea.name}" created successfully.`,
						life: 5000,
					});

					console.log('Upload successful:', response);
				},
				error: (err) => {
					this.uploading = false;
					this.error = err.error?.message || 'Upload failed. Please try again.';
					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail: this.error,
						life: 5000,
					});
					console.error('Upload error:', err);
				},
			});
	}

	private markFormGroupTouched(formGroup: FormGroup): void {
		Object.keys(formGroup.controls).forEach((key) => {
			const control = formGroup.get(key);
			control?.markAsTouched();
			if (control instanceof FormGroup) {
				this.markFormGroupTouched(control);
			}
		});
	}

	resetForm(): void {
		this.uploadForm.reset();
		this.uploadForm.patchValue({ 
			saz1Type: 'chiwog',
			saz2Type: 'chiwog'
		});
		this.saz1File = null;
		this.saz2File = null;
		this.selectedDzongkhag = null;
		this.selectedAdministrativeZone = null;
		this.administrativeZones = [];
		this.uploadResponse = null;
		this.error = undefined;
	}
}

