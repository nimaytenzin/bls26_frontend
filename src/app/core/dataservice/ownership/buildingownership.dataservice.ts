import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import { CreateBuildingOwnershipDto } from '../../dto/ownership/buildingOwnership.dto';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BuildingOwnershipDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBuildingOwnership(data: CreateBuildingOwnershipDto): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}/building/ownership/new`,
            data
        );
    }

    FindAllOwnersAndBankAccountsByBuilding(buildingId: number) {
        return this.http.get<any>(
            `${this.apiUrl}/building/owners/${buildingId}`
        );
    }
}
