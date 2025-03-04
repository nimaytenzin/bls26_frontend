import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';

import { Observable } from 'rxjs';

import {
    BuildingAmenityDTO,
    CreateBuildingAmenityDto,
    UpdateBuildingAmenityDTO,
} from '../../dto/properties/building-amenity.dto';

@Injectable({
    providedIn: 'root',
})
export class BuildingAmenityDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBuildingAmenity(
        data: CreateBuildingAmenityDto
    ): Observable<BuildingAmenityDTO> {
        return this.http.post<BuildingAmenityDTO>(
            `${this.apiUrl}/building-amenity`,
            data
        );
    }

    UpdateBuildingAmenity(
        data: UpdateBuildingAmenityDTO,
        id: number
    ): Observable<BuildingAmenityDTO> {
        return this.http.put<BuildingAmenityDTO>(
            `${this.apiUrl}/building-amenity/${id}`,
            data
        );
    }

    GetBuildingAmenities(params?: {
        buildingId?: number;
    }): Observable<BuildingAmenityDTO[]> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.buildingId !== undefined) {
                httpParams = httpParams.append(
                    'buildingId',
                    params.buildingId.toString()
                );
            }
        }
        return this.http.get<BuildingAmenityDTO[]>(
            `${this.apiUrl}/building-amenity/q/p`,
            {
                params: httpParams,
            }
        );
    }

    DeleteBuildingAmenity(id: number) {
        return this.http.delete(`${this.apiUrl}/building-amenity/${id}`);
    }
}
