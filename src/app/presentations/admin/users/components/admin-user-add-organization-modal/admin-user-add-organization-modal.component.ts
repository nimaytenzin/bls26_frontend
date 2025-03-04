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
import { InputTextModule } from 'primeng/inputtext';
import {
    ORGANIZATIONTYPES,
    ORGANIZATIONUSERTYPES,
} from 'src/app/core/constants/enums';
import { OrganizationDataService } from 'src/app/core/dataservice/organization/organization.dataservice';
import { CreateOrganizationDTO } from 'src/app/core/dataservice/organization/organization.dto';

@Component({
    selector: 'app-admin-user-add-organization-modal',
    templateUrl: './admin-user-add-organization-modal.component.html',
    styleUrls: ['./admin-user-add-organization-modal.component.css'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        DropdownModule,
        InputTextModule,
        CommonModule,
        ButtonModule,
    ],
})
export class AdminUserAddOrganizationModalComponent implements OnInit {
    createOrganizationForm: FormGroup;
    organizationTypes = Object.values(ORGANIZATIONTYPES);
    userTypes = Object.values(ORGANIZATIONUSERTYPES);

    userId: number | null = null;
    constructor(
        private organizationDataService: OrganizationDataService,
        private fb: FormBuilder,
        private config: DynamicDialogConfig,
        private messageService: MessageService,
        private ref: DynamicDialogRef
    ) {
        const passedUserId = this.config.data.userId;
        if (!passedUserId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Required Field',
                detail: 'User ID must be passed when invoking this component',
            });
            this.ref.close();
        }
        this.userId = passedUserId;
        this.createOrganizationForm = this.fb.group({
            type: ['', Validators.required],
            userType: ['', Validators.required],
            name: ['', Validators.required],
            licenseNumber: [''],
        });
    }

    ngOnInit() {}

    createOrganization() {
        if (this.createOrganizationForm.valid) {
            const newData: CreateOrganizationDTO = {
                userId: Number(this.userId),
                type: this.createOrganizationForm.controls['type'].value,
                userType:
                    this.createOrganizationForm.controls['userType'].value,
                name: this.createOrganizationForm.controls['name'].value,
                licenseNumber:
                    this.createOrganizationForm.controls['licenseNumber'].value,
            };

            this.organizationDataService
                .AdminCreateOrganization(newData)
                .subscribe({
                    next: (res) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Organization Added',
                            detail: 'New Organization ' + res.name + ' added',
                        });
                        this.ref.close({ status: 201 });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.error.message,
                        });
                        this.ref.close();
                    },
                });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Form Validation Error',
                detail: 'Please check all the Form Inputs',
            });
        }
    }
    close() {
        this.ref.close();
    }
}
