import { EntryDamageReportItemDTO } from './entry-damage-report-item.dto';

export interface EntryDamageReportItemImageDTO {
    id: number;
    entryDamageReportItemId: number;
    imageUrl: string;

    entryDamageReportItem: EntryDamageReportItemDTO;
}
