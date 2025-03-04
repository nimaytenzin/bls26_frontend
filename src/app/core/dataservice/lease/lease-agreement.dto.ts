import {
    LEASESTATUS,
    LEASETYPE,
    LEASEUSES,
    LESSEETYPE,
    LESSORTYPE,
} from '../../constants/enums';
import { PaymentAdviceDto } from '../../dto/payments/payment-advice.dto';
import { BuildingDTO } from '../../dto/properties/building.dto';
import { UnitDTO } from '../../dto/units/unit.dto';
import { AdminDTO } from '../../dto/users/admin.dto';
import { LandLordDTO } from '../../dto/users/landlord.dto';
import { TenantDTO } from '../../dto/users/tenant.dto';
import { BankAccountDto } from '../bankaccounts/bankaccount.dto';
import { PlotDTO } from '../land/dto/plot.dto';
import { OrganiztionDTO } from '../organization/organization.dto';
import { OwnerDTO } from '../owners/dto/owner.dto';
import { UserDTO } from '../users-and-auth/dto/user.dto';
import { LeaseRuleDTO } from './lease-rule.dto';
import { LeaseSurchargeDTO } from './lease-surcharge.dto';

export interface LeaseAgreeementDTO {
    id: number;
    type: LEASETYPE;
    adminId: number;

    bankAccountId: number;
    bankAccount: BankAccountDto;

    status: LEASESTATUS;
    lesseeType: LESSEETYPE;
    lessorType: LESSORTYPE;

    entryDamageReportSubmitted: boolean;
    securityDepositPaid: boolean;

    leaseDurationMonths: number;
    leaseStartDate: string;
    leaseSigningDate: string;
    leaseModificationDate: string;
    leaseModificationRemarks: string;
    leaseEndDate: string;

    plotId: number;
    plot: PlotDTO;

    tenantId: number;
    tenant: UserDTO;

    organizationId?: number;
    organization?: OrganiztionDTO;
    buildingId?: number;
    building?: BuildingDTO;
    unitId?: number;
    unit?: UnitDTO;

    rent: number;
    use: LEASEUSES;

    securityDepositAmount: string;
    paymentDueDay: number;
    applyLatePaymentFee: boolean;

    tenantSubletAuthority: boolean;
    tenantPrematureTermination: boolean;
    ownerPrematureTermination: boolean;

    vacationNoticePeriod: number;
    evictionNoticePeriod: number;
    rentIncreaseNoticePeriod: number;

    penaltyPercentagePerAnnum: number;
    rentIncrementPercentage: number;
    rentIncrementDurationYear: number;

    areaLeased?: number;
    areaUnit?: string;
    ratePerArea?: number;

    leaseSurcharges: LeaseSurchargeDTO[];
    leaseRules: LeaseRuleDTO[];
    paymentAdvises?: PaymentAdviceDto[];
}

export interface CreateLeaseAgreementDTO {
    type: LEASETYPE;
    bankAccountId: number;

    adminId: number;

    status: LEASESTATUS;
    lesseeType: LESSEETYPE;
    lessorType: LESSORTYPE;

    entryDamageReportSubmitted: boolean;
    securityDepositPaid: boolean;

    leaseDurationMonths: number;
    leaseStartDate: string;
    leaseEndDate: string;

    plotId: number;
    tenantId: number;
    organizationId?: number;

    buildingId?: number;
    unitId?: number;

    rent: number;
    use: LEASEUSES;

    securityDepositAmount: number;
    paymentDueDay: number;
    applyLatePaymentFee: boolean;

    tenantSubletAuthority: boolean;
    tenantPrematureTermination: boolean;
    ownerPrematureTermination: boolean;

    vacationNoticePeriod: number;
    evictionNoticePeriod: number;
    rentIncreaseNoticePeriod: number;

    penaltyPercentagePerAnnum: number;
    rentIncrementPercentage: number;
    rentIncrementDurationYear: number;

    areaLeased?: number;
    areaUnit?: string;
    ratePerArea?: number;

    leaseSurcharges: LeaseSurchargeDTO[];
    leaseRules: LeaseRuleDTO[];
}

export interface LeaseModificationDTO {
    leaseModificationRemarks: string;
    leaseModificationDate: string;
    leaseAgreementId: number;
}

interface MonthlyPaymentStatusI {
    month: number;
    leaseAgreements: LeaseAgreeementDTO[];
}
export interface LandLeasePaymentStatusDTO {
    plotId: string;
    monthlyStatus: MonthlyPaymentStatusI[];
}

export interface UnitLeasePaymentStatusDTO {
    unit: UnitDTO;
    monthlyStatus: MonthlyPaymentStatusI[];
}

export interface BuildingLeasePaymentStatusDTO {
    building: BuildingDTO;
    monthlyStatus: MonthlyPaymentStatusI[];
}

//Property availablity Checker
export interface PropertyLeaseAvailabiltyCheckerDTO {
    leaseType: LEASETYPE;
    plotId: number;
    buildingId: number;
    unitId: number;
    leaseStartDate: Date;
    leaseEndDate: Date;
}

export interface PropertyLeaseAvailabilityCheckerReturnDTO {
    available: boolean;
    message: string;
    conflictingLeases: LeaseAgreeementDTO[] | null;
}

//property overdue calaculator
export interface PropertyLeaseOverDueCalculatorDTO {
    leaseType: LEASETYPE;
    plotId: number;
    buildingId: number;
    unitId: number;
}

export interface PropertyLeaseOverDueReturnDTO {
    totalOverDue: number;
    pendingPaymentAdvices: PaymentAdviceDto[];
}

//lease agreement attachment
export interface LeaseAgreementAttachmentDTO {
    leaseAgreementId: number;
    uri: string;
    type: string;
}
