import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { API_URL } from '../../constants/constants';
import {
    CreateUnitDTO,
    UnitDTO,
    UpdateUnitDto,
} from '../../dto/units/unit.dto';
import { Observable } from 'rxjs';
import {
    PaginatedParamsOptions,
    PaginatedData,
} from '../../dto/paginated-data.dto';
import { BuildingDTO } from '../../dto/properties/building.dto';

@Injectable({
    providedIn: 'root',
})
export class UnitDataService {
    apiUrl = API_URL;
    constructor(private http: HttpClient) {}

    GetAllUnitsByBuilding(buildingId: number): Observable<UnitDTO[]> {
        return this.http.get<UnitDTO[]>(
            `${this.apiUrl}/unit/building/${buildingId}`
        );
    }

    GetAllUnitsByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<UnitDTO>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.pageNo !== undefined) {
                httpParams = httpParams.append(
                    'pageNo',
                    params.pageNo.toString()
                );
            }
            if (params.pageSize !== undefined) {
                httpParams = httpParams.append(
                    'pageSize',
                    params.pageSize.toString()
                );
            }
        }

        console.log(httpParams);
        // Return the HTTP GET request with the params
        return this.http.get<PaginatedData<UnitDTO>>(
            `${this.apiUrl}/unit/admin/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetUnit(unitId: number): Observable<UnitDTO> {
        return this.http.get<UnitDTO>(`${this.apiUrl}/unit/${unitId}`);
    }
    GetDetailedUnitInformation(unitId: number): Observable<UnitDTO> {
        return this.http.get<UnitDTO>(`${this.apiUrl}/unit/detailed/${unitId}`);
    }
    GetUnitListings(): Observable<UnitDTO[]> {
        return this.http.get<UnitDTO[]>(`${this.apiUrl}/unit/listings/all`);
    }

    CreateUnit(data: CreateUnitDTO) {
        return this.http.post(`${this.apiUrl}/unit`, data);
    }

    UpdateUnit(data: UpdateUnitDto, id: number): Observable<UnitDTO> {
        return this.http.patch<UnitDTO>(`${this.apiUrl}/unit/${id}`, data);
    }
}
