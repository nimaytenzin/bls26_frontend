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
import {
    BuildingRuleDTO,
    CreateBuildingRuleDTO,
} from '../../dto/properties/building-rule.dto';
import { CreateUnitRuleDTO, UnitRuleDTO } from '../../dto/units/unit-rule.dto';

@Injectable({
    providedIn: 'root',
})
export class UnitRuleDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateUnitRule(data: CreateUnitRuleDTO): Observable<UnitRuleDTO> {
        return this.http.post<UnitRuleDTO>(`${this.apiUrl}/unit-rule`, data);
    }

    UpdateUnitRule(
        data: CreateUnitRuleDTO,
        id: number
    ): Observable<UnitRuleDTO> {
        return this.http.patch<UnitRuleDTO>(
            `${this.apiUrl}/unit-rule/${id}`,
            data
        );
    }

    GetUnitRules(params?: { unitId?: number }): Observable<UnitRuleDTO[]> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.unitId !== undefined) {
                httpParams = httpParams.append(
                    'unitId',
                    params.unitId.toString()
                );
            }
        }
        return this.http.get<UnitRuleDTO[]>(`${this.apiUrl}/unit-rule/q`, {
            params: httpParams,
        });
    }

    DeleteUnitRule(id: number) {
        return this.http.delete(`${this.apiUrl}/unit-rule/${id}`);
    }
}
