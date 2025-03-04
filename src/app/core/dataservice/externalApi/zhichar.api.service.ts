import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ZHICHAR_API_URL } from '../../constants/constants';

@Injectable({
    providedIn: 'root',
})
export class ZhicharApiService {
    zhicharApi = ZHICHAR_API_URL;

    constructor(private http: HttpClient) {}

    GetBuildDetailsByBuildingId(buildingId) {
        return this.http.get(`${this.zhicharApi}/building/${buildingId}`);
    }
}
