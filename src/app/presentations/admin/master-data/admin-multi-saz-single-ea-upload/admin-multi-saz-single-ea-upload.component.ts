import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { EnumerationAreaDataService } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { CreateMultipleSazsWithEaResponse, SazData, EaData } from '../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { AdministrativeZone } from '../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { DzongkhagDataService } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { Dzongkhag } from '../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';

interface SazListItem {
	name: string;
	areaCode: string;
	type: 'chiwog' | 'lap';
	file: File | null;
	administrativeZoneId: number;
}

@Component({
	selector: 'app-admin-multi-saz-single-ea-upload',
	templateUrl: './admin-multi-saz-single-ea-upload.component.html',
	styleUrls: ['./admin-multi-saz-single-ea-upload.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminMultiSazSingleEaUploadComponent implements OnInit {
	// Form groups
	uploadForm: FormGroup;
	sazDialogForm: FormGroup;

	// SAZ management
	sazList: SazListItem[] = [];
	minSazs = 2;
	maxSazs = 20;
	showAddSazDialog = false;
	editingSazIndex: number | null = null;

	// EA data
	eaForm: FormGroup;

	// Upload state
	uploadResponse: CreateMultipleSazsWithEaResponse | null = null;
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
		// Main form for EA data
		this.eaForm = this.fb.group({
			eaName: ['', Validators.required],
			eaAreaCode: ['', Validators.required],
			eaDescription: [''],
		});

		// Form for location selection
		this.uploadForm = this.fb.group({
			administrativeZoneId: ['', [Validators.required]],
		});

		// Form for SAZ dialog
		this.sazDialogForm = this.fb.group({
			name: ['', Validators.required],
			areaCode: ['', Validators.required],
			type: ['chiwog', Validators.required],
			file: [null, Validators.required],
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

	openAddSazDialog(): void {
		if (this.sazList.length >= this.maxSazs) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Maximum Reached',
				detail: `Maximum ${this.maxSazs} SAZs allowed`,
				life: 3000,
			});
			return;
		}

		if (!this.selectedAdministrativeZone) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select an Administrative Zone first',
				life: 3000,
			});
			return;
		}

		this.editingSazIndex = null;
		this.sazDialogForm.reset();
		this.sazDialogForm.patchValue({ type: 'chiwog' });
		this.showAddSazDialog = true;
	}

	openEditSazDialog(index: number): void {
		const saz = this.sazList[index];
		this.editingSazIndex = index;
		this.sazDialogForm.patchValue({
			name: saz.name,
			areaCode: saz.areaCode,
			type: saz.type,
			file: saz.file,
		});
		this.showAddSazDialog = true;
	}

	closeSazDialog(): void {
		this.showAddSazDialog = false;
		this.editingSazIndex = null;
		this.sazDialogForm.reset();
		this.sazDialogForm.patchValue({ type: 'chiwog' });
	}

	onSazFileSelected(event: any): void {
		if (event.files && event.files.length > 0) {
			const file = event.files[0];
			if (this.validateFile(file)) {
				this.sazDialogForm.patchValue({ file });
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

	saveSaz(): void {
		if (this.sazDialogForm.invalid) {
			this.markFormGroupTouched(this.sazDialogForm);
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please fill all required fields',
				life: 3000,
			});
			return;
		}

		if (!this.selectedAdministrativeZone) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please select an Administrative Zone first',
				life: 3000,
			});
			return;
		}

		const formValue = this.sazDialogForm.value;
		const sazItem: SazListItem = {
			name: formValue.name,
			areaCode: formValue.areaCode,
			type: formValue.type,
			file: formValue.file,
			administrativeZoneId: this.selectedAdministrativeZone.id,
		};

		if (this.editingSazIndex !== null) {
			// Update existing SAZ
			this.sazList[this.editingSazIndex] = sazItem;
		} else {
			// Add new SAZ
			this.sazList.push(sazItem);
		}

		this.closeSazDialog();
	}

	removeSaz(index: number): void {
		if (this.sazList.length <= this.minSazs) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Minimum Required',
				detail: `At least ${this.minSazs} SAZs are required`,
				life: 3000,
			});
			return;
		}

		this.sazList.splice(index, 1);
	}

	validateSazList(): boolean {
		if (this.sazList.length < this.minSazs) {
			this.error = `At least ${this.minSazs} SAZs are required`;
			return false;
		}

		if (this.sazList.length > this.maxSazs) {
			this.error = `Maximum ${this.maxSazs} SAZs allowed`;
			return false;
		}

		// Check all SAZs have files
		const missingFiles = this.sazList.some((saz) => !saz.file);
		if (missingFiles) {
			this.error = 'All SAZs must have a GeoJSON file selected';
			return false;
		}

		// Check all SAZs have same administrativeZoneId
		const firstAdminZoneId = this.sazList[0]?.administrativeZoneId;
		const allSameAdminZone = this.sazList.every(
			(saz) => saz.administrativeZoneId === firstAdminZoneId
		);
		if (!allSameAdminZone) {
			this.error = 'All SAZs must belong to the same Administrative Zone';
			return false;
		}

		return true;
	}

	onSubmit(): void {
		// Validate EA form
		if (this.eaForm.invalid) {
			this.markFormGroupTouched(this.eaForm);
			this.error = 'Please fill all required EA fields';
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: this.error,
				life: 3000,
			});
			return;
		}

		// Validate location selection
		if (this.uploadForm.invalid) {
			this.markFormGroupTouched(this.uploadForm);
			this.error = 'Please select an Administrative Zone';
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: this.error,
				life: 3000,
			});
			return;
		}

		// Validate SAZ list
		if (!this.validateSazList()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: this.error,
				life: 3000,
			});
			return;
		}

		// Prepare SAZ data array
		const sazDataArray: SazData[] = this.sazList.map((saz) => ({
			name: saz.name,
			areaCode: saz.areaCode,
			type: saz.type,
			administrativeZoneId: saz.administrativeZoneId,
		}));

		// Prepare EA data
		const eaFormValue = this.eaForm.value;
		const eaData: EaData = {
			name: eaFormValue.eaName,
			areaCode: eaFormValue.eaAreaCode,
			description: eaFormValue.eaDescription || undefined,
		};

		// Prepare files array (order must match sazDataArray)
		const files: File[] = this.sazList.map((saz) => saz.file!).filter((file) => file !== null);

		this.uploading = true;
		this.error = undefined;
		this.uploadResponse = null;

		this.enumerationAreaService
			.createMultipleSazsWithEa(files, sazDataArray, eaData)
			.subscribe({
				next: (response) => {
					this.uploadResponse = response;
					this.uploading = false;
					this.resetForm();

					const sazNames = response.subAdministrativeZones.map((saz) => saz.name).join(', ');
					this.messageService.add({
						severity: 'success',
						summary: 'Upload Successful',
						detail: `Created ${response.subAdministrativeZones.length} SAZ(s) and EA "${response.enumerationArea.name}" successfully.`,
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
		this.eaForm.reset();
		this.uploadForm.reset();
		this.sazList = [];
		this.selectedDzongkhag = null;
		this.selectedAdministrativeZone = null;
		this.administrativeZones = [];
		this.uploadResponse = null;
		this.error = undefined;
	}

	getFileSize(file: File | null): string {
		if (!file) return '0 MB';
		return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
	}

	// Getters for EA form controls
	get eaNameControl(): FormControl {
		return this.eaForm.get('eaName') as FormControl;
	}

	get eaAreaCodeControl(): FormControl {
		return this.eaForm.get('eaAreaCode') as FormControl;
	}

	get eaDescriptionControl(): FormControl {
		return this.eaForm.get('eaDescription') as FormControl;
	}
}
