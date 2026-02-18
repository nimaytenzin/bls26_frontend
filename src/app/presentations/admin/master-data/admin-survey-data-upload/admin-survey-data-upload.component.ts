import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { SurveyDataService } from '../../../../core/dataservice/survey/survey.dataservice';
import {
	CreateSurveyWithHouseholdUploadResponseDto,
} from '../../../../core/dataservice/survey/survey.dto';
import { SurveyStatus } from '../../../../core/constants/enums';
import { FileUpload } from 'primeng/fileupload';

@Component({
	selector: 'app-admin-survey-data-upload',
	templateUrl: './admin-survey-data-upload.component.html',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSurveyDataUploadComponent {
	@ViewChild('csvFileUpload') csvFileUpload?: FileUpload;

	// Form model – Create Survey with Household Upload (Process B)
	name = '';
	description = '';
	startDate: Date | null = null;
	endDate: Date | null = null;
	year: number | null = null;
	status: SurveyStatus = SurveyStatus.ACTIVE;
	isSubmitted = false;
	isVerified = false;

	csvFile: File | null = null;
	submitting = false;
	downloadingTemplate = false;

	// Response state
	lastResponse: CreateSurveyWithHouseholdUploadResponseDto | null = null;
	/** When true, result dialog is shown (success or error). */
	showResultDialog = false;

	readonly SurveyStatus = SurveyStatus;

	constructor(
		private surveyService: SurveyDataService,
		private messageService: MessageService
	) {}

	onCsvFileSelected(event: { files: File[] }): void {
		this.csvFile = event.files?.[0] ?? null;
	}

	onCsvFileRemoved(): void {
		this.csvFile = null;
	}

	downloadTemplate(): void {
		this.downloadingTemplate = true;
		this.surveyService.downloadHouseholdUploadTemplateExcel().subscribe({
			next: (blob: Blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'household_upload_template.xlsx';
				link.click();
				window.URL.revokeObjectURL(url);
				this.downloadingTemplate = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Template downloaded',
					detail: 'Excel template downloaded. Fill and save as CSV for upload.',
					life: 3000,
				});
			},
			error: (err) => {
				this.downloadingTemplate = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Download failed',
					detail: err?.error?.message || 'Failed to download template',
					life: 5000,
				});
			},
		});
	}

	createSurveyWithHouseholdUpload(): void {
		if (!this.name?.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation',
				detail: 'Survey name is required',
				life: 3000,
			});
			return;
		}
		if (!this.description?.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation',
				detail: 'Survey description is required',
				life: 3000,
			});
			return;
		}
		if (!this.startDate) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation',
				detail: 'Start date is required',
				life: 3000,
			});
			return;
		}
		if (!this.endDate) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation',
				detail: 'End date is required',
				life: 3000,
			});
			return;
		}
		if (this.year == null || this.year < 1900 || this.year > 2100) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation',
				detail: 'Survey year is required (1900–2100)',
				life: 3000,
			});
			return;
		}
		if (!this.csvFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation',
				detail: 'Please select a CSV file',
				life: 3000,
			});
			return;
		}

		const formData = new FormData();
		formData.append('name', this.name.trim());
		formData.append('description', this.description.trim());
		formData.append(
			'startDate',
			this.toISODateString(this.startDate as Date)
		);
		formData.append('endDate', this.toISODateString(this.endDate as Date));
		formData.append('year', String(this.year));
		formData.append('status', this.status);
		formData.append('isSubmitted', String(this.isSubmitted));
		formData.append('isVerified', String(this.isVerified));
		formData.append('file', this.csvFile, this.csvFile.name);

		this.submitting = true;
		this.lastResponse = null;
		this.surveyService.createSurveyWithHouseholdUpload(formData).subscribe({
			next: (res) => {
				this.lastResponse = res;
				this.submitting = false;
				if (res.survey != null && res.bulkResult != null) {
					this.csvFileUpload?.clear();
					this.csvFile = null;
					this.showResultDialog = true;
				} else {
					this.showResultDialog = true;
				}
			},
			error: (err) => {
				this.submitting = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Request failed',
					detail: err?.error?.message || 'Failed to create survey and upload CSV',
					life: 5000,
				});
			},
		});
	}

	private toISODateString(d: Date): string {
		return d.toISOString().split('T')[0];
	}

	closeResultDialog(): void {
		this.showResultDialog = false;
	}
}
