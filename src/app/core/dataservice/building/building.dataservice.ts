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
    PaginatedData,
    PaginatedParamsOptions,
} from '../../dto/paginated-data.dto';

@Injectable({
    providedIn: 'root',
})
export class BuildingDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateNewBuilding(data: CreateBuildingDTO): Observable<BuildingDTO> {
        return this.http.post<BuildingDTO>(`${this.apiUrl}/building`, data);
    }

    UpdateBuilding(
        buildingId: number,
        data: UpdateBuildingDto
    ): Observable<BuildingDTO> {
        return this.http.put<BuildingDTO>(
            `${this.apiUrl}/building/${buildingId}`,
            data
        );
    }

    GetAllBuildingsByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<BuildingDTO>> {
        let httpParams = new HttpParams();

        // Check if params exist and append query parameters accordingly
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
        return this.http.get<PaginatedData<BuildingDTO>>(
            `${this.apiUrl}/building/admin/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllBuildingsByAdmin(adminId: number): Observable<BuildingDTO[]> {
        return this.http.get<BuildingDTO[]>(
            `${this.apiUrl}/building/admin/${adminId}`
        );
    }

    // GetBuildingsPaginated(): Observable<BuildingDTO[]> {
    //     return this.http.get<BuildingDTO[]>(
    //         `${this.apiUrl}/building/latest/buildings`
    //     );
    // }
    GetBuildingsPaginatedByOwner(ownerId: number): Observable<BuildingDTO[]> {
        return this.http.get<BuildingDTO[]>(
            `${this.apiUrl}/building/owner/${ownerId}`
        );
    }

    GetOneById(buildingId: number): Observable<BuildingDTO> {
        return this.http.get<BuildingDTO>(
            `${this.apiUrl}/building/${buildingId}`
        );
    }
    GetOneByZhicharBuildingId(
        zhicharBuildingId: number
    ): Observable<BuildingDTO> {
        return this.http.get<BuildingDTO>(
            `${this.apiUrl}/building/zhichar-id/${zhicharBuildingId}`
        );
    }

    GetBuildingsByLandlord(landlordId: number): Observable<BuildingDTO[]> {
        return this.http.get<BuildingDTO[]>(
            `${this.apiUrl}/building/owner/${landlordId}`
        );
    }

    GetBuildingsByPlot(plotId: string): Observable<BuildingDTO[]> {
        return this.http.get<BuildingDTO[]>(
            `${this.apiUrl}/building/plot/${plotId}`
        );
    }
}
