import {
	Component,
	Input,
	Output,
	EventEmitter,
	OnInit,
	OnChanges,
	SimpleChanges,
} from '@angular/core';
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
import {
	EnumerationArea,
	UpdateEnumerationAreaDto,
} from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';

/**
 * Edit Enumeration Area Component
 *
 * This component provides a form for editing existing enumeration areas.
 * It can be used as a standalone dialog or embedded within other components.
 *
 * Features:
 * - Pre-populated form with current enumeration area data
 * - Form validation with error messages
 * - Sub-administrative zone selection
 * - Success/error handling with toast messages
 * - Flexible usage as dialog or embedded component
 */
@Component({
	selector: 'app-edit-enumeration-area',
	templateUrl: './edit-enumeration-area.component.html',
	styleUrls: ['./edit-enumeration-area.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class EditEnumerationAreaComponent implements OnInit, OnChanges {
	// Input properties
	@Input() visible: boolean = false;
	@Input() enumerationArea: EnumerationArea | null = null;
	@Input() asDialog: boolean = true; // Use as dialog or embedded component
	@Input() dialogHeader: string = 'Edit Enumeration Area';

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
			subAdministrativeZoneId: ['', [Validators.required]],
		});
	}

	ngOnInit() {
		this.loadSubAdministrativeZones();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['enumerationArea'] && this.enumerationArea) {
			this.populateForm();
		}
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

	populateForm() {
		if (this.enumerationArea) {
			this.enumerationAreaForm.patchValue({
				name: this.enumerationArea.name,
				description: this.enumerationArea.description,
				areaCode: this.enumerationArea.areaCode,
				subAdministrativeZoneId: this.enumerationArea.subAdministrativeZoneId,
			});
		}
	}

	onSubmit() {
		if (this.enumerationAreaForm.invalid || !this.enumerationArea) {
			this.markFormGroupTouched();
			return;
		}

		this.saving = true;
		const formData: UpdateEnumerationAreaDto = this.enumerationAreaForm.value;

		this.enumerationAreaService
			.updateEnumerationArea(this.enumerationArea.id, formData)
			.subscribe({
				next: (result) => {
					this.saving = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Enumeration area updated successfully',
						life: 3000,
					});

					this.onSuccess.emit(result);

					if (this.asDialog) {
						this.hideDialog();
					}
				},
				error: (error) => {
					this.saving = false;
					console.error('Error updating enumeration area:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to update enumeration area',
						life: 5000,
					});
				},
			});
	}

	onCancel_() {
		this.onCancel.emit();

		if (this.asDialog) {
			this.hideDialog();
		}
	}

	hideDialog() {
		this.visible = false;
		this.visibleChange.emit(false);
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
		}
		return '';
	}

	private getFieldDisplayName(field: string): string {
		const displayNames: { [key: string]: string } = {
			name: 'Area Name',
			description: 'Description',
			areaCode: 'Area Code',
			subAdministrativeZoneId: 'Sub-Administrative Zone',
		};
		return displayNames[field] || field;
	}

	// Computed properties
	get formValid(): boolean {
		return this.enumerationAreaForm.valid;
	}

	get hasSelectedZone(): boolean {
		return !!this.enumerationAreaForm.get('subAdministrativeZoneId')?.value;
	}

	getSubAdministrativeZoneName(id: number): string {
		const zone = this.subAdministrativeZones.find((z) => z.id === id);
		return zone ? `${zone.name} (${zone.type})` : 'Unknown Zone';
	}

	get isFormDirty(): boolean {
		return this.enumerationAreaForm.dirty;
	}

	get hasUnsavedChanges(): boolean {
		return this.isFormDirty && this.formValid;
	}
}
