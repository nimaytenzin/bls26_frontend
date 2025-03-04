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
    CreateUnitSurchargeDTO,
    UnitSurchargeDTO,
} from '../../dto/units/unit-surcharge.dto';

@Injectable({
    providedIn: 'root',
})
export class UnitSurchargeDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateUnitSurcharge(
        data: CreateUnitSurchargeDTO
    ): Observable<UnitSurchargeDTO> {
        return this.http.post<UnitSurchargeDTO>(
            `${this.apiUrl}/unit-surcharge`,
            data
        );
    }

    GetUnitSurcharges(params?: {
        unitId?: number;
    }): Observable<UnitSurchargeDTO[]> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.unitId !== undefined) {
                httpParams = httpParams.append(
                    'unitId',
                    params.unitId.toString()
                );
            }
        }
        return this.http.get<UnitSurchargeDTO[]>(
            `${this.apiUrl}/unit-surcharge/q`,
            {
                params: httpParams,
            }
        );
    }

    UpdateUnitSurcharge(
        data: CreateUnitSurchargeDTO,
        id: number
    ): Observable<UnitSurchargeDTO> {
        return this.http.patch<UnitSurchargeDTO>(
            `${this.apiUrl}/unit-surcharge/${id}`,
            data
        );
    }

    DeleteUnitSurcharge(id: number) {
        return this.http.delete(`${this.apiUrl}/unit-surcharge/${id}`);
    }
}
