import { Component, OnInit, Input, Output, EventEmitter, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	FormArray,
	Validators,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { finalize } from 'rxjs/operators';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import {
	EnumerationArea,
	SplitEaRequest,
} from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';

@Component({
	selector: 'app-ea-split-operation',
	templateUrl: './ea-split-operation.component.html',
	styleUrls: ['./ea-split-operation.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, PrimeNgModules, FormsModule],
	providers: [MessageService],
})
export class EaSplitOperationComponent implements OnInit {
	@Input() visible: boolean = false;
	@Input() asDialog: boolean = false;
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() onSuccess = new EventEmitter<void>();

	splitForm: FormGroup;
	activeEas: EnumerationArea[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];
	loading = false;
	loadingEas = false;
	loadingZones = false;
	submitting = false;
	selectedFiles: File[] = [];

	// Location hierarchy
	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	filteredSubAdministrativeZones: SubAdministrativeZone[] = [];
	
	// Selected location values
	selectedDzongkhag: Dzongkhag | null = null;
	selectedAdminZone: AdministrativeZone | null = null;
	selectedSubAdminZone: SubAdministrativeZone | null = null;
	
	// Loading states for location hierarchy
	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;
	
	// Source EA details
	selectedSourceEa: EnumerationArea | null = null;
	sourceEaSazIds: number[] = [];
	sourceEaSazs: SubAdministrativeZone[] = [];

	constructor(
		private fb: FormBuilder,
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private dzongkhagService: DzongkhagDataService,
		private adminZoneService: AdministrativeZoneDataService,
		private messageService: MessageService,
		public router: Router,
		@Optional() public ref: DynamicDialogRef,
		@Optional() public config: DynamicDialogConfig
	) {
		this.splitForm = this.fb.group({
			sourceEaId: [null, Validators.required],
			reason: [''],
			newEas: this.fb.array([], [this.arrayMinLengthValidator(2)]),
		});
	}

	ngOnInit() {
		// If opened via DynamicDialog, get asDialog from config
		if (this.config) {
			this.asDialog = this.config.data?.asDialog || true;
		}
		
		this.loadDzongkhags();
		this.loadSubAdministrativeZones();
		this.addNewEa(); // Add initial EA form
		this.addNewEa(); // Add second EA form (minimum 2 required)
	}

	get newEasFormArray(): FormArray {
		return this.splitForm.get('newEas') as FormArray;
	}

	getEaFormGroup(index: number): FormGroup {
		return this.newEasFormArray.at(index) as FormGroup;
	}

	loadDzongkhags() {
		this.loadingDzongkhags = true;
		this.dzongkhagService
			.findAllDzongkhags()
			.pipe(finalize(() => (this.loadingDzongkhags = false)))
			.subscribe({
				next: (data) => {
					this.dzongkhags = data;
				},
				error: (error) => {
					console.error('Error loading dzongkhags:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load dzongkhags',
						life: 3000,
					});
				},
			});
	}

	onDzongkhagChange() {
		// Reset dependent dropdowns
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.administrativeZones = [];
		this.filteredSubAdministrativeZones = [];
		this.activeEas = [];
		this.splitForm.get('sourceEaId')?.setValue(null);

		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones(this.selectedDzongkhag.id);
		}
	}

	loadAdministrativeZones(dzongkhagId: number) {
		this.loadingAdminZones = true;
		this.adminZoneService
			.findAdministrativeZonesByDzongkhag(dzongkhagId)
			.pipe(finalize(() => (this.loadingAdminZones = false)))
			.subscribe({
				next: (data) => {
					this.administrativeZones = data;
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load administrative zones',
						life: 3000,
					});
				},
			});
	}

	onAdminZoneChange() {
		// Reset dependent dropdowns
		this.selectedSubAdminZone = null;
		this.filteredSubAdministrativeZones = [];
		this.activeEas = [];
		this.splitForm.get('sourceEaId')?.setValue(null);

		if (this.selectedAdminZone) {
			this.loadSubAdministrativeZonesByAdminZone(this.selectedAdminZone.id);
		}
	}

	loadSubAdministrativeZonesByAdminZone(adminZoneId: number) {
		this.loadingSubAdminZones = true;
		this.subAdministrativeZoneService
			.findSubAdministrativeZonesByAdministrativeZone(adminZoneId)
			.pipe(finalize(() => (this.loadingSubAdminZones = false)))
			.subscribe({
				next: (data) => {
					this.filteredSubAdministrativeZones = data;
				},
				error: (error) => {
					console.error('Error loading sub-administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sub-administrative zones',
						life: 3000,
					});
				},
			});
	}

	onSubAdminZoneChange() {
		// Reset enumeration areas
		this.activeEas = [];
		this.splitForm.get('sourceEaId')?.setValue(null);

		if (this.selectedSubAdminZone) {
			this.loadEnumerationAreas(this.selectedSubAdminZone.id);
		}
	}

	loadEnumerationAreas(subAdminZoneId: number) {
		this.loadingEas = true;
		this.enumerationAreaService
			.findEnumerationAreasBySubAdministrativeZone(subAdminZoneId, false, true)
			.pipe(finalize(() => (this.loadingEas = false)))
			.subscribe({
			next: (eas) => {
				// Filter only active EAs (isActive defaults to true, so undefined/null means active)
				this.activeEas = eas.filter(ea => ea.isActive !== false);
			},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	onSourceEaChange() {
		const sourceEaId = this.splitForm.get('sourceEaId')?.value;
		if (!sourceEaId) {
			this.selectedSourceEa = null;
			this.sourceEaSazIds = [];
			this.sourceEaSazs = [];
			this.clearSazFromNewEas();
			return;
		}

		// Find the selected EA from the activeEas array
		this.selectedSourceEa = this.activeEas.find(ea => ea.id === sourceEaId) || null;
		
		if (this.selectedSourceEa && this.selectedSourceEa.subAdministrativeZones && this.selectedSourceEa.subAdministrativeZones.length > 0) {
			// Extract SAZ IDs and SAZ objects from the source EA
			this.sourceEaSazs = this.selectedSourceEa.subAdministrativeZones;
			this.sourceEaSazIds = this.selectedSourceEa.subAdministrativeZones.map(saz => saz.id);
			
			// Automatically set SAZ IDs for all new EA forms
			this.setSazForAllNewEas(this.sourceEaSazIds);
		} else {
			// If SAZs are not included in the loaded EA, fetch the EA with SAZs
			this.loadSourceEaWithSazs(sourceEaId);
		}
	}

	loadSourceEaWithSazs(eaId: number) {
		this.enumerationAreaService.findEnumerationAreaById(eaId, false, true).subscribe({
			next: (ea) => {
				this.selectedSourceEa = ea;
				if (ea && ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
					this.sourceEaSazs = ea.subAdministrativeZones;
					this.sourceEaSazIds = ea.subAdministrativeZones.map(saz => saz.id);
					this.setSazForAllNewEas(this.sourceEaSazIds);
				} else {
					this.messageService.add({
						severity: 'warn',
						summary: 'Warning',
						detail: 'Source enumeration area has no sub-administrative zones assigned',
						life: 3000,
					});
				}
			},
			error: (error) => {
				console.error('Error loading EA with SAZs:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load source enumeration area details',
					life: 3000,
				});
			}
		});
	}

	setSazForAllNewEas(sazIds: number[]) {
		// Set SAZ IDs for all existing new EA forms
		this.newEasFormArray.controls.forEach((control) => {
			control.get('subAdministrativeZoneIds')?.setValue(sazIds);
			control.get('subAdministrativeZoneIds')?.markAsTouched();
		});
	}

	clearSazFromNewEas() {
		// Clear SAZ IDs from all new EA forms
		this.newEasFormArray.controls.forEach((control) => {
			control.get('subAdministrativeZoneIds')?.setValue([]);
		});
		this.sourceEaSazs = [];
	}

	loadSubAdministrativeZones() {
		this.loadingZones = true;
		this.subAdministrativeZoneService.findAllSubAdministrativeZones().subscribe({
			next: (zones) => {
				this.subAdministrativeZones = zones;
				this.loadingZones = false;
			},
			error: (error) => {
				console.error('Error loading sub-administrative zones:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load sub-administrative zones',
					life: 3000,
				});
				this.loadingZones = false;
			},
		});
	}

	addNewEa() {
		const eaForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
			description: ['', [Validators.required, Validators.minLength(5)]],
			subAdministrativeZoneIds: [[], [Validators.required, this.arrayMinLengthValidator(1)]],
			geojsonFile: [null, Validators.required],
		});
		this.newEasFormArray.push(eaForm);
		
		// If source EA SAZ IDs are already set, apply them to this new EA form
		if (this.sourceEaSazIds && this.sourceEaSazIds.length > 0) {
			const newFormIndex = this.newEasFormArray.length - 1;
			this.newEasFormArray.at(newFormIndex).get('subAdministrativeZoneIds')?.setValue(this.sourceEaSazIds);
		}
	}

	removeEa(index: number) {
		if (this.newEasFormArray.length > 2) {
			// Remove the form control
			this.newEasFormArray.removeAt(index);
			// Remove the corresponding file from the array
			if (this.selectedFiles[index]) {
				this.selectedFiles.splice(index, 1);
			}
		} else {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'At least 2 new enumeration areas are required for a split operation',
				life: 3000,
			});
		}
	}

	onFileSelect(event: any, index: number) {
		const file = event.files?.[0];
		if (file) {
			// Validate file type
			if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Please select a valid GeoJSON file',
					life: 3000,
				});
				return;
			}
			// Validate file size (50MB limit)
			if (file.size > 50 * 1024 * 1024) {
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'File size must be less than 50MB',
					life: 3000,
				});
				return;
			}
			this.selectedFiles[index] = file;
			const control = this.newEasFormArray.at(index).get('geojsonFile');
			control?.setValue(file);
			control?.markAsTouched();
		}
	}

	arrayMinLengthValidator(minLength: number) {
		return (control: any) => {
			if (!control.value || !Array.isArray(control.value) || control.value.length < minLength) {
				return {
					arrayMinLength: {
						requiredLength: minLength,
						actualLength: control.value?.length || 0,
					},
				};
			}
			return null;
		};
	}

	onSubmit() {
		if (this.splitForm.invalid) {
			this.markFormGroupTouched();
			return;
		}

		// Validate that all files are selected
		const missingFiles: number[] = [];
		for (let i = 0; i < this.newEasFormArray.length; i++) {
			if (!this.selectedFiles[i]) {
				missingFiles.push(i + 1);
			}
		}

		if (missingFiles.length > 0) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: `Please select GeoJSON files for all new enumeration areas. Missing files for EA(s): ${missingFiles.join(', ')}`,
				life: 5000,
			});
			return;
		}

		this.submitting = true;
		const formValue = this.splitForm.value;
		const sourceEaId = formValue.sourceEaId;

		// Prepare EA data without geometry (geometry comes from files)
		const eaData: SplitEaRequest = {
			newEas: this.newEasFormArray.controls.map((control, index) => ({
				name: control.get('name')?.value,
				areaCode: control.get('areaCode')?.value,
				description: control.get('description')?.value,
				subAdministrativeZoneIds: control.get('subAdministrativeZoneIds')?.value || [],
			})),
			reason: formValue.reason || undefined,
		};

		// Create FormData
		const formData = new FormData();
		formData.append('eaData', JSON.stringify(eaData));

		// Append GeoJSON files in the same order as newEas array
		this.selectedFiles.forEach((file) => {
			formData.append('files', file);
		});

		if (formValue.reason) {
			formData.append('reason', formValue.reason);
		}

		this.enumerationAreaService.splitEnumerationArea(sourceEaId, formData).subscribe({
			next: (result) => {
				this.submitting = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: `Successfully split enumeration area into ${result.length} new areas`,
					life: 5000,
				});
				this.resetForm();
				
				// If in dialog mode, emit success and close dialog
				if (this.asDialog) {
					if (this.ref) {
						// Close dynamic dialog and return result
						this.ref.close(result);
					} else {
						// Use @Output pattern
						this.onSuccess.emit();
						this.closeDialog();
					}
				} else {
					// Navigate to master enumeration areas page (for non-dialog mode)
				setTimeout(() => {
					this.router.navigate(['/admin/master/enumeration-areas']);
				}, 2000);
				}
			},
			error: (error) => {
				this.submitting = false;
				console.error('Error splitting enumeration area:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error.error?.message || 'Failed to split enumeration area',
					life: 5000,
				});
			},
		});
	}

	resetForm() {
		this.splitForm.reset();
		this.selectedFiles = [];
		// Clear form array and add 2 default forms
		while (this.newEasFormArray.length !== 0) {
			this.newEasFormArray.removeAt(0);
		}
		this.addNewEa();
		this.addNewEa();
	}

	private markFormGroupTouched() {
		Object.keys(this.splitForm.controls).forEach((key) => {
			const control = this.splitForm.get(key);
			control?.markAsTouched();
		});
		this.newEasFormArray.controls.forEach((control) => {
			if (control instanceof FormGroup) {
				Object.keys(control.controls).forEach((key) => {
					control.get(key)?.markAsTouched();
				});
			}
		});
	}

	hasFormError(field: string): boolean {
		const control = this.splitForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	hasEaFormError(index: number, field: string): boolean {
		const control = this.newEasFormArray.at(index).get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.splitForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
		}
		return '';
	}

	getEaFormError(index: number, field: string): string {
		const control = this.newEasFormArray.at(index).get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['minlength']) return `${field} is too short`;
			if (control.errors['pattern']) return `${field} format is invalid`;
			if (control.errors['arrayMinLength']) {
				return 'At least one Sub-Administrative Zone is required';
			}
		}
		return '';
	}

	get formValid(): boolean {
		return this.splitForm.valid && this.selectedFiles.length === this.newEasFormArray.length;
	}

	closeDialog() {
		if (this.ref) {
			// Close dynamic dialog
			this.ref.close();
		} else {
			// Use @Output pattern
			this.visible = false;
			this.visibleChange.emit(false);
		}
	}
}

