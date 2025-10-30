import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

@Component({
	selector: 'app-admin-master-survey-create-upload-enumerators',
	templateUrl: './admin-master-survey-create-upload-enumerators.component.html',
	styleUrls: ['./admin-master-survey-create-upload-enumerators.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminMasterSurveyCreateUploadEnumeratorsComponent
	implements OnInit
{
	uploadedFiles: any[] = [];
	dummyEnumerators: any[] = [];

	constructor(
		private messageService: MessageService,
		public ref: DynamicDialogRef,
		public config: DynamicDialogConfig
	) {}

	ngOnInit() {
		// Create some dummy data for preview
		this.dummyEnumerators = [
			{
				name: 'John Doe',
				email: 'john.doe@example.com',
				phone: '+975-17123456',
				status: 'Active',
			},
			{
				name: 'Jane Smith',
				email: 'jane.smith@example.com',
				phone: '+975-17234567',
				status: 'Active',
			},
			{
				name: 'Bob Wilson',
				email: 'bob.wilson@example.com',
				phone: '+975-17345678',
				status: 'Active',
			},
		];
	}

	onUpload(event: any) {
		for (let file of event.files) {
			this.uploadedFiles.push(file);
		}
		this.messageService.add({
			severity: 'info',
			summary: 'File Uploaded',
			detail: 'This is a dummy upload. File processing not implemented.',
			life: 3000,
		});
	}

	downloadTemplate() {
		this.messageService.add({
			severity: 'info',
			summary: 'Download Template',
			detail: 'Template download not implemented in this dummy version.',
			life: 3000,
		});
	}

	back() {
		this.ref.close({ back: true });
	}

	skipForNow() {
		this.messageService.add({
			severity: 'info',
			summary: 'Skipped',
			detail: 'Enumerator upload skipped. You can add them later.',
			life: 3000,
		});
		setTimeout(() => {
			this.ref.close({ skipped: true });
		}, 500);
	}

	complete() {
		this.messageService.add({
			severity: 'success',
			summary: 'Survey Created',
			detail: 'Survey created successfully!',
			life: 3000,
		});
		setTimeout(() => {
			this.ref.close({ completed: true });
		}, 500);
	}
}
