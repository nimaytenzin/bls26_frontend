import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import {
    BuildingDTO,
    CreateBuildingDTO,
    UpdateBuildingDto,
} from '../../dto/properties/building.dto';
import { Observable } from 'rxjs';
import {
    BuildingSurchargeDTO,
    CreateBuildingSurchargeDTO,
} from '../../dto/properties/building-surcharge.dto';

@Injectable({
    providedIn: 'root',
})
export class BuildingSurchargeDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBuildingSurcharge(
        data: CreateBuildingSurchargeDTO
    ): Observable<BuildingSurchargeDTO> {
        return this.http.post<BuildingSurchargeDTO>(
            `${this.apiUrl}/building-surcharge`,
            data
        );
    }

    GetBuildingSurcharges(params?: {
        buildingId?: number;
    }): Observable<BuildingSurchargeDTO[]> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.buildingId !== undefined) {
                httpParams = httpParams.append(
                    'buildingId',
                    params.buildingId.toString()
                );
            }
        }
        return this.http.get<BuildingSurchargeDTO[]>(
            `${this.apiUrl}/building-surcharge/q`,
            {
                params: httpParams,
            }
        );
    }

    UpdateBuildingSurcharge(
        data: CreateBuildingSurchargeDTO,
        id: number
    ): Observable<BuildingSurchargeDTO> {
        return this.http.patch<BuildingSurchargeDTO>(
            `${this.apiUrl}/building-surcharge/${id}`,
            data
        );
    }

    DeleteBuildingSurcharge(id: number) {
        return this.http.delete(`${this.apiUrl}/building-surcharge/${id}`);
    }
}
