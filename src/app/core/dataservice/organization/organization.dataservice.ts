import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import { PaginatedParamsOptions } from '../../dto/paginated-data.dto';
import {
    CreateOrganizationDTO,
    OrganiztionDTO,
    UpdateOrganizationDTO,
} from './organization.dto';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class OrganizationDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    AdminCreateOrganization(
        data: CreateOrganizationDTO
    ): Observable<OrganiztionDTO> {
        return this.http.post<OrganiztionDTO>(
            `${this.apiUrl}/organization`,
            data
        );
    }

    AdminDeleteOrganization(organizationId: number) {
        return this.http.delete(
            `${this.apiUrl}/organization/${organizationId}`
        );
    }

    AdminUpdateOrganization(
        data: UpdateOrganizationDTO,
        id: number
    ): Observable<OrganiztionDTO> {
        return this.http.patch<OrganiztionDTO>(
            `${this.apiUrl}/organization/${id}`,
            data
        );
    }
}
