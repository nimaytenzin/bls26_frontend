import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	AbstractControl,
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	ValidationErrors,
	Validators,
} from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { SurveyStatus } from '../../../../../core/constants/enums';

interface SurveyFormData {
	name: string;
	description: string;
	year: number;
	startDate: string;
	endDate: string;
	status: SurveyStatus;
}

@Component({
	selector: 'app-admin-survey-creator-details',
	templateUrl: './admin-survey-creator-details.component.html',
	styleUrls: ['./admin-survey-creator-details.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminSurveyCreatorDetailsComponent implements OnInit {
	@Input() initialData: Partial<SurveyFormData> = {};
	@Output() completed = new EventEmitter<SurveyFormData>();
	@Output() cancelled = new EventEmitter<void>();

	surveyForm!: FormGroup;
	currentYear = new Date().getFullYear();
	yearOptions: number[] = [];
	statusOptions = [
		{ label: 'Active', value: SurveyStatus.ACTIVE },
		{ label: 'Ended', value: SurveyStatus.ENDED },
	];

	minDate: Date;
	maxDate: Date;

	constructor(private fb: FormBuilder) {
		// Set min/max dates for date pickers
		this.minDate = new Date(this.currentYear - 5, 0, 1);
		this.maxDate = new Date(this.currentYear + 5, 11, 31);
	}

	ngOnInit(): void {
		this.initializeYearOptions();
		this.initializeForm();
	}

	/**
	 * Initialize year options (current year ± 5 years)
	 */
	initializeYearOptions() {
		for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
			this.yearOptions.push(i);
		}
	}

	/**
	 * Initialize the form with validators
	 */
	initializeForm() {
		this.surveyForm = this.fb.group({
			name: [
				this.initialData.name || '',
				[Validators.required, Validators.minLength(3)],
			],
			description: [this.initialData.description || '', Validators.required],
			year: [
				this.initialData.year || this.currentYear,
				[Validators.required, Validators.min(2000), Validators.max(2100)],
			],
			startDate: [
				this.initialData.startDate
					? new Date(this.initialData.startDate)
					: null,
				Validators.required,
			],
			endDate: [
				this.initialData.endDate ? new Date(this.initialData.endDate) : null,
				Validators.required,
			],
			status: [
				this.initialData.status || SurveyStatus.ACTIVE,
				Validators.required,
			],
		});

		// Add custom validator to ensure endDate is after startDate
		this.surveyForm.setValidators(this.dateRangeValidator.bind(this));
	}

	/**
	 * Custom validator to ensure end date is after start date
	 */
	dateRangeValidator(control: AbstractControl): ValidationErrors | null {
		const group = control as FormGroup;
		const startDate = group.get('startDate')?.value;
		const endDate = group.get('endDate')?.value;

		if (startDate && endDate && endDate <= startDate) {
			return { dateRangeInvalid: true };
		}

		return null;
	}

	/**
	 * Check if a field is invalid and has been touched
	 */
	isFieldInvalid(fieldName: string): boolean {
		const field = this.surveyForm.get(fieldName);
		return !!(field && field.invalid && (field.dirty || field.touched));
	}

	/**
	 * Get error message for a field
	 */
	getErrorMessage(fieldName: string): string {
		const field = this.surveyForm.get(fieldName);
		if (!field || !field.errors) return '';

		if (field.errors['required']) return `${fieldName} is required`;
		if (field.errors['minlength'])
			return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
		if (field.errors['min'])
			return `${fieldName} must be at least ${field.errors['min'].min}`;
		if (field.errors['max'])
			return `${fieldName} must be at most ${field.errors['max'].max}`;

		return 'Invalid value';
	}

	/**
	 * Handle form submission
	 */
	onSubmit() {
		if (this.surveyForm.invalid) {
			Object.keys(this.surveyForm.controls).forEach((key) => {
				this.surveyForm.get(key)?.markAsTouched();
			});
			return;
		}

		const formValue = this.surveyForm.value;

		// Format dates to ISO string
		const surveyData: SurveyFormData = {
			...formValue,
			startDate:
				formValue.startDate instanceof Date
					? formValue.startDate.toISOString().split('T')[0]
					: formValue.startDate,
			endDate:
				formValue.endDate instanceof Date
					? formValue.endDate.toISOString().split('T')[0]
					: formValue.endDate,
		};

		this.completed.emit(surveyData);
	}

	/**
	 * Handle cancel
	 */
	onCancel() {
		this.cancelled.emit();
	}

	/**
	 * Check if form has date range error
	 */
	hasDateRangeError(): boolean {
		return !!(
			this.surveyForm.hasError('dateRangeInvalid') &&
			(this.surveyForm.get('startDate')?.touched ||
				this.surveyForm.get('endDate')?.touched)
		);
	}
}
