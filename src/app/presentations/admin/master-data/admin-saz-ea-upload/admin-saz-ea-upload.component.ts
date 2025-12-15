import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { SubAdministrativeZoneDataService } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { SazEaUploadDto, SazEaUploadResponse } from '../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';

@Component({
	selector: 'app-admin-saz-ea-upload',
	templateUrl: './admin-saz-ea-upload.component.html',
	styleUrls: ['./admin-saz-ea-upload.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSazEaUploadComponent implements OnInit {
	uploadForm: FormGroup;
	selectedFile: File | null = null;
	uploadResponse: SazEaUploadResponse | null = null;
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
		private sazService: SubAdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private messageService: MessageService
	) {
		this.uploadForm = this.fb.group({
			administrativeZoneId: ['', [Validators.required]],
			name: ['', Validators.required],
			areaCode: ['', Validators.required],
			type: ['chiwog', Validators.required],
			areaSqKm: ['', [Validators.required, Validators.min(0)]],
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

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			this.selectedFile = input.files[0];

			// Validate file type
			const validTypes = ['application/json', 'application/geo+json'];
			const validExtensions = ['.json', '.geojson'];
			const fileExtension = this.selectedFile.name
				.toLowerCase()
				.substring(this.selectedFile.name.lastIndexOf('.'));

			if (
				!validTypes.includes(this.selectedFile.type) &&
				!validExtensions.includes(fileExtension)
			) {
				this.error = 'Invalid file type. Only JSON or GeoJSON files are allowed.';
				this.selectedFile = null;
				this.messageService.add({
					severity: 'error',
					summary: 'Invalid File',
					detail: this.error,
					life: 3000,
				});
				return;
			}

			// Check file size (50MB limit)
			const maxSize = 50 * 1024 * 1024; // 50MB in bytes
			if (this.selectedFile.size > maxSize) {
				this.error = 'File size exceeds 50MB limit.';
				this.selectedFile = null;
				this.messageService.add({
					severity: 'error',
					summary: 'File Too Large',
					detail: this.error,
					life: 3000,
				});
				return;
			}

			this.error = undefined;
		}
	}

		onSubmit(): void {
		if (this.uploadForm.invalid || !this.selectedFile) {
			this.error = 'Please fill all required fields and select a GeoJSON file.';
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: this.error,
				life: 3000,
			});
			return;
		}

		this.uploading = true;
		this.error = undefined;
		this.uploadResponse = null;

		const uploadData: SazEaUploadDto = {
			...this.uploadForm.value,
			administrativeZoneId: parseInt(this.uploadForm.value.administrativeZoneId, 10),
			areaSqKm: parseFloat(this.uploadForm.value.areaSqKm),
			file: this.selectedFile,
		};

		this.sazService.uploadSazWithEa(uploadData).subscribe({
			next: (response) => {
				this.uploadResponse = response;
				this.uploading = false;
				this.uploadForm.reset();
				this.uploadForm.patchValue({ type: 'chiwog' });
				this.selectedFile = null;
				this.selectedDzongkhag = null;
				this.selectedAdministrativeZone = null;
				this.administrativeZones = [];

				this.messageService.add({
					severity: 'success',
					summary: 'Upload Successful',
					detail: `SAZ "${response.subAdministrativeZone.name}" and EA "${response.enumerationArea.name}" created successfully.`,
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
}

