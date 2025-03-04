import { ENTRYDAMAGEACTIONSTATUS } from 'src/app/core/constants/enums';
import { EntryDamageReportDTO } from './entry-damage-report.dto';
import { EntryDamageReportItemImageDTO } from './entry-damage-report-image.dto';

export interface EntryDamageReportItemDTO {
    id: number;
    entryDamageReportId: number;

    location: string;
    damageDetails: string;
    status: ENTRYDAMAGEACTIONSTATUS;
    actionTakenSummary: string;

    entryDamageReport: EntryDamageReportDTO;
    images: EntryDamageReportItemImageDTO[];
}
export interface CreateEntryDamageReportItemDTO {
    location: string;
    damageDetails: string;
    status: ENTRYDAMAGEACTIONSTATUS;
    actionTakenSummary?: string;
    files: any[];
}
