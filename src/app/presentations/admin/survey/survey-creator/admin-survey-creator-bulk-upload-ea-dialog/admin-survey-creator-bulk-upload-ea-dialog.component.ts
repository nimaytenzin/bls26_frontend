import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SurveyEnumerationAreaDataService } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { BulkMatchEaResponse } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dto';

@Component({
	selector: 'app-admin-survey-creator-bulk-upload-ea-dialog',
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './admin-survey-creator-bulk-upload-ea-dialog.component.html',
	styleUrls: ['./admin-survey-creator-bulk-upload-ea-dialog.component.css'],
})
export class AdminSurveyCreatorBulkUploadEaDialogComponent {
	@Input() visible = false;
	@Output() visibleChange = new EventEmitter<boolean>();
	@Output() matchedEAsAdded = new EventEmitter<EnumerationArea[]>();
	/** Emitted when user clicks "Proceed to Enumerator upload" after decoding (parent can advance wizard step). */
	@Output() proceedToEnumerators = new EventEmitter<void>();

	bulkUploadFile: File | null = null;
	uploading = false;
	uploadResult: BulkMatchEaResponse | null = null;
	activeTabIndex = 0;

	constructor(
		private eaService: EnumerationAreaDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private messageService: MessageService
	) {}

	onClose(): void {
		this.visible = false;
		this.visibleChange.emit(false);
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
		this.activeTabIndex = 0;
	}

	/** Step 2: Close dialog and emit so parent can proceed to enumerator upload step. */
	onProceedToEnumerators(): void {
		this.proceedToEnumerators.emit();
		this.onClose();
	}

	onBulkFileSelect(event: { files: File[] }): void {
		const files = event.files;
		if (files && files.length > 0) {
			this.bulkUploadFile = files[0];
			this.uploadResult = null;
		}
	}

	downloadTemplate(): void {
		this.surveyEAService.downloadTemplate().subscribe({
			next: (blob: Blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'enumeration_area_upload_template.csv';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Template downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download template',
					life: 3000,
				});
			},
		});
	}

	executeBulkUpload(): void {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No File',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.uploading = true;
		this.uploadResult = null;
		this.activeTabIndex = 0;

		this.surveyEAService.bulkMatch(this.bulkUploadFile).subscribe({
			next: (result) => {
				this.uploadResult = result;
				this.uploading = false;

				if (result.matched > 0 && result.matchedEnumerationAreaIds.length > 0) {
					const loadPromises = result.matchedEnumerationAreaIds.map((eaId) => {
						return new Promise<EnumerationArea | null>((resolve) => {
							this.eaService.findEnumerationAreaById(eaId, false, true).subscribe({
								next: (fullEA) => resolve(fullEA),
								error: () => {
									const minimal: EnumerationArea = {
										id: eaId,
										name: `EA ${eaId}`,
										areaCode: '',
									} as EnumerationArea;
									resolve(minimal);
								},
							});
						});
					});

					Promise.all(loadPromises).then((eas) => {
						const added = eas.filter((ea): ea is EnumerationArea => ea != null);
						this.matchedEAsAdded.emit(added);
						this.messageService.add({
							severity: 'success',
							summary: 'Success',
							detail: `Matched ${result.matched} enumeration areas and added to selection`,
							life: 5000,
						});
					});
				} else {
					this.messageService.add({
						severity: 'warn',
						summary: 'No Matches',
						detail: 'No enumeration areas were matched. Please check your CSV file.',
						life: 5000,
					});
				}

				if (result.errors && result.errors.length > 0) {
					this.activeTabIndex = 1;
				}
			},
			error: (error) => {
				this.uploading = false;
				console.error('Error matching enumeration areas:', error);
				const errorMessage = error.error?.message ?? 'Failed to process CSV file. Please check the format.';
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
					life: 5000,
				});
			},
		});
	}
}
