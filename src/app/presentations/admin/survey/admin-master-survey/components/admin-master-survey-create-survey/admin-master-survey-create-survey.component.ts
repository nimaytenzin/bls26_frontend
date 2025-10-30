import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SurveyStatus } from '../../../../../../core/dataservice/survey/survey.dto';

@Component({
	selector: 'app-admin-master-survey-create-survey',
	templateUrl: './admin-master-survey-create-survey.component.html',
	styleUrls: ['./admin-master-survey-create-survey.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminMasterSurveyCreateSurveyComponent implements OnInit {
	surveyForm!: FormGroup;
	SurveyStatus = SurveyStatus;

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
		this.initializeForm();
	}

	initializeForm() {
		const data = this.config.data || {};
		this.surveyForm = this.fb.group(
			{
				name: [data.name || '', [Validators.required, Validators.minLength(3)]],
				description: [
					data.description || '',
					[Validators.required, Validators.minLength(10)],
				],
				startDate: [data.startDate || '', [Validators.required]],
				endDate: [data.endDate || '', [Validators.required]],
				year: [
					data.year || new Date().getFullYear(),
					[Validators.required, Validators.min(2000), Validators.max(2100)],
				],
				status: [data.status || SurveyStatus.ACTIVE, [Validators.required]],
				isSubmitted: [data.isSubmitted || false],
				isVerified: [data.isVerified || false],
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

	next() {
		if (this.surveyForm.valid) {
			this.ref.close(this.surveyForm.value);
		}
	}

	cancel() {
		this.ref.close();
	}
}
