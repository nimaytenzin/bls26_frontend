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

@Injectable({
    providedIn: 'root',
})
export class BuildingRulesDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBuildingRule(
        data: CreateBuildingRuleDTO
    ): Observable<BuildingRuleDTO> {
        return this.http.post<BuildingRuleDTO>(
            `${this.apiUrl}/building-rule`,
            data
        );
    }

    UpdateBuildingRule(
        data: CreateBuildingRuleDTO,
        id: number
    ): Observable<BuildingRuleDTO> {
        return this.http.patch<BuildingRuleDTO>(
            `${this.apiUrl}/building-rule/${id}`,
            data
        );
    }

    GetBuildingRules(params?: {
        buildingId?: number;
    }): Observable<BuildingRuleDTO[]> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.buildingId !== undefined) {
                httpParams = httpParams.append(
                    'buildingId',
                    params.buildingId.toString()
                );
            }
        }
        return this.http.get<BuildingRuleDTO[]>(
            `${this.apiUrl}/building-rule/q`,
            {
                params: httpParams,
            }
        );
    }

    DeleteBuildingRules(id: number) {
        return this.http.delete(`${this.apiUrl}/building-rule/${id}`);
    }
}
