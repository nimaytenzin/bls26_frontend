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
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';

/**
 * Upload GeoJSON Component for Enumeration Areas
 *
 * This component provides functionality for uploading GeoJSON files
 * to individual enumeration areas.
 *
 * Features:
 * - File upload with validation
 * - Real-time upload progress
 * - Preview of selected file
 * - Can be used as dialog or embedded component
 * - Geometry replacement warning
 * - Comprehensive error handling and user feedback
 */
@Component({
	selector: 'app-upload-geojson-ea',
	templateUrl: './upload-geojson-ea.component.html',
	styleUrls: ['./upload-geojson-ea.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class UploadGeojsonEaComponent implements OnInit, OnChanges {
	// Input properties
	@Input() visible: boolean = false;
	@Input() enumerationArea: EnumerationArea | null = null;
	@Input() asDialog: boolean = true; // Use as dialog or embedded component
	@Input() dialogHeader: string = 'Upload GeoJSON';

	// Output events
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() onSuccess = new EventEmitter<any>();
	@Output() onCancel = new EventEmitter<void>();

	// Upload state
	selectedFile: File | null = null;
	uploadLoading = false;
	uploadComplete = false;

	// UI state
	currentStep: 'select' | 'upload' | 'complete' = 'select';

	constructor(
		private enumerationAreaService: EnumerationAreaDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['enumerationArea'] && changes['enumerationArea'].currentValue) {
			this.resetUpload();
		}
	}

	onFileSelect(event: any) {
		const files = event.files;
		if (files && files.length > 0) {
			this.selectedFile = files[0];
			this.uploadComplete = false;
			this.currentStep = 'select';
			this.validateFile();
		}
	}

	onFileRemove() {
		this.selectedFile = null;
		this.uploadComplete = false;
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

		// Check file size (10MB limit for individual files)
		const maxSize = 10 * 1024 * 1024; // 10MB in bytes
		if (this.selectedFile.size > maxSize) {
			this.messageService.add({
				severity: 'warn',
				summary: 'File Too Large',
				detail: 'File size must be less than 10MB',
				life: 3000,
			});
			return false;
		}

		return true;
	}

	startUpload() {
		if (!this.selectedFile || !this.enumerationArea || !this.validateFile()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Cannot Upload',
				detail: 'Please select a valid GeoJSON file',
				life: 3000,
			});
			return;
		}

		this.currentStep = 'upload';
		this.uploadLoading = true;
		this.uploadComplete = false;

		this.enumerationAreaService
			.uploadGeojsonByEnumerationArea(
				this.enumerationArea.id,
				this.selectedFile
			)
			.subscribe({
				next: (response) => {
					this.uploadLoading = false;
					this.uploadComplete = true;
					this.currentStep = 'complete';

					this.messageService.add({
						severity: 'success',
						summary: 'Upload Successful',
						detail: 'GeoJSON uploaded successfully',
						life: 3000,
					});

					// Emit success event
					this.onSuccess.emit(response);
				},
				error: (error) => {
					this.uploadLoading = false;
					this.currentStep = 'select';
					console.error('Error uploading GeoJSON:', error);

					this.messageService.add({
						severity: 'error',
						summary: 'Upload Failed',
						detail: error.error?.message || 'Failed to upload GeoJSON file',
						life: 5000,
					});
				},
			});
	}

	resetUpload() {
		this.selectedFile = null;
		this.uploadComplete = false;
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
		return this.hasFile && !this.uploadLoading && !!this.enumerationArea;
	}

	get hasExistingGeometry(): boolean {
		return !!(this.enumerationArea && this.enumerationArea.geom);
	}

	get uploadButtonLabel(): string {
		return this.hasExistingGeometry ? 'Replace Geometry' : 'Upload Geometry';
	}

	get uploadButtonIcon(): string {
		return this.hasExistingGeometry ? 'pi pi-refresh' : 'pi pi-upload';
	}

	get uploadButtonSeverity(): string {
		return this.hasExistingGeometry ? 'warn' : 'success';
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
	goToStep(step: 'select' | 'upload' | 'complete') {
		if (step === 'select' && this.uploadLoading) return;
		this.currentStep = step;
	}
}
