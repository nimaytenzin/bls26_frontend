import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { SurveyEnumerationAreaHouseholdListingDataService } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dataservice';
import { CreateSurveyEnumerationAreaHouseholdListingDto } from '../../../../../../core/dataservice/survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import { SurveyEnumerationAreaDataService } from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import {
	SurveyEnumerationArea,
	SubmitSurveyEnumerationAreaDto,
} from '../../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';
import { AuthService } from '../../../../../../core/dataservice/auth/auth.service';

@Component({
	selector: 'app-survey-data-upload',
	standalone: true,
	imports: [
		CommonModule,
		FileUploadModule,
		CardModule,
		ProgressBarModule,
		ButtonModule,
		TableModule,
		DialogModule,
	],
	templateUrl: './survey-data-upload.component.html',
	styleUrls: ['./survey-data-upload.component.css'],
})
export class SurveyDataUploadComponent implements OnInit {
	@Input() surveyId!: number;
	@Output() uploadComplete = new EventEmitter<void>();

	enumerationAreas: SurveyEnumerationArea[] = [];
	selectedEA: SurveyEnumerationArea | null = null;
	loading = false;
	uploadProgress = 0;
	showUploadDialog = false;
	submitting = false;

	// CSV preview properties
	csvData: any[] = [];
	csvHeaders: string[] = [];
	selectedFile: File | null = null;
	showPreview = false;

