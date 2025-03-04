import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
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
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { UnitRuleDataService } from 'src/app/core/dataservice/units/unit-rules.dataservice';
import {
    BuildingRuleDTO,
    CreateBuildingRuleDTO,
} from 'src/app/core/dto/properties/building-rule.dto';
import {
    CreateUnitRuleDTO,
    UnitRuleDTO,
} from 'src/app/core/dto/units/unit-rule.dto';

@Component({
    selector: 'app-admin-unit-rules-card',
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
    providers: [ConfirmationService, MessageService],
    templateUrl: './admin-unit-rules-card.component.html',
    styleUrl: './admin-unit-rules-card.component.scss',
})
export class AdminUnitRulesCardComponent {
    @Input({
        required: true,
    })
    unitId: number;

    constructor(
        private fb: FormBuilder,
        private unitRuleDataService: UnitRuleDataService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    unitRules: UnitRuleDTO[];

    createUnitRuleForm: FormGroup;
    updateUnitRuleForm: FormGroup;

    showUpdateUnitRuleModal = false;
    showCreateUnitRuleModal = false;

    selectedRule: UnitRuleDTO;

    ngOnInit(): void {
        this.createUnitRuleForm = this.fb.group({
            particular: [null, Validators.required],
        });
        this.updateUnitRuleForm = this.fb.group({
            particular: [null, Validators.required],
        });

        this.getUnitRules();
    }

    getUnitRules() {
        this.unitRuleDataService
            .GetUnitRules({
                unitId: this.unitId,
            })
            .subscribe((res) => {
                this.unitRules = res;
            });
    }

    createUnitRule() {
        const data: CreateUnitRuleDTO = {
            particular: this.createUnitRuleForm.controls['particular'].value,
            unitId: this.unitId,
        };
        this.unitRuleDataService.CreateUnitRule(data).subscribe({
            next: (res) => {
                if (res) {
                    this.getUnitRules();
                    this.showCreateUnitRuleModal = false;
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Confirmed',
                        detail: 'Record Added',
                    });
                }
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Confirmed',
                    detail: 'Record Added',
                });
            },
        });
    }
    updateUnitRule() {
        const data: CreateUnitRuleDTO = {
            particular: this.updateUnitRuleForm.controls['particular'].value,
            unitId: this.unitId,
        };
        this.unitRuleDataService
            .UpdateUnitRule(data, this.selectedRule.id)
            .subscribe((res) => {
                if (res) {
                    this.showUpdateUnitRuleModal = false;
                    this.getUnitRules();
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Updated',
                        detail: 'Record updated',
                    });
                }
            });
    }

    openCreateUnitRuleModal() {
        this.showCreateUnitRuleModal = true;
    }
    openUpdateUnitRuleModal(rule: UnitRuleDTO) {
        this.selectedRule = rule;
        this.showUpdateUnitRuleModal = true;
        this.updateUnitRuleForm.patchValue({
            ...this.selectedRule,
        });
    }

    openDeleteUnitRuleModal(unitRule: UnitRuleDTO, event: Event) {
        console.log(unitRule, event, 'DELETE UNIT R');
        this.selectedRule = unitRule;
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
                this.unitRuleDataService
                    .DeleteUnitRule(this.selectedRule.id)
                    .subscribe((res) => {
                        if (res) {
                            this.getUnitRules();
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
