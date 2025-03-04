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
    selector: 'app-owner-building-surcharge-card',
    templateUrl: './owner-building-surcharge-card.component.html',
    styleUrls: ['./owner-building-surcharge-card.component.scss'],
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
})
export class OwnerBuildingSurchargeCardComponent implements OnInit {
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

    buildingCharges: BuildingSurchargeDTO[] = [];
    createBuildingSurchargeForm!: FormGroup;
    updateBuildingSurchargeForm!: FormGroup;

    showDeleteBuildingSurchargeModal = false;
    showAddSurchargeModal = false;
    showEditBuildingSurchargeModal = false;

    selectedSurcharge: BuildingSurchargeDTO;

    ngOnInit(): void {
        this.createBuildingSurchargeForm = this.fb.group({
            particular: [, Validators.required],
            amount: [, Validators.required],
            buildingId: [this.buildingId],
        });
        this.updateBuildingSurchargeForm = this.fb.group({
            particular: [, Validators.required],
            amount: [, Validators.required],
            buildingId: [this.buildingId],
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
            .subscribe((res) => {
                this.showAddSurchargeModal = false;
                this.getBuildingSurcharge();
            });
    }
    updateBuildingSurcharge() {
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
                    this.getBuildingSurcharge();
                    this.showEditBuildingSurchargeModal = false;
                },
                error: (err) => {
                    console.log(err);
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
            reject: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Cancelled',
                    detail: 'You have rejected',
                });
            },
        });
    }
}