	constructor(
		private householdService: SurveyEnumerationAreaHouseholdListingDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private authService: AuthService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadEnumerationAreas();
		}
	}

	/**
	 * Load enumeration areas for the survey
	 */
	loadEnumerationAreas() {
		this.loading = true;
		this.surveyEAService.getBySurvey(this.surveyId).subscribe({
			next: (areas) => {
				this.enumerationAreas = areas;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading enumeration areas:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumeration areas',
				});
				this.loading = false;
			},
		});
	}

	/**
	 * Select an enumeration area for data upload and open dialog
	 */
	selectEnumerationArea(ea: SurveyEnumerationArea) {
		this.selectedEA = ea;
		this.uploadProgress = 0;
		this.showUploadDialog = true;
	}

	/**
	 * Close upload dialog
	 */
	closeUploadDialog() {
		this.showUploadDialog = false;
		this.uploadProgress = 0;
		this.resetPreview();
	}

	/**
	 * Reset CSV preview
	 */
	resetPreview() {
		this.csvData = [];
		this.csvHeaders = [];
		this.selectedFile = null;
		this.showPreview = false;
	}

	/**
	 * Handle file selection for preview
	 */
	onFileSelect(event: any) {
		const file = event.files[0];
		if (!file) return;

		this.selectedFile = file;
		this.previewCSV(file);
	}

	/**
	 * Preview CSV file as table
	 */
	private previewCSV(file: File) {
		const reader = new FileReader();
		reader.onload = (e: any) => {
			try {
				const csvText = e.target.result;
				const lines = csvText.split('\n').filter((line: string) => line.trim());

				if (lines.length === 0) {
					this.messageService.add({
						severity: 'warn',
						summary: 'Warning',
						detail: 'CSV file is empty',
					});
					return;
				}

				// Parse headers
				this.csvHeaders = lines[0].split(',').map((h: string) => h.trim());

				// Parse data rows
				this.csvData = [];
				for (let i = 1; i < lines.length; i++) {
					const values = lines[i].split(',').map((v: string) => v.trim());
					const row: any = {};

					this.csvHeaders.forEach((header, index) => {
						row[header] = values[index] || '';
					});

					this.csvData.push(row);
				}

				this.showPreview = true;

				this.messageService.add({
					severity: 'info',
					summary: 'File Loaded',
					detail: `Preview showing ${this.csvData.length} rows`,
				});
			} catch (error) {
				console.error('Error previewing CSV:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to preview CSV file',
				});
			}
		};
		reader.readAsText(file);
	}

	/**
	 * Download CSV template for selected enumeration area
	 */
	downloadTemplate(ea: SurveyEnumerationArea) {
		this.householdService.downloadTemplate(ea.id).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `household_listing_EA_${
					ea.enumerationArea?.areaCode || ea.id
				}.csv`;
				link.click();
				window.URL.revokeObjectURL(url);

				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Template downloaded successfully',
				});
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download template',
				});
			},
		});
	}

	/**
	 * Handle file upload
	 */
	onFileUpload(event: FileUploadHandlerEvent) {
		if (!this.selectedEA) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select an enumeration area first',
			});
			return;
		}

		const file = this.selectedFile || event.files[0];
		if (!file) return;

		// Parse CSV file
		this.parseCSVFile(file);
	}

	/**
	 * Parse CSV file and upload household data
	 */
	private parseCSVFile(file: File) {
		const reader = new FileReader();
		reader.onload = (e: any) => {
			try {
				const csvData = e.target.result;
				const listings = this.csvToListings(csvData);
				if (listings.length === 0) {
					this.messageService.add({
						severity: 'warn',
						summary: 'Warning',
						detail: 'No valid data found in CSV file',
					});
					return;
				}
				this.uploadHouseholdData(listings);
			} catch (error) {
				console.error('Error parsing CSV:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to parse CSV file',
				});
			}
		};
		reader.readAsText(file);
	}

	/**
	 * Convert CSV data to household listing DTOs
	 */
	private csvToListings(
		csvData: string
	): CreateSurveyEnumerationAreaHouseholdListingDto[] {
		if (!this.selectedEA) return [];

		const lines = csvData.split('\n');
		const headers = lines[0].split(',').map((h) => h.trim());
		const listings: CreateSurveyEnumerationAreaHouseholdListingDto[] = [];

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const values = line.split(',').map((v) => v.trim());
			if (values.length < headers.length) continue;

			const listing: CreateSurveyEnumerationAreaHouseholdListingDto = {
				surveyEnumerationAreaId: this.selectedEA.id, // Use selected EA ID
				structureNumber: values[3] || '',
				householdIdentification: values[4] || '',
				householdSerialNumber: parseInt(values[5]) || 0,
				nameOfHOH: values[6] || '',
				totalMale: parseInt(values[7]) || 0,
				totalFemale: parseInt(values[8]) || 0,
				phoneNumber: values[9] || undefined,
				remarks: values[10] || undefined,
			};

			// Validate required fields
			if (
				listing.surveyEnumerationAreaId &&
				listing.structureNumber &&
				listing.householdIdentification &&
				listing.householdSerialNumber &&
				listing.nameOfHOH
			) {
				listings.push(listing);
			}
		}

		return listings;
	}

	/**
	 * Upload household data to server
	 */
	private uploadHouseholdData(
		listings: CreateSurveyEnumerationAreaHouseholdListingDto[]
	) {
		this.uploadProgress = 0;
		const progressInterval = setInterval(() => {
			if (this.uploadProgress < 90) {
				this.uploadProgress += 10;
			}
		}, 200);

		this.householdService.bulkUpload(listings).subscribe({
			next: (response) => {
				clearInterval(progressInterval);
				this.uploadProgress = 100;

				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: `Uploaded ${response.success} households. ${response.failed} failed.`,
				});

				if (response.errors.length > 0) {
					console.error('Upload errors:', response.errors);
				}

				// Notify parent component and close dialog
				setTimeout(() => {
					this.uploadProgress = 0;
					this.showUploadDialog = false;
					this.resetPreview();
					this.uploadComplete.emit();
				}, 2000);
			},
			error: (error: any) => {
				clearInterval(progressInterval);
				this.uploadProgress = 0;
				console.error('Error uploading household data:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to upload household data',
				});
			},
		});
	}

	/**
	 * Mark enumeration area data as submitted
	 */
	markEnumerationAreaAsSubmitted(ea: SurveyEnumerationArea) {
		if (!ea) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Invalid enumeration area',
			});
			return;
		}

		// Check if already submitted
		if (ea.isSubmitted) {
			this.messageService.add({
				severity: 'info',
				summary: 'Already Submitted',
				detail: 'This enumeration area has already been submitted',
			});
			return;
		}

		// Get authenticated user ID
		const currentUser = this.authService.getCurrentUser();
		if (!currentUser || !currentUser.id) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Unable to get authenticated user information',
			});
			return;
		}

		this.submitting = true;

		const submitDto: SubmitSurveyEnumerationAreaDto = {
			submittedBy: currentUser.id,
		};

		this.surveyEAService.submit(ea.id, submitDto).subscribe({
			next: (updatedEA) => {
				this.submitting = false;

				// Update the EA in the list
				const index = this.enumerationAreas.findIndex(
					(item) => item.id === updatedEA.id
				);
				if (index !== -1) {
					this.enumerationAreas[index] = updatedEA;
				}

				this.messageService.add({
					severity: 'success',
					summary: 'Submitted',
					detail: 'Enumeration area data has been marked as submitted',
				});

				this.uploadComplete.emit();
			},
			error: (error) => {
				this.submitting = false;
				console.error('Error submitting enumeration area:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail:
						error.error?.message ||
						'Failed to mark enumeration area as submitted',
				});
			},
		});
	}
}
