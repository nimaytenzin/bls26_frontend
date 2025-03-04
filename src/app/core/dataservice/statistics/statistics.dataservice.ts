import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../constants/constants';
import { AdminSummaryStatisticsDTO } from './statistics.dto';

@Injectable({
    providedIn: 'root',
})
export class StatsDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    GetSummaryStatsByAdmin(
        adminId: number
    ): Observable<AdminSummaryStatisticsDTO> {
        return this.http.get<AdminSummaryStatisticsDTO>(
            `${this.apiUrl}/statistics/admin/${adminId}`
        );
    }
}
