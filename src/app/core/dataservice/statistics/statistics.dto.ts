import { BuildingDTO } from '../../dto/properties/building.dto';

export interface AdminSummaryStatisticsDTO {
    buildingCount: number;
    unitCount: number;

    activeLeaseCount: number;
    totalRentalIncome: number;
    pendingPaymentAmount: number;
    pendingPaymentAdviceCount: number;

    thramCount: number;
    plotCount: number;
    ownerCount: number;
}
