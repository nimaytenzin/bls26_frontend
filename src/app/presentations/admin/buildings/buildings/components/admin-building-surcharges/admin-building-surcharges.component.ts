import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { BuildingSurchargeDataService } from 'src/app/core/dataservice/building/building-surcharge.data.service';

import {
    BuildingSurchargeDTO,
    CreateBuildingSurchargeDTO,
} from 'src/app/core/dto/properties/building-surcharge.dto';

@Component({
    selector: 'app-admin-building-surcharges',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        CommonModule,
        ButtonModule,
        DialogModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputNumberModule,
        InputTextModule,
        DropdownModule,
        CheckboxModule,
        TableModule,
        ToastModule,
        ConfirmDialogModule,
    ],
    providers: [ConfirmationService],
    templateUrl: './admin-building-surcharges.component.html',
    styleUrl: './admin-building-surcharges.component.scss',
})
export class AdminBuildingSurchargesComponent implements OnInit {
    constructor(
        private fb: FormBuilder,
        private buildingSurchargeDataService: BuildingSurchargeDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    @Input({
        required: true,
    })
    buildingId;
    isSubmitting: boolean = false;

    buildingCharges: BuildingSurchargeDTO[] = [];
    createBuildingSurchargeForm!: FormGroup;
    updateBuildingSurchargeForm!: FormGroup;

    showDeleteBuildingSurchargeModal = false;
    showAddSurchargeModal = false;
    showEditBuildingSurchargeModal = false;

    selectedSurcharge: BuildingSurchargeDTO;

    ngOnInit(): void {
        this.createBuildingSurchargeForm = this.fb.group({
            particular: [null, Validators.required],
            amount: [null, Validators.required],
        });
        this.updateBuildingSurchargeForm = this.fb.group({
            particular: [null, Validators.required],
            amount: [null, Validators.required],
        });
        this.getBuildingSurcharge();
    }

    openAddBuildingSurchargeModal() {
        this.showAddSurchargeModal = true;
    }

    openEditBuildingSurchargeModal(surcharge: BuildingSurchargeDTO) {
        this.showEditBuildingSurchargeModal = true;
        this.selectedSurcharge = surcharge;
        this.updateBuildingSurchargeForm.patchValue({
            ...surcharge,
        });
    }

    getBuildingSurcharge() {
        this.buildingSurchargeDataService
            .GetBuildingSurcharges({
                buildingId: this.buildingId,
            })
            .subscribe((res) => {
                this.buildingCharges = res;
            });
    }

    createBuildingSurcharge() {
        if (this.createBuildingSurchargeForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill out all required fields.',
            });
            return;
        }
        if (this.isSubmitting) {
            return;
        }
        const data: CreateBuildingSurchargeDTO = {
            particular:
                this.createBuildingSurchargeForm.controls['particular'].value,
            amount: Number(
                this.createBuildingSurchargeForm.controls['amount'].value
            ),
            buildingId: this.buildingId,
        };
        this.buildingSurchargeDataService
            .CreateBuildingSurcharge(this.createBuildingSurchargeForm.value)
            .subscribe({
                next: (res) => {
                    this.isSubmitting = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Added',
                        detail: 'Building Surcharge Added',
                    });
                    this.showAddSurchargeModal = false;
                    this.getBuildingSurcharge();
                },
                error: (err) => {
                    this.isSubmitting = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                },
            });
    }
    updateBuildingSurcharge() {
        if (this.updateBuildingSurchargeForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill out all required fields.',
            });
            return;
        }
        if (this.isSubmitting) {
            return;
        }
        const data: CreateBuildingSurchargeDTO = {
            particular:
                this.updateBuildingSurchargeForm.controls['particular'].value,
            amount: Number(
                this.updateBuildingSurchargeForm.controls['amount'].value
            ),
            buildingId: this.buildingId,
        };
        this.buildingSurchargeDataService
            .UpdateBuildingSurcharge(data, this.selectedSurcharge.id)
            .subscribe({
                next: (res) => {
                    this.isSubmitting = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Added',
                        detail: 'Building Surcharge Added',
                    });
                    this.getBuildingSurcharge();
                    this.showEditBuildingSurchargeModal = false;
                },
                error: (err) => {
                    this.isSubmitting = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                },
            });
    }

    openDeleteBuildingSurchargeModal(
        buildingSurcharge: BuildingSurchargeDTO,
        event: Event
    ) {
        this.selectedSurcharge = buildingSurcharge;
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Do you want to delete this record?',
            header: 'Delete Confirmation',
            icon: 'pi pi-info-circle',
            acceptButtonStyleClass: 'p-button-danger p-button-text',
            rejectButtonStyleClass: 'p-button-text p-button-text',
            acceptIcon: 'none',
            rejectIcon: 'none',
            accept: () => {
                this.buildingSurchargeDataService
                    .DeleteBuildingSurcharge(this.selectedSurcharge.id)
                    .subscribe((res) => {
                        if (res) {
                            this.getBuildingSurcharge();
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Confirmed',
                                detail: 'Record deleted',
                            });
                        }
                    });
            },
        });
    }
}
