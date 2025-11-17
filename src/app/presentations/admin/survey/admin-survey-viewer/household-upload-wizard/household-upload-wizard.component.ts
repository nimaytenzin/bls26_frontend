import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { HouseholdUploadService } from '../../../../../core/dataservice/household-upload/household-upload.service';
import { SurveyHouseholdListingDataService } from '../../../../../core/dataservice/survey-household-listings/survey-household-listings.dataservice';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import {
	SurveyHouseholdListing,
	CreateSurveyHouseholdListingDto,
} from '../../../../../core/dataservice/survey-household-listings/survey-household-listings..dto';

interface UploadResult {
	success: boolean;
	message: string;
	uploadedCount?: number;
	errors?: string[];
	households?: SurveyHouseholdListing[];
}

@Component({
	selector: 'app-household-upload-wizard',
	templateUrl: './household-upload-wizard.component.html',
	styleUrls: ['./household-upload-wizard.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class HouseholdUploadWizardComponent implements OnInit {
	@Input() visible: boolean = false;
	@Input() surveyId!: number;
	@Input() surveyName!: string;
	@Input() enumerationAreas: EnumerationArea[] = [];
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() uploadComplete = new EventEmitter<void>();

	// Wizard steps
	currentStep = 1;
	totalSteps = 4;

	// Step 1: Enumeration Area Selection
	selectedEnumerationArea: EnumerationArea | null = null;

	// Step 2: File Upload
	uploadedFile: File | null = null;
	dragOver = false;
	validationErrors: string[] = [];
	previewData: any[] = [];

	// Step 3: Review
	reviewSummary = {
		fileName: '',
		recordCount: 0,
		enumerationAreaName: '',
		hasErrors: false,
		warnings: [] as string[],
	};

	// Step 4: Processing
	uploading = false;
	uploadProgress = 0;
	uploadResult: UploadResult | null = null;

	constructor(
		private uploadService: HouseholdUploadService,
		private householdService: SurveyHouseholdListingDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {}

	// Dialog management
	onDialogHide(): void {
		this.resetWizard();
		this.visibleChange.emit(false);
	}

	resetWizard(): void {
		this.currentStep = 1;
		this.selectedEnumerationArea = null;
		this.uploadedFile = null;
		this.validationErrors = [];
		this.previewData = [];
		this.uploading = false;
		this.uploadProgress = 0;
		this.uploadResult = null;
		this.dragOver = false;
	}

	// Step navigation
	nextStep(): void {
		if (this.currentStep < this.totalSteps) {
			this.currentStep++;
		}
	}

	previousStep(): void {
		if (this.currentStep > 1) {
			this.currentStep--;
		}
	}

	// Step 1: Enumeration Area Selection
	selectEnumerationArea(ea: EnumerationArea): void {
		this.selectedEnumerationArea = ea;
	}

	canProceedFromStep1(): boolean {
		return this.selectedEnumerationArea !== null;
	}

	// Step 2: File Upload
	onDragOver(event: DragEvent): void {
		event.preventDefault();
		this.dragOver = true;
	}

	onDragLeave(event: DragEvent): void {
		event.preventDefault();
		this.dragOver = false;
	}

	onDrop(event: DragEvent): void {
		event.preventDefault();
		this.dragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			this.handleFileSelection(files[0]);
		}
	}

	onFileSelect(event: any): void {
		const file = event.target.files[0];
		if (file) {
			this.handleFileSelection(file);
		}
	}

	handleFileSelection(file: File): void {
		// Validate file type
		if (!file.name.toLowerCase().endsWith('.csv')) {
			this.validationErrors = ['Only CSV files are allowed'];
			return;
		}

		// Validate file size (10MB max)
		if (file.size > 10 * 1024 * 1024) {
			this.validationErrors = ['File size must be less than 10MB'];
			return;
		}

		this.uploadedFile = file;
		this.validationErrors = [];
		this.validateAndPreviewFile();
	}

	validateAndPreviewFile(): void {
		if (!this.uploadedFile) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const csvData = e.target?.result as string;
			this.parseAndValidateCSV(csvData);
		};
		reader.readAsText(this.uploadedFile);
	}

	parseAndValidateCSV(csvData: string): void {
		const lines = csvData.split('\n').filter((line) => line.trim());

		if (lines.length < 2) {
			this.validationErrors = [
				'File must contain at least a header and one data row',
			];
			return;
		}

		// Parse header - exact match for API requirements
		const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
		const requiredHeaders = [
			'surveyId',
			'enumerationAreaId',
			'structureNumber',
			'householdIdentification',
			'householdSerialNumber',
			'nameOfHOH',
			'totalMale',
			'totalFemale',
			'phoneNumber',
			'remarks',
		];

		// Check for exact header match
		const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
		if (missingHeaders.length > 0) {
			this.validationErrors = [
				`Missing required columns: ${missingHeaders.join(', ')}`,
			];
			return;
		}

		// Check for extra headers
		const extraHeaders = headers.filter((h) => !requiredHeaders.includes(h));
		if (extraHeaders.length > 0) {
			this.validationErrors = [
				`Unexpected columns found: ${extraHeaders.join(
					', '
				)}. Please use only the required columns.`,
			];
			return;
		}

		// Parse and validate data rows (preview first 5)
		this.previewData = [];
		this.validationErrors = [];

		for (let i = 1; i < Math.min(6, lines.length); i++) {
			const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
			const row: any = {};
			headers.forEach((header, index) => {
				row[header] = values[index] || '';
			});
			this.previewData.push(row);
		}

		// Validate data consistency
		const errors = this.validateDataRows();
		if (errors.length > 0) {
			this.validationErrors = errors;
		}
	}

	validateDataRows(): string[] {
		const errors: string[] = [];

		this.previewData.forEach((row, index) => {
			const rowNum = index + 2; // +2 because we start from row 1 and skip header

			// Check surveyId matches
			if (row.surveyId && parseInt(row.surveyId) !== this.surveyId) {
				errors.push(
					`Row ${rowNum}: Survey ID mismatch (expected ${this.surveyId})`
				);
			}

			// Check enumerationAreaId matches selected EA
			if (
				row.enumerationAreaId &&
				parseInt(row.enumerationAreaId) !== this.selectedEnumerationArea?.id
			) {
				errors.push(`Row ${rowNum}: Enumeration Area ID mismatch`);
			}

			// Check required fields
			if (!row.structureNumber) {
				errors.push(`Row ${rowNum}: Structure Number is required`);
			}
			if (!row.householdIdentification) {
				errors.push(`Row ${rowNum}: Household ID is required`);
			}
			if (!row.nameOfHOH) {
				errors.push(`Row ${rowNum}: Head of Household name is required`);
			}
			if (
				!row.householdSerialNumber ||
				parseInt(row.householdSerialNumber) < 1
			) {
				errors.push(
					`Row ${rowNum}: Household Serial Number must be a positive number`
				);
			}

			// Validate numeric fields
			if (
				row.totalMale &&
				(isNaN(parseInt(row.totalMale)) || parseInt(row.totalMale) < 0)
			) {
				errors.push(`Row ${rowNum}: Total Male must be a non-negative number`);
			}
			if (
				row.totalFemale &&
				(isNaN(parseInt(row.totalFemale)) || parseInt(row.totalFemale) < 0)
			) {
				errors.push(
					`Row ${rowNum}: Total Female must be a non-negative number`
				);
			}

			// Validate phone number format (if provided)
			if (
				row.phoneNumber &&
				row.phoneNumber.trim() &&
				!/^[\+]?[0-9\s\-\(\)]+$/.test(row.phoneNumber)
			) {
				errors.push(`Row ${rowNum}: Phone number format is invalid`);
			}
		});

		return errors;
	}

	canProceedFromStep2(): boolean {
		return this.uploadedFile !== null && this.validationErrors.length === 0;
	}

	// Step 3: Review
	prepareReview(): void {
		if (!this.uploadedFile || !this.selectedEnumerationArea) return;

		this.reviewSummary = {
			fileName: this.uploadedFile.name,
			recordCount: this.previewData.length, // This is just preview, actual count will be calculated
			enumerationAreaName: this.selectedEnumerationArea.name,
			hasErrors: this.validationErrors.length > 0,
			warnings: [],
		};

		// Add warnings if any
		if (this.previewData.length >= 5) {
			this.reviewSummary.warnings.push(
				'File contains more than 5 records (showing preview only)'
			);
		}
	}

	// Step 4: Processing
	startUpload(): void {
		if (!this.uploadedFile || !this.selectedEnumerationArea) return;

		this.uploading = true;
		this.uploadProgress = 0;

		// Create form data - API expects only the CSV file
		// surveyId and enumerationAreaId should be in the CSV content
		const formData = new FormData();
		formData.append('file', this.uploadedFile);

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			if (this.uploadProgress < 90) {
				this.uploadProgress += 10;
			}
		}, 200);

		// Call upload service using legacy method for compatibility
		this.uploadService.uploadHouseholdListingsLegacy(formData).subscribe({
			next: (result) => {
				clearInterval(progressInterval);
				this.uploadProgress = 100;

				this.uploadResult = {
					success: true,
					message: 'Household listings uploaded successfully',
					uploadedCount: result.uploadedCount,
					households: result.households,
				};
				this.uploading = false;
			},
			error: (error: any) => {
				clearInterval(progressInterval);
				this.uploadProgress = 100;
				this.uploadResult = {
					success: false,
					message: 'Upload failed',
					errors: [error?.error?.message || 'Unknown error occurred'],
				};
				this.uploading = false;
			},
		});
	}

	// Template generation
	downloadTemplate(): void {
		if (!this.selectedEnumerationArea) return;

		this.uploadService
			.downloadTemplate(this.surveyId, this.selectedEnumerationArea.id)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `household_template_survey_${this.surveyId}_ea_${this.selectedEnumerationArea?.id}.csv`;
					link.click();
					window.URL.revokeObjectURL(url);

					this.messageService.add({
						severity: 'success',
						summary: 'Template Downloaded',
						detail: 'CSV template downloaded successfully from server',
						life: 3000,
					});
				},
				error: (error: any) => {
					console.error('Error downloading template:', error);

					// Fallback to local template generation if server fails
					this.messageService.add({
						severity: 'warn',
						summary: 'Using Local Template',
						detail: 'Server template unavailable, generating local template',
						life: 3000,
					});

					this.generateLocalTemplate();
				},
			});
	}

	// Fallback method for local template generation
	private generateLocalTemplate(): void {
		if (!this.selectedEnumerationArea) return;

		this.uploadService
			.generateTemplate(this.surveyId, this.selectedEnumerationArea.id)
			.subscribe({
				next: (blob: Blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `household_template_survey_${this.surveyId}_ea_${this.selectedEnumerationArea?.id}_local.csv`;
					link.click();
					window.URL.revokeObjectURL(url);

					this.messageService.add({
						severity: 'success',
						summary: 'Local Template Downloaded',
						detail: 'Local CSV template downloaded successfully',
						life: 3000,
					});
				},
				error: (error: any) => {
					console.error('Error generating local template:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Template Error',
						detail: 'Failed to generate CSV template',
						life: 3000,
					});
				},
			});
	}

	// Finish wizard
	finishWizard(): void {
		this.uploadComplete.emit();
		this.onDialogHide();
	}

	// Utility methods
	getStepTitle(step: number): string {
		switch (step) {
			case 1:
				return 'Select Enumeration Area';
			case 2:
				return 'Upload CSV File';
			case 3:
				return 'Review & Confirm';
			case 4:
				return 'Processing';
			default:
				return '';
		}
	}

	isStepComplete(step: number): boolean {
		switch (step) {
			case 1:
				return this.selectedEnumerationArea !== null;
			case 2:
				return this.canProceedFromStep2();
			case 3:
				return this.reviewSummary.recordCount > 0;
			case 4:
				return this.uploadResult !== null;
			default:
				return false;
		}
	}
}
