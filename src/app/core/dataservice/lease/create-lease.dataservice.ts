import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { Router } from '@angular/router';
import { BuildingDTO } from '../../dto/properties/building.dto';
import { PlotDTO } from '../land/dto/plot.dto';
import { UnitDTO } from '../../dto/units/unit.dto';
import {
    AREAUNITS,
    LEASETYPE,
    LEASEUSES,
    LESSEETYPE,
    LESSORTYPE,
} from '../../constants/enums';
import { UserDTO } from '../users-and-auth/dto/user.dto';
import { OrganiztionDTO } from '../organization/organization.dto';
import { LeaseSurchargeDTO } from './lease-surcharge.dto';
import { LeaseRuleDTO } from './lease-rule.dto';
import { BankAccountDto } from '../bankaccounts/bankaccount.dto';

export interface LeaseCreateState_PropertySelectionStateDTO {
    unit: UnitDTO | null;
    building: BuildingDTO | null;
    plot: PlotDTO;
    leaseType: LEASETYPE;
    leaseStartDate: Date;
    leaseEndDate: Date;
}

export interface LeaseCreateState_TenantSelectionStateDTO {
    lessorType: LESSORTYPE | null;
    lesseeType: LESSEETYPE | null;
    tenant: UserDTO | null;
    organization: OrganiztionDTO | null;
}

export interface LeaseCreateState_LeasePurposeAndChargesDTO {
    selectedUse: LEASEUSES | null;
    rent: number | null;
    securityDepositAmount: number | null;
    areaLeased: number | null;
    ratePerArea: number | null;
    areaUnit: AREAUNITS | null;
    leaseCharges: LeaseSurchargeDTO[];
    selectedBankAcccount: BankAccountDto | null;
}

export interface LeaseCreateState_LeaseTermsDTO {
    tenantSubletAuthority: boolean | null;
    ownerPrematureTermination: boolean | null;
    tenantPrematureTermination: boolean | null;
    paymentDueDay: number | null;
    rentIncreaseNoticePeriod: number | null;
    vacationNoticePeriod: number | null;
    evictionNoticePeriod: number | null;
    penaltyPercentagePerAnnum: number | null;
    rentIncrementPercentage: number | null;
    rentIncrementDurationYear: number | null;
    leaseRules: LeaseRuleDTO[] | null;
}
@Injectable({
    providedIn: 'root',
})
export class LeaseCreatorStateService {
    private propertySelectionSource =
        new BehaviorSubject<LeaseCreateState_PropertySelectionStateDTO | null>(
            null
        );

    private tenantSelectionSource =
        new BehaviorSubject<LeaseCreateState_TenantSelectionStateDTO | null>(
            null
        );

    private leasePurposeAndChargeSource =
        new BehaviorSubject<LeaseCreateState_LeasePurposeAndChargesDTO | null>(
            null
        );

    private leaseTermsSource =
        new BehaviorSubject<LeaseCreateState_LeaseTermsDTO | null>(null);

    propertySelection$ = this.propertySelectionSource.asObservable();
    tenantSelection$ = this.tenantSelectionSource.asObservable();
    leasePurposeAndCharge$ = this.leasePurposeAndChargeSource.asObservable();
    leaseTerms$ = this.leaseTermsSource.asObservable();

    setPropertySelection(data: LeaseCreateState_PropertySelectionStateDTO) {
        this.propertySelectionSource.next(data);
    }
    setTenantSelection(data: LeaseCreateState_TenantSelectionStateDTO) {
        this.tenantSelectionSource.next(data);
    }

    setLeasePurposeAndCharge(data: LeaseCreateState_LeasePurposeAndChargesDTO) {
        this.leasePurposeAndChargeSource.next(data);
    }
    setLeaseTerms(data: LeaseCreateState_LeaseTermsDTO) {
        this.leaseTermsSource.next(data);
    }

    clearState() {
        this.propertySelectionSource.next(null);
        this.tenantSelectionSource.next(null);
        this.leasePurposeAndChargeSource.next(null);
        this.leaseTermsSource.next(null);
    }
}
