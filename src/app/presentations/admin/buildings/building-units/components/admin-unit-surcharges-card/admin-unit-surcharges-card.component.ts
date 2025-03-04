import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
import { UnitSurchargeDataService } from 'src/app/core/dataservice/units/unit-surcharge.data.service';
import {
    BuildingSurchargeDTO,
    CreateBuildingSurchargeDTO,
} from 'src/app/core/dto/properties/building-surcharge.dto';
import {
    CreateUnitSurchargeDTO,
    UnitSurchargeDTO,
} from 'src/app/core/dto/units/unit-surcharge.dto';

@Component({
    selector: 'app-admin-unit-surcharges-card',
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
    providers: [ConfirmationService, MessageService],
    templateUrl: './admin-unit-surcharges-card.component.html',
    styleUrl: './admin-unit-surcharges-card.component.scss',
})
export class AdminUnitSurchargesCardComponent {
    @Input({
        required: true,
    })
    unitId: number;
    constructor(
        private fb: FormBuilder,
        private unitSurchargeDataServices: UnitSurchargeDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    unitSurcharges: UnitSurchargeDTO[] = [];

    createUnitSurchargeForm!: FormGroup;
    updateUnitSurchargeForm!: FormGroup;

    showDeleteSurchargeModal = false;
    showCreateSurchargeModal = false;
    showUpdateSurchargeModal = false;

    selectedSurcharge: BuildingSurchargeDTO;

    ngOnInit(): void {
        this.createUnitSurchargeForm = this.fb.group({
            particular: [, Validators.required],
            amount: [, Validators.required],
        });
        this.updateUnitSurchargeForm = this.fb.group({
            particular: [, Validators.required],
            amount: [, Validators.required],
        });
        this.getSurcharge();
    }

    openCreateUnitSurchargeModal() {
        this.showCreateSurchargeModal = true;
    }
    openUpdateUnitSurchargeModal() {
        this.showUpdateSurchargeModal = true;
    }

    openDeleteUnitSurchargeModal(
        surcharge: BuildingSurchargeDTO,
        event: Event
    ) {
        this.selectedSurcharge = surcharge;
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
                this.unitSurchargeDataServices
                    .DeleteUnitSurcharge(this.selectedSurcharge.id)
                    .subscribe((res) => {
                        if (res) {
                            this.getSurcharge();
                            this.messageService.add({
                                severity: 'info',
                                summary: 'Confirmed',
                                detail: 'Record deleted',
                            });
                        }
                    });
            },
            reject: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Cancelled',
                    detail: 'You have rejected',
                });
            },
        });
    }

    openEditBuildingSurchargeModal(surcharge: BuildingSurchargeDTO) {
        this.showUpdateSurchargeModal = true;
        this.selectedSurcharge = surcharge;
        this.updateUnitSurchargeForm.patchValue({
            ...surcharge,
        });
    }

    getSurcharge() {
        this.unitSurchargeDataServices
            .GetUnitSurcharges({
                unitId: this.unitId,
            })
            .subscribe((res) => {
                this.unitSurcharges = res;
            });
    }

    createUnitSurcharge() {
        const data: CreateUnitSurchargeDTO = {
            particular:
                this.createUnitSurchargeForm.controls['particular'].value,
            amount: Number(
                this.createUnitSurchargeForm.controls['amount'].value
            ),
            unitId: this.unitId,
        };
        this.unitSurchargeDataServices
            .CreateUnitSurcharge(data)
            .subscribe((res) => {
                this.showCreateSurchargeModal = false;
                this.getSurcharge();
                this.messageService.add({
                    severity: 'info',
                    summary: 'Added',
                    detail: 'Record added',
                });
            });
    }
    updateUnitSurcharge() {
        const data: CreateUnitSurchargeDTO = {
            particular:
                this.updateUnitSurchargeForm.controls['particular'].value,
            amount: Number(
                this.updateUnitSurchargeForm.controls['amount'].value
            ),
            unitId: this.unitId,
        };

        this.unitSurchargeDataServices
            .UpdateUnitSurcharge(data, this.selectedSurcharge.id)
            .subscribe({
                next: (res) => {
                    if (res) {
                        this.getSurcharge();
                        this.showUpdateSurchargeModal = false;
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Updated',
                            detail: 'Record updated',
                        });
                    }
                },
            });
    }
    //     console.log(data);
    //     this.buildingSurchargeDataService
    //         .UpdateBuildingSurcharge(data, this.selectedSurcharge.id)
    //         .subscribe({
    //             next: (res) => {
    //                 this.getBuildingSurcharge();
    //                 this.showEditBuildingSurchargeModal = false;
    //             },
    //             error: (err) => {
    //                 console.log(err);
    //             },
    //         });
    // }
}
