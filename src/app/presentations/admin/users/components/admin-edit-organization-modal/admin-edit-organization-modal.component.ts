import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormGroup,
    FormBuilder,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import {
    ORGANIZATIONTYPES,
    ORGANIZATIONUSERTYPES,
} from 'src/app/core/constants/enums';
import { OrganizationDataService } from 'src/app/core/dataservice/organization/organization.dataservice';
import {
    CreateOrganizationDTO,
    OrganiztionDTO,
    UpdateOrganizationDTO,
} from 'src/app/core/dataservice/organization/organization.dto';

@Component({
    selector: 'app-admin-edit-organization-modal',
    templateUrl: './admin-edit-organization-modal.component.html',
    styleUrls: ['./admin-edit-organization-modal.component.css'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CommonModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        ConfirmDialogModule,
    ],
    providers: [ConfirmationService],
})
export class AdminEditOrganizationModalComponent implements OnInit {
    updateOrganizationForm: FormGroup;
    organizationTypes = Object.values(ORGANIZATIONTYPES);
    userTypes = Object.values(ORGANIZATIONUSERTYPES);

    organization: OrganiztionDTO | null;

    constructor(
        private organizationDataService: OrganizationDataService,
        private fb: FormBuilder,
        private config: DynamicDialogConfig,
        private messageService: MessageService,
        private ref: DynamicDialogRef,
        private confirmationService: ConfirmationService
    ) {
        const passedData = this.config.data;
        if (!passedData.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Required Field',
                detail: 'Organization must be passed when invoking this component',
            });
            this.ref.close();
        }
        this.organization = passedData;
        this.updateOrganizationForm = this.fb.group({
            type: ['', Validators.required],
            userType: ['', Validators.required],
            name: ['', Validators.required],
            licenseNumber: [''],
        });
        this.updateOrganizationForm.patchValue({
            ...this.organization,
        });
    }

    ngOnInit() {}

    updateOrganization() {
        if (this.updateOrganizationForm.valid) {
            const newData: UpdateOrganizationDTO = {
                type: this.updateOrganizationForm.controls['type'].value,
                userType:
                    this.updateOrganizationForm.controls['userType'].value,
                name: this.updateOrganizationForm.controls['name'].value,
                licenseNumber:
                    this.updateOrganizationForm.controls['licenseNumber'].value,
            };

            this.organizationDataService
                .AdminUpdateOrganization(newData, this.organization.id)
                .subscribe({
                    next: (res) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Organization Updated',
                            detail: ' Organization ' + res.name + ' updated.',
                        });
                        this.ref.close({ status: 200 });
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
    deleteOrganization() {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Are you sure that you want to delete?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptIcon: 'none',
            rejectIcon: 'none',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.organizationDataService
                    .AdminDeleteOrganization(this.organization.id)
                    .subscribe((res) => {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Confirmed',
                            detail: 'Deleted',
                        });
                        this.ref.close({ status: 200 });
                    });
            },
        });
    }
    close() {
        this.ref.close();
    }
}
