import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DamageType } from 'src/app/core/constants/enums';
import { DamageItemService } from 'src/app/core/dataservice/damage-item/damage-item.dataservice';
import { CreateDamageItemDTO } from 'src/app/core/dataservice/damage-item/damage.item.dto';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';

@Component({
    selector: 'app-admin-lease-create-entry-damage-item-modal',
    templateUrl: './admin-lease-create-entry-damage-item-modal.component.html',
    styleUrls: ['./admin-lease-create-entry-damage-item-modal.component.css'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        FileUploadModule,
        InputNumberModule,
        DropdownModule,
        InputTextareaModule,
        CommonModule,
    ],
})
export class AdminLeaseCreateEntryDamageItemModalComponent implements OnInit {
    leaseAgreement: LeaseAgreeementDTO;

    damageItemForm: FormGroup;
    images: File[] = [];

    damageTypes = Object.values(DamageType);

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private ref: DynamicDialogRef,
        private damageItemService: DamageItemService,
        private config: DynamicDialogConfig
    ) {
        this.damageItemForm = this.fb.group({
            type: ['', Validators.required],
            title: ['', Validators.required],
            location: ['', Validators.required],
            description: ['', Validators.required],
        });

        if (!this.config.data.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Lease Agreement',
                detail: 'Please pass the lease agreement to the function call of the component',
            });
            this.ref.close();
        } else {
            this.leaseAgreement = this.config.data;
        }
    }
    ngOnInit() {}

    onUpload(event: any) {
        for (let file of event.files) {
            this.images.push(file);
        }
        this.messageService.add({
            severity: 'info',
            summary: 'File Selected',
            detail: 'Images Selected successfully',
        });
    }

    removeImage(file: FileUpload) {
        this.images = this.images.filter((img) => img.name !== file.name);
    }

    submit() {
        console.log(this.damageItemForm.errors, this.images);
        if (this.damageItemForm.invalid || this.images.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill out all fields and upload images.',
            });
            return;
        }

        const createDamageItem: CreateDamageItemDTO = {
            leaseAgreementId: this.leaseAgreement.id,
            type: this.damageItemForm.controls['type'].value,
            title: this.damageItemForm.controls['title'].value,
            location: this.damageItemForm.controls['location'].value,
            description: this.damageItemForm.controls['description'].value,
            images: this.images,
        };

        this.damageItemService
            .CreateEntryDamageItem(createDamageItem)
            .subscribe({
                next: (res) => {
                    this.ref.close({ status: 201 });
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Damage item created successfully.',
                    });
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.statusCode + ':' + err.error.message,
                    });
                },
            });
    }

    close() {
        this.ref.close();
    }
}
