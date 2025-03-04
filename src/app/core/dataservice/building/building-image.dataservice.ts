import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';

import { Observable } from 'rxjs';
import { BuildingImageDTO } from '../../dto/properties/building-image.dto';
@Injectable({
    providedIn: 'root',
})
export class BuildingImageDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBuildingImage(data: FormData): Observable<BuildingImageDTO> {
        return this.http.post<BuildingImageDTO>(
            `${this.apiUrl}/building-image`,
            data
        );
    }

    GetBuildingImageByBuilding(
        buildingId: number
    ): Observable<BuildingImageDTO[]> {
        return this.http.get<BuildingImageDTO[]>(
            `${this.apiUrl}/building-image/building/${buildingId}`
        );
    }

    DeleteBuildingImage(id: number) {
        return this.http.delete(`${this.apiUrl}/building-image/${id}`);
    }
}
