import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../constants/constants';

@Injectable({
    providedIn: 'root',
})
export class PDFGeneratorDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    DownloadLeaseAgreementPdf(leaseAgreementId: number): Observable<Blob> {
        return this.http.get<Blob>(
            `${this.apiUrl}/pdf-generator/lease-agreement/${leaseAgreementId}`,
            {
                responseType: 'blob' as 'json', // Explicitly specify the response type
            }
        );
    }

    GetPdfUrl(leaseAgreementId: number): string {
        return `${this.apiUrl}/pdf-generator/lease-agreement/${leaseAgreementId}`;
    }
}
