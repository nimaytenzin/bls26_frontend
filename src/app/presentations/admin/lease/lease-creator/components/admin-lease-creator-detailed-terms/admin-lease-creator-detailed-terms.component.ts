import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { LeaseRuleDTO } from 'src/app/core/dataservice/lease/lease-rule.dto';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Router } from '@angular/router';
import {
    LeaseCreateState_LeaseTermsDTO,
    LeaseCreatorStateService,
} from 'src/app/core/dataservice/lease/create-lease.dataservice';

@Component({
    selector: 'app-admin-lease-creator-detailed-terms',
    templateUrl: './admin-lease-creator-detailed-terms.component.html',
    styleUrls: ['./admin-lease-creator-detailed-terms.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        RadioButtonModule,
        InputNumberModule,
        ButtonModule,
        TableModule,
        FormsModule,
        InputTextModule,
        SelectButtonModule,
        DividerModule,
        DialogModule,
        ReactiveFormsModule,
        InputTextareaModule,
        ConfirmPopupModule,
    ],
    providers: [ConfirmationService],
})
export class AdminLeaseCreatorDetailedTermsComponent implements OnInit {
    yesNoOptions = [
        {
            name: 'Yes',
            value: true,
        },
        {
            name: 'No',
            value: false,
        },
    ];
    showAddLeaseRuleForm: boolean = false;
    createLeaseRuleForm: FormGroup;

    tenantSubletAuthority: boolean = true;
    ownerPrematureTermination: boolean = false;
    tenantPrematureTermination: boolean = false;
    paymentDueDay: number = 10;
    rentIncreaseNoticePeriod: number = 2;
    vacationNoticePeriod: number = 2;
    evictionNoticePeriod: number = 2;
    penaltyPercentagePerAnnum: number = 24;
    rentIncrementPercentage: number = 10;
    rentIncrementDurationYear: number = 2;
    leaseRules: LeaseRuleDTO[] = [];

    constructor(
        private fb: FormBuilder,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router,
        private leaseCreatorStateService: LeaseCreatorStateService
    ) {
        this.createLeaseRuleForm = this.fb.group({
            particular: [null],
        });
    }

    ngOnInit() {}

    openCreateLeaseRuleModal() {
        this.showAddLeaseRuleForm = true;
    }

    createLeaseRule() {
        this.leaseRules.push({
            particular: this.createLeaseRuleForm.controls['particular'].value,
            origin: 'Agreement',
        });
        this.showAddLeaseRuleForm = false;
    }

    deleteRule(event, selectedLeaseRule) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Delete Rule?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.leaseRules = this.leaseRules.filter((item) => {
                    return !(item.particular === selectedLeaseRule.particular);
                });
                this.messageService.add({
                    severity: 'info',
                    summary: 'Confirmed',
                    detail: 'Removed',
                    life: 3000,
                });
            },
        });
    }

    saveAndProceed() {
        let data: LeaseCreateState_LeaseTermsDTO = {
            tenantSubletAuthority: this.tenantSubletAuthority,
            ownerPrematureTermination: this.ownerPrematureTermination,
            tenantPrematureTermination: this.tenantPrematureTermination,
            paymentDueDay: this.paymentDueDay,
            vacationNoticePeriod: this.vacationNoticePeriod,
            evictionNoticePeriod: this.evictionNoticePeriod,
            penaltyPercentagePerAnnum: this.penaltyPercentagePerAnnum,
            rentIncrementPercentage: this.rentIncreaseNoticePeriod,
            rentIncrementDurationYear: this.rentIncrementDurationYear,
            rentIncreaseNoticePeriod: this.rentIncreaseNoticePeriod,
            leaseRules: this.leaseRules,
        };
        this.leaseCreatorStateService.setLeaseTerms(data);
        this.router.navigate(['admin/master-lease/create/finalize']);
    }
}
