import { BankAccountDto } from '../../dataservice/bankaccounts/bankaccount.dto';
import { LeaseAgreeementDTO } from '../../dataservice/lease/lease-agreement.dto';
import { PaymentAdviceDto } from '../payments/payment-advice.dto';
import { BuildingDTO } from '../properties/building.dto';

export interface UnitDTO {
    id: number;
    buildingId: number;
    bankAccountId: number;

    zhicharUnitId: number;
    zhicharQrUuid: string;

    floorLevel: string;
    unitNumber: string;
    bedroomCount: number;
    toiletCount: number;
    balconyCount: number;
    floorArea: number;
    powerConsumerId: string;

    building?: BuildingDTO;
    bankAccount?: BankAccountDto;
    remarks: string;

    activeLeaseAgreement?: LeaseAgreeementDTO;
    paymentAdvices?: PaymentAdviceDto[];
    leaseAgreements: LeaseAgreeementDTO[];
}

export interface CreateUnitDTO {
    buildingId: number;
    bankAccountId?: number;
    zhicharUnitId: number;
    zhicharQrUuid: string;
    remarks?: string;
    floorLevel: string;
    unitNumber: string;
    bedroomCount: number;
    toiletCount: number;
    balconyCount: number;
    floorArea?: number;

    powerConsumerId?: string;
}

export interface UpdateUnitDto {
    buildingId?: number;
    bankAccountId?: number;
    zhicharUnitId?: number;
    zhicharQrUuid?: string;
    remarks?: string;
    floorLevel?: string;
    unitNumber?: string;
    bedroomCount?: number;
    toiletCount?: number;
    balconyCount?: number;
    floorArea?: number;

    powerConsumerId?: string;
}
