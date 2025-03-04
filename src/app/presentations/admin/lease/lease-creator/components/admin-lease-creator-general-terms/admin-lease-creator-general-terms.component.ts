import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { AREAUNITS, LEASETYPE, LEASEUSES } from 'src/app/core/constants/enums';
import { BankAccountDto } from 'src/app/core/dataservice/bankaccounts/bankaccount.dto';
import { BankAccountDataService } from 'src/app/core/dataservice/bankaccounts/bankaccounts.dataservice';
import {
    LeaseCreateState_LeasePurposeAndChargesDTO,
    LeaseCreateState_PropertySelectionStateDTO,
    LeaseCreatorStateService,
} from 'src/app/core/dataservice/lease/create-lease.dataservice';
import { LeaseSurchargeDTO } from 'src/app/core/dataservice/lease/lease-surcharge.dto';
import { AuthService } from 'src/app/core/dataservice/users-and-auth/auth.service';
import { GETMONTHDIFF } from 'src/app/core/utility/date.helper';

@Component({
    selector: 'app-admin-lease-creator-general-terms',
    templateUrl: './admin-lease-creator-general-terms.component.html',
    styleUrls: ['./admin-lease-creator-general-terms.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        CalendarModule,
        DropdownModule,
        FormsModule,
        DividerModule,
        TableModule,
        DialogModule,
        ReactiveFormsModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputNumberModule,
        InputTextareaModule,
        InputTextModule,
        ConfirmPopupModule,
    ],
    providers: [ConfirmationService],
})
export class AdminLeaseCreatorGeneralTermsComponent implements OnInit {
    propertyDetails: LeaseCreateState_PropertySelectionStateDTO = {
        unit: undefined,
        building: undefined,
        plot: undefined,
        leaseType: LEASETYPE.LAND,
        leaseStartDate: undefined,
        leaseEndDate: undefined,
    };

    leaseTypeEnum = LEASETYPE;
    areaUnits = Object.values(AREAUNITS);
    selectedAreaUnit: AREAUNITS = AREAUNITS.SQFT;

    showAddLeaseChargeForm: boolean = false;
    createLeaseChargeForm: FormGroup;
    ownerBankAccounts: BankAccountDto[] = [];
    selectedOwnerBankAccount;

    uses = Object.values(LEASEUSES);

    selectedUse: LEASEUSES = LEASEUSES.RESIDENTIAL;
    rent: number;
    securityDepositAmount: number;
    ratePerArea: number;
    areaLeased: number;

    leaseCharges: LeaseSurchargeDTO[] = [];
    calculateMonthsDifference = GETMONTHDIFF;

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private bankAccountDataService: BankAccountDataService,
        private authService: AuthService,
        private router: Router,
        private leaseCreatorStateService: LeaseCreatorStateService
    ) {
        this.leaseCreatorStateService.propertySelection$.subscribe((res) => {
            if (res) {
                this.propertyDetails = res;
            } else {
                this.router.navigate(['admin/master-lease/create/property']);
            }
        });
        this.createLeaseChargeForm = this.fb.group({
            particular: [null],
            amount: [null],
        });
    }

    ngOnInit() {
        this.bankAccountDataService
            .GetAllBankAccountsByAdmin(
                this.authService.GetCurrentRole().adminId
            )
            .subscribe({
                next: (res) => {
                    this.ownerBankAccounts = res;
                    console.log(res);
                },
            });
    }

    getTotalMonthlyPayabe() {
        if (!this.rent) return 0;
        let total = Number(this.rent);
        this.leaseCharges.forEach((item) => {
            total += item.amount;
        });
        return total;
    }

    openCreateLeaseSurchargeModal() {
        this.showAddLeaseChargeForm = true;
    }

    createLeaseCharge() {
        this.leaseCharges.push({
            particular: this.createLeaseChargeForm.controls['particular'].value,
            amount: this.createLeaseChargeForm.controls['amount'].value,
            origin: 'Agreement',
        });
        this.showAddLeaseChargeForm = false;
    }

    deleteCharge(event, selectedLeaseCharge) {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Delete Charge?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.leaseCharges = this.leaseCharges.filter((item) => {
                    return !(
                        item.particular === selectedLeaseCharge.particular &&
                        item.amount === selectedLeaseCharge.amount
                    );
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

    checkDataValid(): boolean {
        if (this.propertyDetails.leaseType === LEASETYPE.LAND) {
            if (
                this.rent &&
                this.securityDepositAmount &&
                this.selectedOwnerBankAccount &&
                this.areaLeased &&
                this.areaUnits &&
                this.ratePerArea
            ) {
                return true;
            }
        } else {
            if (
                this.rent &&
                this.securityDepositAmount &&
                this.selectedOwnerBankAccount
            ) {
                return true;
            }
        }
        return false;
    }
    checkDataValidAndThrowError(): boolean {
        const missingFields: string[] = [];

        if (this.propertyDetails.leaseType === LEASETYPE.LAND) {
            if (!this.rent) missingFields.push('Rent');
            if (!this.securityDepositAmount)
                missingFields.push('Security Deposit Amount');
            if (!this.selectedOwnerBankAccount)
                missingFields.push('Owner Bank Account');
            if (!this.areaLeased) missingFields.push('Area Leased ');
            if (!this.areaUnits) missingFields.push('Area Units');
            if (!this.ratePerArea) missingFields.push('Rate Per Area');
        } else {
            if (!this.rent) missingFields.push('Rent');
            if (!this.securityDepositAmount)
                missingFields.push('Security Deposit Amount');
            if (!this.selectedOwnerBankAccount)
                missingFields.push('Owner Bank Account');
        }

        if (missingFields.length > 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Input',
                detail: `Please provide the following: ${missingFields.join(
                    ', '
                )}`,
                life: 3000,
            });
            return false;
        }
        return true;
    }

    saveAndProceed() {
        if (this.checkDataValidAndThrowError()) {
            let data: LeaseCreateState_LeasePurposeAndChargesDTO = {
                selectedUse: this.selectedUse,
                rent: this.rent,
                securityDepositAmount: this.securityDepositAmount,
                ratePerArea: this.ratePerArea,
                areaLeased: this.areaLeased,
                areaUnit: AREAUNITS.SQFT,
                selectedBankAcccount: this.selectedOwnerBankAccount,
                leaseCharges: this.leaseCharges,
            };
            this.leaseCreatorStateService.setLeasePurposeAndCharge(data);
            this.router.navigate(['admin/master-lease/create/detailed-terms']);
        }
    }
}
