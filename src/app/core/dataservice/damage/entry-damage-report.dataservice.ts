import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from 'src/app/core/constants/constants';
import {
    CreateEntryDamageReportDTO,
    EntryDamageReportDTO,
    SubmitEntryDamageReportDTO,
} from './entry-damage-report.dto';
import { Observable } from 'rxjs';
import {
    CreateEntryDamageReportItemDTO,
    EntryDamageReportItemDTO,
} from './entry-damage-report-item.dto';

@Injectable({
    providedIn: 'root',
})
export class EntryDamageReportDataservice {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateEntryDamageReport(
        data: CreateEntryDamageReportDTO
    ): Observable<EntryDamageReportDTO> {
        return this.http.post<EntryDamageReportDTO>(
            `${this.apiUrl}/entry-damage-report`,
            data
        );
    }

    SubmitEntryDamageReport(
        data: SubmitEntryDamageReportDTO
    ): Observable<EntryDamageReportDTO> {
        return this.http.patch<EntryDamageReportDTO>(
            `${this.apiUrl}/entry-damage-report/submit/${data.entryDamageReportId}`,
            data
        );
    }

    GetEntryDamageReportByLease(
        leaseAgreementId: number
    ): Observable<EntryDamageReportDTO> {
        return this.http.get<EntryDamageReportDTO>(
            `${this.apiUrl}/entry-damage-report/lease/${leaseAgreementId}`
        );
    }

    CreateEntryDamageReportItem(
        data: FormData
    ): Observable<EntryDamageReportItemDTO> {
        return this.http.post<EntryDamageReportItemDTO>(
            `${this.apiUrl}/entry-damage-report-item`,
            data
        );
    }

    GetEntryDamageReportItemsByReport(
        reportId: number
    ): Observable<EntryDamageReportItemDTO[]> {
        return this.http.get<EntryDamageReportItemDTO[]>(
            `${this.apiUrl}/entry-damage-report-item/report/${reportId}`
        );
    }
}
