import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API_URL } from '../constants/constants';

@Injectable({
    providedIn: 'root',
})
export class BuildingDetailService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    GetBuildingDetailsByBuildingId(buildingId: number) {
        return this.http.get(
            `${this.apiUrl}/building-detail/bid/${buildingId}`
        );
    }
}
