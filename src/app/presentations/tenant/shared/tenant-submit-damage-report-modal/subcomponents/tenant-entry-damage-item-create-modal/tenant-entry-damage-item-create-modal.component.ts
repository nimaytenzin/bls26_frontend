import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ENTRYDAMAGEACTIONSTATUS } from 'src/app/core/constants/enums';
import { EntryDamageReportDataservice } from 'src/app/core/dataservice/damage/entry-damage-report.dataservice';
import { CreateEntryDamageReportItemDTO } from 'src/app/core/dataservice/damage/entry-damage-report-item.dto';
import { CreateEntryDamageReportDTO } from 'src/app/core/dataservice/damage/entry-damage-report.dto';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
    selector: 'app-tenant-entry-damage-item-create-modal',
    templateUrl: './tenant-entry-damage-item-create-modal.component.html',
    styleUrls: ['./tenant-entry-damage-item-create-modal.component.css'],
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        FileUploadModule,
        CommonModule,
        InputTextModule,
        InputTextareaModule,
    ],
})
export class TenantEntryDamageItemCreateModalComponent implements OnInit {
    location: string;
    description: string;
    files: File[] = [];
    entryDamageReportId: number;
    totalSize: number = 0;
    totalSizePercent: number = 0;

    constructor(
        private config: PrimeNGConfig,
        private messageService: MessageService,
        private ref: DynamicDialogRef,
        private dialogConfig: DynamicDialogConfig,
        private entryDamageReportDataService: EntryDamageReportDataservice
    ) {}

    ngOnInit() {
        this.entryDamageReportId = this.dialogConfig.data.entryDamageReportId;
    }

    choose(event, callback) {
        callback();
    }

    onRemoveTemplatingFile(event, file, removeFileCallback, index) {
        removeFileCallback(event, index);
        this.totalSize -= parseInt(this.formatSize(file.size));
        this.totalSizePercent = this.totalSize / 10;
    }

    onClearTemplatingUpload(clear) {
        clear();
        this.totalSize = 0;
        this.totalSizePercent = 0;
    }

    onTemplatedUpload() {
        this.messageService.add({
            severity: 'info',
            summary: 'Success',
            detail: 'File Uploaded',
            life: 3000,
        });
    }

    onSelectedFiles(event) {
        this.files = event.currentFiles;
        this.files.forEach((file) => {
            this.totalSize += parseInt(this.formatSize(file.size));
        });
        this.totalSizePercent = this.totalSize / 10;
    }

    async upload() {
        if (this.location && this.description) {
            const formData = new FormData();

            formData.append('location', this.location);
            formData.append(
                'entryDamageReportId',
                this.entryDamageReportId.toString()
            );
            formData.append('damageDetails', this.description);
            formData.append('status', ENTRYDAMAGEACTIONSTATUS.REPORTED);

            for (const file of this.files) {
                formData.append('files', file, file.name);
            }

            // Call the service to upload the form data
            this.entryDamageReportDataService
                .CreateEntryDamageReportItem(formData)
                .subscribe({
                    next: (res) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Damage report Item submitted successfully',
                        });
                        this.ref.close({
                            data: {
                                files: this.files,
                                location: this.location,
                                description: this.description,
                            },
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to submit damage report item',
                        });
                    },
                });
        } else {
            this.ref.close();
        }
    }

    formatSize(bytes) {
        const k = 1024;
        const dm = 3;
        const sizes = this.config.translation.fileSizeTypes;
        if (bytes === 0) {
            return `0 ${sizes[0]}`;
        }

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

        return `${formattedSize} ${sizes[i]}`;
    }
}
