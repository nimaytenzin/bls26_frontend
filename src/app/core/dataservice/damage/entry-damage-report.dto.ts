import {
    CreateEntryDamageReportItemDTO,
    EntryDamageReportItemDTO,
} from './entry-damage-report-item.dto';

export interface EntryDamageReportDTO {
    id: number;
    leaseAgreementId: number;
    reportDate: string;

    damageReportItems: EntryDamageReportItemDTO[];
}

export interface CreateEntryDamageReportDTO {
    leaseAgreementId: number;
}

export interface SubmitEntryDamageReportDTO {
    entryDamageReportId: number;
    leaseAgreementId: number;
    reportDate: string;
}
