import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import { CreateOwnerDTO, OwnerDTO } from './dto/owner.dto';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class OwnerDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateOwner(data: CreateOwnerDTO): Observable<OwnerDTO> {
        return this.http.post<OwnerDTO>(`${this.apiUrl}/owner`, data);
    }
    UpdateOwner(
        data: Partial<CreateOwnerDTO>,
        ownerId: number
    ): Observable<OwnerDTO> {
        return this.http.patch<OwnerDTO>(
            `${this.apiUrl}/owner/${ownerId}`,
            data
        );
    }

    GetAllOwners(): Observable<OwnerDTO[]> {
        return this.http.get<OwnerDTO[]>(`${this.apiUrl}/owner`);
    }

    DeleteOwner(id: number) {
        return this.http.delete(`${this.apiUrl}/owner/${id}`);
    }
}
