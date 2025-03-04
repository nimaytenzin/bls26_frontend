import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import { Observable } from 'rxjs';
import {
    CreateThramDTO,
    SearchThramDTO,
    ThramDTO,
    UpdateThramDTO,
} from './dto/thram.dto';
import { UserDTO } from '../users-and-auth/dto/user.dto';
import {
    PaginatedParamsOptions,
    PaginatedData,
} from '../../dto/paginated-data.dto';
import { PaymentAdviceDto } from '../../dto/payments/payment-advice.dto';

@Injectable({
    providedIn: 'root',
})
export class ThramDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateThram(data: CreateThramDTO): Observable<ThramDTO> {
        return this.http.post<ThramDTO>(`${this.apiUrl}/thram`, data);
    }

    UpdateThram(data: UpdateThramDTO, thramId: number): Observable<ThramDTO> {
        return this.http.patch<ThramDTO>(
            `${this.apiUrl}/thram/${thramId}`,
            data
        );
    }

    GetAllThramsByAdminPaginated(
        adminId: number,
        params?: PaginatedParamsOptions
    ): Observable<PaginatedData<ThramDTO>> {
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

        return this.http.get<PaginatedData<ThramDTO>>(
            `${this.apiUrl}/thram/admin/p/${adminId}`,
            { params: httpParams }
        );
    }

    GetAllThramsByOwner(ownerId: number): Observable<ThramDTO[]> {
        return this.http.get<ThramDTO[]>(
            `${this.apiUrl}/thram/owner/${ownerId}`
        );
    }

    SearchForThramByThramNo(data: SearchThramDTO): Observable<ThramDTO> {
        return this.http.post<ThramDTO>(`${this.apiUrl}/thram/search`, data);
    }
    SearchForThramByPlotId(plotId): Observable<ThramDTO> {
        return this.http.get<ThramDTO>(
            `${this.apiUrl}/thram/search/plot/${plotId}`
        );
    }

    GetAlllThramsByDzongkhagAndAdmin(
        adminId: number,
        dzongkhagId: number
    ): Observable<ThramDTO[]> {
        return this.http.get<ThramDTO[]>(
            `${this.apiUrl}/thram/admin/dzongkhag/${adminId}/${dzongkhagId}`
        );
    }

    GetAlllThramsByAdminZoneAndAdmin(
        adminId: number,
        administrativeZoneId: number
    ): Observable<ThramDTO[]> {
        return this.http.get<ThramDTO[]>(
            `${this.apiUrl}/thram/admin/administrative-zone/${adminId}/${administrativeZoneId}`
        );
    }
    GetAlllThramsBySubAdminZoneAndAdmin(
        adminId: number,
        subAdministrativeZOneId: number
    ): Observable<ThramDTO[]> {
        return this.http.get<ThramDTO[]>(
            `${this.apiUrl}/thram/admin/sub-administrative-zone/${adminId}/${subAdministrativeZOneId}`
        );
    }
}
