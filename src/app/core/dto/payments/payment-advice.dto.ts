import { PAType } from 'src/app/core/constants/enums';
import { UnitDTO } from '../units/unit.dto';
import { TenantDTO } from '../users/tenant.dto';
import { LeaseAgreeementDTO } from 'src/app/core/dataservice/lease/lease-agreement.dto';
import { PaymentReceiptDTO } from './payment-receipt-dto';

export interface CreatePaymentAdviceItemDto {
    paymentAdviseId?: number;
    particular: string;
    amount: number;
}

export interface CreatePaymentAdviceDto {
    unitId: number;
    buildingId: number;
    tenantId: number;
    leaseAgreementId: number;
    ownerId: number;
    title: string;
    month: number;
    year: number;
    totalAmount: number;
    amountDue: number;
    status: string;
    paymentAdviseItem: CreatePaymentAdviceItemDto[];
}

export interface PaymentAdviceItemDto {
    id: number;
    paymentAdviseId: number;
    particular: string;
    amount: number;
}

export interface PaymentAdviceDto {
    id: number;
    type: PAType;
    leaseAgreementId: number;

    title: string;
    month: number;
    year: number;

    totalAmount: number;
    amountDue: number;

    status: string;
    dueDate: string;
    ownerBankName: string;
    ownerAccountName: string;
    ownerAccountNumber: string;
    allowPartialPayment: boolean;

    paymentAdviseItem: PaymentAdviceDto[];

    leaseAgreement: LeaseAgreeementDTO;
    paymentReceipts?: PaymentReceiptDTO[];
}

export interface GenerateBuildingPADto {
    buildingId: number;

    month: number;
    year: number;
    type: PAType;
}

export interface ReceivePaymentDTO {
    paymentAdviceIds: number[];
    amount: number;
    paymentMode: string;
    remarks: string;
    refNo: string;
    receivedBy: number;
    isVerified: boolean;
}

export interface PaymentAdviceSummaryDTO {
    totalMonthlyRentalIncome: number;
    totalSecurityDepositAmount: number;
    totalPendingRentalAmount: number;
    totalPendingSecurityDepositAmount: number;
}
