import { INVOICESTATUS } from 'src/app/core/constants/enums';
import { BuildingDTO } from '../../properties/building.dto';
import { UnitDTO } from '../../units/unit.dto';
import { LandLordDTO } from '../../users/landlord.dto';
import { TenantDTO } from '../../users/tenant.dto';
import { InvoiceItemDTO } from './invoice-item.dto';

export interface InvoiceDTO {
    id: number;

    unitId: number;
    unit?: UnitDTO;

    buildingId: number;
    building?: BuildingDTO;

    title: string;
    tenantId: number;
    tenant: TenantDTO;

    landlordId: number;
    landlord: LandLordDTO;

    month: number;
    year: number;

    totalAmount: number;
    status: INVOICESTATUS;

    invoiceItems: InvoiceItemDTO[];
}
