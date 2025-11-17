import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
	SurveyStatus,
	Survey,
} from '../../../../../core/dataservice/survey/survey.dto';

@Component({
	selector: 'app-admin-master-survey-edit',
	templateUrl: './admin-master-survey-edit.component.html',
	styleUrls: ['./admin-master-survey-edit.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminMasterSurveyEditComponent implements OnInit {
	surveyForm!: FormGroup;
	SurveyStatus = SurveyStatus;
	survey: Survey | null = null;

	statusOptions = [
		{ label: 'Active', value: SurveyStatus.ACTIVE },
		{ label: 'Ended', value: SurveyStatus.ENDED },
	];

	constructor(
		private fb: FormBuilder,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig
	) {}

	ngOnInit() {
		this.survey = this.config.data?.survey;
		this.initializeForm();
	}

	initializeForm() {
		// Format dates for input fields
		const formatDateForInput = (date: any): string => {
			if (!date) return '';
			const d = new Date(date);
			return d.toISOString().split('T')[0];
		};

		this.surveyForm = this.fb.group(
			{
				name: [
					this.survey?.name || '',
					[Validators.required, Validators.minLength(3)],
				],
				description: [
					this.survey?.description || '',
					[Validators.required, Validators.minLength(10)],
				],
				startDate: [
					formatDateForInput(this.survey?.startDate) || '',
					[Validators.required],
				],
				endDate: [
					formatDateForInput(this.survey?.endDate) || '',
					[Validators.required],
				],
				year: [
					this.survey?.year || new Date().getFullYear(),
					[Validators.required, Validators.min(2000), Validators.max(2100)],
				],
				status: [
					this.survey?.status || SurveyStatus.ACTIVE,
					[Validators.required],
				],
			},
			{ validators: this.dateRangeValidator }
		);
	}

	dateRangeValidator(group: FormGroup) {
		const start = group.get('startDate')?.value;
		const end = group.get('endDate')?.value;

		if (start && end && new Date(end) < new Date(start)) {
			return { dateRange: true };
		}
		return null;
	}

	hasFormError(field: string): boolean {
		const control = this.surveyForm.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	getFormError(field: string): string {
		const control = this.surveyForm.get(field);
		if (control?.hasError('required')) {
			return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
		}
		if (control?.hasError('minlength')) {
			return `Minimum length is ${control.errors?.['minlength'].requiredLength}`;
		}
		if (control?.hasError('min')) {
			return `Minimum value is ${control.errors?.['min'].min}`;
		}
		if (control?.hasError('max')) {
			return `Maximum value is ${control.errors?.['max'].max}`;
		}
		return '';
	}

	hasDateRangeError(): boolean {
		return this.surveyForm.hasError('dateRange') && this.surveyForm.touched;
	}

	formatDate(date: any): string {
		if (!date) return 'Not selected';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	save() {
		if (this.surveyForm.valid) {
			const formData = this.surveyForm.value;
			// Convert date strings back to Date objects
			formData.startDate = new Date(formData.startDate);
			formData.endDate = new Date(formData.endDate);
			this.ref.close(formData);
		}
	}

	cancel() {
		this.ref.close();
	}

	// Utility method to check if form has changed
	hasFormChanged(): boolean {
		if (!this.survey) return false;

		const currentValues = this.surveyForm.value;
		const originalValues = {
			name: this.survey.name,
			description: this.survey.description,
			startDate: new Date(this.survey.startDate).toISOString().split('T')[0],
			endDate: new Date(this.survey.endDate).toISOString().split('T')[0],
			year: this.survey.year,
			status: this.survey.status,
		};

		return JSON.stringify(currentValues) !== JSON.stringify(originalValues);
	}
}
