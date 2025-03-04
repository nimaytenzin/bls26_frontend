import { INVOICESTATUS } from 'src/app/core/constants/enums';
import { CreateInvoiceItemDTO } from './create-invoice-item.dto';

export interface CreateInvoiceDTO {
    unitId: number;
    buildingId: number;
    leaseAgreementId: number;

    title: string;
    tenantId: number;

    landlordId: number;

    month: number;
    year: number;

    totalAmount: number;
    status: INVOICESTATUS;

    invoiceItems: CreateInvoiceItemDTO[];
}
