import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { API_URL } from '../../constants/constants';
import {
    CreateDzongkhagDTO,
    DzongkhagDTO,
} from '../../dto/locations/dzongkhag.dto';
import {
    AdministrativeZoneDTO,
    CreateAdministrativeZoneDTO,
} from '../../dto/locations/administrative-zone.dto';
import { Observable } from 'rxjs';
import {
    CreateSubAdministrativeZoneDTO,
    SubAdministrativeZoneDTO,
} from '../../dto/locations/sub-administrative-zone.dto';

@Injectable({
    providedIn: 'root',
})
export class LocationDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    GetAllDzonghags(): Observable<DzongkhagDTO[]> {
        return this.http.get<DzongkhagDTO[]>(`${this.apiUrl}/dzongkhag`);
    }
    GetAllAdministrativeZones(params?: {
        type?: string;
        dzongkhagId?: number;
    }): Observable<AdministrativeZoneDTO[]> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.type) {
                httpParams = httpParams.set('type', params.type);
            }
            if (params.dzongkhagId) {
                httpParams = httpParams.set('dzongkhagId', params.dzongkhagId);
            }
        }

        return this.http.get<AdministrativeZoneDTO[]>(
            `${this.apiUrl}/administrative-zone`,
            { params: httpParams }
        );
    }
    GetAllSubAdministrativeZones(params?: {
        type?: string;
        administrativeZoneId?: string;
    }): Observable<SubAdministrativeZoneDTO[]> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.type) {
                httpParams = httpParams.set('type', params.type);
            }
            if (params.administrativeZoneId) {
                httpParams = httpParams.set(
                    'administrativeZoneId',
                    params.administrativeZoneId
                );
            }
        }

        return this.http.get<SubAdministrativeZoneDTO[]>(
            `${this.apiUrl}/sub-administrative-zone`,
            { params: httpParams }
        );
    }

    GetAllThromdesByDzongkhag(dzongkhagId: number) {
        return this.http.get(`${this.apiUrl}/thromde/dzongkhag/${dzongkhagId}`);
    }
    GetAllLocalitiesByThromde(thromdeId: number) {
        return this.http.get(`${this.apiUrl}/locality/thromde/${thromdeId}`);
    }

    CreateDzongkhag(data: CreateDzongkhagDTO) {
        return this.http.post(`${this.apiUrl}/dzongkhag`, data);
    }

    CreateAdministrativeZone(data: CreateAdministrativeZoneDTO) {
        return this.http.post(`${this.apiUrl}/administrative-zone`, data);
    }
    CreateSubAdministrativeZone(data: CreateSubAdministrativeZoneDTO) {
        return this.http.post(`${this.apiUrl}/sub-administrative-zone`, data);
    }
}
