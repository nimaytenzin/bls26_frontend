import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { BulkUploadResponse } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';

/**
 * Bulk Upload Enumeration Areas Component
 *
 * This component provides functionality for bulk uploading enumeration areas
 * from GeoJSON FeatureCollection files.
 *
 * Features:
 * - File upload with validation
 * - Real-time upload progress
 * - Detailed results display (success, skipped, errors)
 * - Can be used as dialog or embedded component
 * - Context filtering for specific sub-admin zones
 * - Comprehensive error handling and user feedback
 */
@Component({
	selector: 'app-bulk-upload-ea',
	templateUrl: './bulk-upload-ea.component.html',
	styleUrls: ['./bulk-upload-ea.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class BulkUploadEaComponent implements OnInit {
	// Input properties
	@Input() visible: boolean = false;
	@Input() subAdminZoneId: number | null = null; // Filter for specific sub-admin zone
	@Input() asDialog: boolean = true; // Use as dialog or embedded component
	@Input() dialogHeader: string = 'Bulk Upload Enumeration Areas';

	// Output events
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() onSuccess = new EventEmitter<BulkUploadResponse>();
	@Output() onCancel = new EventEmitter<void>();

	// Upload state
	selectedFile: File | null = null;
	uploadLoading = false;
	uploadResults: BulkUploadResponse | null = null;

	// UI state
	currentStep: 'select' | 'upload' | 'results' = 'select';

	constructor(
		private enumerationAreaService: EnumerationAreaDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {}

	onFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.selectedFile = files[0];
			this.uploadResults = null;
			this.currentStep = 'select';
			this.validateFile();
		}
	}

	onFileRemove() {
		this.selectedFile = null;
		this.uploadResults = null;
		this.currentStep = 'select';
	}

	validateFile(): boolean {
		if (!this.selectedFile) {
			return false;
		}

		// Check file extension
		const fileName = this.selectedFile.name.toLowerCase();
		if (!fileName.endsWith('.json') && !fileName.endsWith('.geojson')) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Invalid File Type',
				detail: 'Please select a .json or .geojson file',
				life: 3000,
			});
			return false;
		}

		// Check file size (50MB limit)
		const maxSize = 50 * 1024 * 1024; // 50MB in bytes
		if (this.selectedFile.size > maxSize) {
			this.messageService.add({
				severity: 'warn',
				summary: 'File Too Large',
				detail: 'File size must be less than 50MB',
				life: 3000,
			});
			return false;
		}

		return true;
	}

	startUpload() {
		if (!this.selectedFile || !this.validateFile()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No File Selected',
				detail: 'Please select a valid GeoJSON file to upload',
				life: 3000,
			});
			return;
		}

		this.currentStep = 'upload';
		this.uploadLoading = true;
		this.uploadResults = null;

		this.enumerationAreaService.bulkUploadGeojson(this.selectedFile).subscribe({
			next: (response) => {
				this.uploadLoading = false;
				this.uploadResults = response;
				this.currentStep = 'results';

				// Show summary messages
				this.showUploadSummary(response);

				// Emit success event
				this.onSuccess.emit(response);
			},
			error: (error) => {
				this.uploadLoading = false;
				this.currentStep = 'select';
				console.error('Error bulk uploading GeoJSON:', error);

				this.messageService.add({
					severity: 'error',
					summary: 'Upload Failed',
					detail: error.error?.message || 'Failed to upload GeoJSON file',
					life: 5000,
				});
			},
		});
	}

	private showUploadSummary(response: BulkUploadResponse) {
		const successCount = response.success;
		const skippedCount = response.skipped;
		const errorCount = response.errors.length;

		if (successCount > 0) {
			this.messageService.add({
				severity: 'success',
				summary: 'Upload Complete',
				detail: `Successfully created ${successCount} enumeration area(s)`,
				life: 5000,
			});
		}

		if (skippedCount > 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'Items Skipped',
				detail: `${skippedCount} area(s) already exist and were skipped`,
				life: 5000,
			});
		}

		if (errorCount > 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Errors Encountered',
				detail: `${errorCount} feature(s) failed to process`,
				life: 5000,
			});
		}
	}

	resetUpload() {
		this.selectedFile = null;
		this.uploadResults = null;
		this.currentStep = 'select';
		this.uploadLoading = false;
	}

	onCancel_() {
		this.resetUpload();
		this.onCancel.emit();

		if (this.asDialog) {
			this.hideDialog();
		}
	}

	onClose() {
		this.resetUpload();

		if (this.asDialog) {
			this.hideDialog();
		}
	}

	hideDialog() {
		this.visible = false;
		this.visibleChange.emit(false);
	}

	// Computed properties
	get hasFile(): boolean {
		return !!this.selectedFile;
	}

	get canUpload(): boolean {
		return this.hasFile && !this.uploadLoading;
	}

	get uploadComplete(): boolean {
		return !!this.uploadResults;
	}

	get totalProcessed(): number {
		if (!this.uploadResults) return 0;
		return (
			this.uploadResults.success +
			this.uploadResults.skipped +
			this.uploadResults.errors.length
		);
	}

	get uploadSuccessRate(): number {
		if (!this.uploadResults || this.totalProcessed === 0) return 0;
		return Math.round((this.uploadResults.success / this.totalProcessed) * 100);
	}

	get hasErrors(): boolean {
		return !!(this.uploadResults && this.uploadResults.errors.length > 0);
	}

	get hasSkipped(): boolean {
		return !!(this.uploadResults && this.uploadResults.skipped > 0);
	}

	get hasCreated(): boolean {
		return !!(this.uploadResults && this.uploadResults.success > 0);
	}

	// File size formatting
	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Step navigation
	goToStep(step: 'select' | 'upload' | 'results') {
		if (step === 'select' && this.uploadLoading) return;
		this.currentStep = step;
	}
}
