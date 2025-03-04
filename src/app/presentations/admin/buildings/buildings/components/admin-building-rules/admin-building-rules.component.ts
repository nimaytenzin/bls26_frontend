import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
    ReactiveFormsModule,
    FormBuilder,
    Validators,
    FormGroup,
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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { BuildingRulesDataService } from 'src/app/core/dataservice/building/building-rules.dataservice';
import { BuildingSurchargeDataService } from 'src/app/core/dataservice/building/building-surcharge.data.service';
import {
    BuildingRuleDTO,
    CreateBuildingRuleDTO,
} from 'src/app/core/dto/properties/building-rule.dto';
import { BuildingSurchargeDTO } from 'src/app/core/dto/properties/building-surcharge.dto';

@Component({
    selector: 'app-admin-building-rules',
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
        InputTextareaModule,
        ToastModule,
        ConfirmDialogModule,
    ],
    providers: [ConfirmationService],
    templateUrl: './admin-building-rules.component.html',
    styleUrl: './admin-building-rules.component.scss',
})
export class AdminBuildingRulesComponent {
    constructor(
        private fb: FormBuilder,
        private buildingRulesDataService: BuildingRulesDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    @Input({
        required: true,
    })
    buildingId;

    isSubmitting: boolean = false;

    buildingRules: BuildingRuleDTO[] = [];
    createBuildingRuleForm: FormGroup;
    updateBuildingRuleForm: FormGroup;

    showDeleteBuildingRuleModal = false;
    showUpdateBuildingRuleModal = false;
    showAddBuildingRuleModal = false;

    selectedBuildingRule: BuildingRuleDTO;

    ngOnInit(): void {
        this.createBuildingRuleForm = this.fb.group({
            particular: [null, Validators.required],
        });
        this.updateBuildingRuleForm = this.fb.group({
            particular: [null, Validators.required],
        });

        this.getBuildingRules();
    }

    getBuildingRules() {
        this.buildingRulesDataService
            .GetBuildingRules({
                buildingId: this.buildingId,
            })
            .subscribe((res) => {
                this.buildingRules = res;
            });
    }

    createBuildingRule() {
        if (this.createBuildingRuleForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill out all required fields.',
            });
            return;
        }

        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const createBuildingRuleData: CreateBuildingRuleDTO = {
            particular:
                this.createBuildingRuleForm.controls['particular'].value,
            buildingId: this.buildingId,
        };

        this.buildingRulesDataService
            .CreateBuildingRule(createBuildingRuleData)
            .subscribe({
                next: (res) => {
                    this.isSubmitting = false;
                    this.getBuildingRules();
                    this.showAddBuildingRuleModal = false;
                    this.createBuildingRuleForm.reset();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Added',
                        detail: 'Building Rule Added',
                    });
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
    updateBuildingRule() {
        if (this.updateBuildingRuleForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill out all required fields.',
            });
            return;
        }

        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const updateData = {
            particular:
                this.updateBuildingRuleForm.controls['particular'].value,
            buildingId: this.buildingId,
        };

        this.buildingRulesDataService
            .UpdateBuildingRule(updateData, this.selectedBuildingRule.id)
            .subscribe({
                next: () => {
                    this.isSubmitting = false;
                    this.getBuildingRules();
                    this.showUpdateBuildingRuleModal = false;
                    this.updateBuildingRuleForm.reset();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Updated',
                        detail: 'Building Rule Updated',
                    });
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

    openCreateBuildingRuleModal() {
        this.showAddBuildingRuleModal = true;
    }
    openUpdateBuildingRuleModal(buildingRule: BuildingRuleDTO) {
        this.updateBuildingRuleForm.patchValue({
            ...buildingRule,
        });
        this.selectedBuildingRule = buildingRule;
        this.showUpdateBuildingRuleModal = true;
    }
    openDeleteBuildingRuleModal(buildingRule: BuildingRuleDTO, event: Event) {
        console.log('ok');
        this.selectedBuildingRule = buildingRule;
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
                this.buildingRulesDataService
                    .DeleteBuildingRules(this.selectedBuildingRule.id)
                    .subscribe((res) => {
                        if (res) {
                            this.getBuildingRules();
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
