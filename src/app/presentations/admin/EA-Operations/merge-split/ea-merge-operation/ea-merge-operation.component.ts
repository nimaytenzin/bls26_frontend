import { Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
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
	MergeEaRequest,
} from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';

@Component({
	selector: 'app-ea-merge-operation',
	templateUrl: './ea-merge-operation.component.html',
	styleUrls: ['./ea-merge-operation.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, PrimeNgModules, FormsModule],
	providers: [MessageService],
})
export class EaMergeOperationComponent implements OnInit {
	asDialog: boolean = false;
	mergeForm: FormGroup;
	activeEas: EnumerationArea[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];
	loading = false;
	loadingEas = false;
	loadingZones = false;
	submitting = false;
	selectedFile: File | null = null;

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
		this.mergeForm = this.fb.group({
			sourceEaIds: [[], [Validators.required, this.arrayMinLengthValidator(2)]],
			mergedEa: this.fb.group({
				name: ['', [Validators.required, Validators.minLength(2)]],
				areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
				description: ['', [Validators.required, Validators.minLength(5)]],
				subAdministrativeZoneIds: [[], [Validators.required, this.arrayMinLengthValidator(1)]],
				geojsonFile: [null, Validators.required],
			}),
			reason: [''],
		});
	}

	ngOnInit() {
		// If opened via DynamicDialog, get asDialog from config
		if (this.config) {
			this.asDialog = this.config.data?.asDialog || true;
		}
		
		this.loadDzongkhags();
		this.loadSubAdministrativeZones();
	}

	get mergedEaFormGroup(): FormGroup {
		return this.mergeForm.get('mergedEa') as FormGroup;
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
		// Clear merged EA form sub-admin zone selection
		this.mergedEaFormGroup.get('subAdministrativeZoneIds')?.setValue([]);

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
		// Clear merged EA form sub-admin zone selection
		this.mergedEaFormGroup.get('subAdministrativeZoneIds')?.setValue([]);

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
		this.mergeForm.get('sourceEaIds')?.setValue([]);

		if (this.selectedSubAdminZone) {
			this.loadEnumerationAreas(this.selectedSubAdminZone.id);
			// Automatically set the selected sub-admin zone in the merged EA form
			this.mergedEaFormGroup.get('subAdministrativeZoneIds')?.setValue([this.selectedSubAdminZone.id]);
		} else {
			// Clear the selection if sub-admin zone is cleared
			this.mergedEaFormGroup.get('subAdministrativeZoneIds')?.setValue([]);
		}
	}

	loadEnumerationAreas(subAdminZoneId: number) {
		this.loadingEas = true;
		this.enumerationAreaService
			.findEnumerationAreasBySubAdministrativeZone(subAdminZoneId, false, false)
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

	onFileSelect(event: any) {
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
			this.selectedFile = file;
			const control = this.mergedEaFormGroup.get('geojsonFile');
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
		if (this.mergeForm.invalid) {
			this.markFormGroupTouched();
			return;
		}

		// Validate that file is selected
		if (!this.selectedFile) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Please select a GeoJSON file for the merged enumeration area',
				life: 3000,
			});
			return;
		}

		this.submitting = true;
		const formValue = this.mergeForm.value;
		const mergedEaValue = formValue.mergedEa;

		// Prepare merge data without geometry (geometry comes from file)
		const mergeData: MergeEaRequest = {
			sourceEaIds: formValue.sourceEaIds,
			mergedEa: {
				name: mergedEaValue.name,
				areaCode: mergedEaValue.areaCode,
				description: mergedEaValue.description,
				subAdministrativeZoneIds: mergedEaValue.subAdministrativeZoneIds || [],
			},
			reason: formValue.reason || undefined,
		};

		// Create FormData
		const formData = new FormData();
		formData.append('mergeData', JSON.stringify(mergeData));
		formData.append('file', this.selectedFile);

		if (formValue.reason) {
			formData.append('reason', formValue.reason);
		}

		this.enumerationAreaService.mergeEnumerationAreas(formData).subscribe({
			next: (result) => {
				this.submitting = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Successfully merged enumeration areas',
					life: 5000,
				});
				this.resetForm();
				
				if (this.asDialog) {
					if (this.ref) {
						// Close dynamic dialog and return result
						this.ref.close(result);
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
				console.error('Error merging enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error.error?.message || 'Failed to merge enumeration areas',
					life: 5000,
				});
			},
		});
	}

	resetForm() {
		this.mergeForm.reset();
		this.selectedFile = null;
	}

	private markFormGroupTouched() {
		Object.keys(this.mergeForm.controls).forEach((key) => {
			const control = this.mergeForm.get(key);
			control?.markAsTouched();
		});
		Object.keys(this.mergedEaFormGroup.controls).forEach((key) => {
			const control = this.mergedEaFormGroup.get(key);
			control?.markAsTouched();
		});
	}

	hasFormError(field: string): boolean {
		const control = this.mergeForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	hasMergedEaFormError(field: string): boolean {
		const control = this.mergedEaFormGroup.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.mergeForm.get(field);
		if (control?.errors) {
			if (control.errors['required']) return `${field} is required`;
			if (control.errors['arrayMinLength']) {
				return 'At least 2 enumeration areas are required for a merge operation';
			}
		}
		return '';
	}

	getMergedEaFormError(field: string): string {
		const control = this.mergedEaFormGroup.get(field);
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
		return this.mergeForm.valid && !!this.selectedFile;
	}
}

