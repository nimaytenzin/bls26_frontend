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
	Survey,
	SaveSurveyDto,
} from '../../../../../core/dataservice/survey/survey.dto';
import { SurveyStatus } from '../../../../../core/constants/enums';
import { SurveyDataService } from '../../../../../core/dataservice/survey/survey.dataservice';
import { MessageService } from 'primeng/api';

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
	saving = false;

	statusOptions = [
		{ label: 'Active', value: SurveyStatus.ACTIVE },
		{ label: 'Ended', value: SurveyStatus.ENDED },
	];

	constructor(
		private fb: FormBuilder,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig,
		private surveyService: SurveyDataService,
		private messageService: MessageService
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
		// if (this.surveyForm.invalid) {
		// 	this.messageService.add({
		// 		severity: 'warn',
		// 		summary: 'Validation Error',
		// 		detail: 'Please fill in all required fields correctly',
		// 		life: 3000,
		// 	});
		// 	return;
		// }

		this.saving = true;
		const formData = this.surveyForm.value;

		// Prepare SaveSurveyDto
		const saveDto: SaveSurveyDto = {
			id: this.survey?.id, // Include id if editing existing survey
			name: formData.name,
			description: formData.description,
			startDate: formData.startDate, // Already in YYYY-MM-DD format from date input
			endDate: formData.endDate, // Already in YYYY-MM-DD format from date input
			year: formData.year,
			status: formData.status || SurveyStatus.ACTIVE,
		};

		this.surveyService.saveSurvey(saveDto).subscribe({
			next: (savedSurvey) => {
				this.saving = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: this.survey?.id
						? 'Survey updated successfully'
						: 'Survey created successfully',
					life: 3000,
				});
				this.ref.close(savedSurvey);
			},
			error: (error) => {
				this.saving = false;
				console.error('Error saving survey:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail:
						error?.error?.message ||
						error?.error?.error ||
						'Failed to save survey',
					life: 5000,
				});
			},
		});
	}

	cancel() {
		this.ref.close();
	}
}
