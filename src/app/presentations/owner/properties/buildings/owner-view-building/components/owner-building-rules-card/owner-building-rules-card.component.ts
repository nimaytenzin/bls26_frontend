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
    selector: 'app-owner-building-rules-card',
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
    templateUrl: './owner-building-rules-card.component.html',
    styleUrl: './owner-building-rules-card.component.scss',
})
export class OwnerBuildingRulesCardComponent {
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
            buildingId: this.buildingId,
        });
        this.updateBuildingRuleForm = this.fb.group({
            particular: [null, Validators.required],
            buildingId: this.buildingId,
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
        const createBuildingRuleData: CreateBuildingRuleDTO = {
            particular:
                this.createBuildingRuleForm.controls['particular'].value,
            buildingId: this.buildingId,
        };

        this.buildingRulesDataService
            .CreateBuildingRule(createBuildingRuleData)
            .subscribe({
                next: (res) => {
                    if (res.id) {
                        this.getBuildingRules();
                        this.showAddBuildingRuleModal = false;
                    }
                },
                error: (err) => {
                    console.log(err);
                },
            });
    }
    updateBuildingRule() {
        const createBuildingRuleData: CreateBuildingRuleDTO = {
            particular:
                this.updateBuildingRuleForm.controls['particular'].value,
            buildingId: this.buildingId,
        };

        this.buildingRulesDataService
            .UpdateBuildingRule(
                createBuildingRuleData,
                this.selectedBuildingRule.id
            )
            .subscribe({
                next: (res) => {
                    if (res) {
                        this.getBuildingRules();
                        this.showUpdateBuildingRuleModal = false;
                    }
                },
                error: (err) => {
                    console.log(err);
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
