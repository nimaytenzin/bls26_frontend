import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { CreateEnumerationAreaDto } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

/**
 * Add Enumeration Area Component
 *
 * This component provides a form for adding new enumeration areas.
 * It can be used as a standalone dialog or embedded within other components.
 *
 * Features:
 * - Form validation with error messages
 * - Sub-administrative zone selection
 * - Context-aware zone filtering (when subAdminZoneId is provided)
 * - Success/error handling with toast messages
 * - Flexible usage as dialog or embedded component
 */
@Component({
	selector: 'app-add-enumeration-area',
	templateUrl: './add-enumeration-area.component.html',
	styleUrls: ['./add-enumeration-area.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AddEnumerationAreaComponent implements OnInit {
	// Input properties
	@Input() visible: boolean = false;
	@Input() subAdminZoneId: number | null = null; // Pre-select specific sub-admin zone
	@Input() asDialog: boolean = true; // Use as dialog or embedded component
	@Input() dialogHeader: string = 'Add New Enumeration Area';

	// Output events
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() onSuccess = new EventEmitter<any>();
	@Output() onCancel = new EventEmitter<void>();

	// Form and data
	enumerationAreaForm: FormGroup;
	subAdministrativeZones: SubAdministrativeZone[] = [];
	loading = false;
	loadingZones = false;
	saving = false;

	constructor(
		private fb: FormBuilder,
		private enumerationAreaService: EnumerationAreaDataService,
		private subAdministrativeZoneService: SubAdministrativeZoneDataService,
		private messageService: MessageService
	) {
		this.enumerationAreaForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			description: ['', [Validators.required, Validators.minLength(5)]],
			areaCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
			subAdministrativeZoneIds: [[], [Validators.required, this.arrayMinLengthValidator(1)]],
		});
	}

	ngOnInit() {
		this.loadSubAdministrativeZones();

		// Pre-select sub-admin zone if provided
		if (this.subAdminZoneId) {
			this.enumerationAreaForm.patchValue({
				subAdministrativeZoneIds: [this.subAdminZoneId],
			});
		}
	}

	// Custom validator for array minimum length
	private arrayMinLengthValidator(minLength: number) {
		return (control: any) => {
			if (!control.value || !Array.isArray(control.value) || control.value.length < minLength) {
				return { arrayMinLength: { requiredLength: minLength, actualLength: control.value?.length || 0 } };
			}
			return null;
		};
	}

	loadSubAdministrativeZones() {
		this.loadingZones = true;
		this.subAdministrativeZoneService
			.findAllSubAdministrativeZones()
			.subscribe({
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

	onSubmit() {
		if (this.enumerationAreaForm.invalid) {
			this.markFormGroupTouched();
			return;
		}

		this.saving = true;
		const formValue = this.enumerationAreaForm.value;
		
		// Ensure subAdministrativeZoneIds is an array
		if (!Array.isArray(formValue.subAdministrativeZoneIds)) {
			formValue.subAdministrativeZoneIds = formValue.subAdministrativeZoneIds 
				? [formValue.subAdministrativeZoneIds] 
				: [];
		}
		
		const formData: CreateEnumerationAreaDto = {
			name: formValue.name,
			description: formValue.description,
			areaCode: formValue.areaCode,
			subAdministrativeZoneIds: formValue.subAdministrativeZoneIds,
		};

		this.enumerationAreaService.createEnumerationArea(formData).subscribe({
			next: (result) => {
				this.saving = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Enumeration area created successfully',
					life: 3000,
				});

				this.onSuccess.emit(result);
				this.resetForm();

				if (this.asDialog) {
					this.hideDialog();
				}
			},
			error: (error) => {
				this.saving = false;
				console.error('Error creating enumeration area:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error.error?.message || 'Failed to create enumeration area',
					life: 5000,
				});
			},
		});
	}

	onCancel_() {
		this.resetForm();
		this.onCancel.emit();

		if (this.asDialog) {
			this.hideDialog();
		}
	}

	hideDialog() {
		this.visible = false;
		this.visibleChange.emit(false);
	}

	resetForm() {
		this.enumerationAreaForm.reset();

		// Re-apply sub-admin zone selection if provided
		if (this.subAdminZoneId) {
			this.enumerationAreaForm.patchValue({
				subAdministrativeZoneIds: [this.subAdminZoneId],
			});
		}
	}

	private markFormGroupTouched() {
		Object.keys(this.enumerationAreaForm.controls).forEach((key) => {
			const control = this.enumerationAreaForm.get(key);
			control?.markAsTouched();
		});
	}

	// Form validation helpers
	hasFormError(field: string): boolean {
		const control = this.enumerationAreaForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.enumerationAreaForm.get(field);
		if (control?.errors) {
			if (control.errors['required'])
				return `${this.getFieldDisplayName(field)} is required`;
			if (control.errors['minlength'])
				return `${this.getFieldDisplayName(field)} is too short`;
			if (control.errors['pattern'])
				return `${this.getFieldDisplayName(
					field
				)} format is invalid (use uppercase letters and numbers only)`;
			if (control.errors['arrayMinLength']) {
				return `At least one Sub-Administrative Zone is required`;
			}
		}
		return '';
	}

	private getFieldDisplayName(field: string): string {
		const displayNames: { [key: string]: string } = {
			name: 'Area Name',
			description: 'Description',
			areaCode: 'EA Code',
			subAdministrativeZoneIds: 'Sub-Administrative Zone(s)',
		};
		return displayNames[field] || field;
	}

	// Computed properties
	get formValid(): boolean {
		return this.enumerationAreaForm.valid;
	}

	get hasSelectedZone(): boolean {
		const value = this.enumerationAreaForm.get('subAdministrativeZoneIds')?.value;
		return Array.isArray(value) && value.length > 0;
	}

	getSubAdministrativeZoneName(id: number): string {
		const zone = this.subAdministrativeZones.find((z) => z.id === id);
		return zone ? `${zone.name} (${zone.type})` : 'Unknown Zone';
	}
}
