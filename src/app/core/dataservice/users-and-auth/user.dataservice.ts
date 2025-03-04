import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';
import { Observable } from 'rxjs';
import { CreateUserDTO, UpdateUserDetailsDTO, UserDTO } from './dto/user.dto';

@Injectable({
    providedIn: 'root',
})
export class UserDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    AdminCreateUser(data: CreateUserDTO): Observable<UserDTO> {
        return this.http.post<UserDTO>(
            `${this.apiUrl}/auth/admin/signup`,
            data
        );
    }
    AdminUpdateUserDetails(
        userId: number,
        data: UpdateUserDetailsDTO
    ): Observable<UserDTO> {
        return this.http.patch<UserDTO>(
            `${this.apiUrl}/auth/update/${userId}`,
            data
        );
    }

    AdminGetAllOwners(adminId: number): Observable<UserDTO[]> {
        return this.http.get<UserDTO[]>(`${this.apiUrl}/auth/owner/${adminId}`);
    }
    AdminGetAllTenants(adminId: number): Observable<UserDTO[]> {
        return this.http.get<UserDTO[]>(
            `${this.apiUrl}/auth/tenants/admin/${adminId}`
        );
    }

    AdminGetAllManagersByAdmin(adminId: number): Observable<UserDTO[]> {
        return this.http.get<UserDTO[]>(
            `${this.apiUrl}/auth/managers/admin/${adminId}`
        );
    }

    GetAllManagersByAdmin(adminId: number): Observable<UserDTO[]> {
        return this.http.get<UserDTO[]>(
            `${this.apiUrl}/auth/managers/admin/${adminId}`
        );
    }

    AdminSearchTenantByPhoneNumber(phoneNumber: number): Observable<UserDTO> {
        return this.http.get<UserDTO>(
            `${this.apiUrl}/auth/tenant/phone/${phoneNumber}`
        );
    }

    FindOneAuthenticated(id: number): Observable<UserDTO> {
        return this.http.get<UserDTO>(
            `${this.apiUrl}/auth/authenticated/${id}`
        );
    }

    AdminFindTenantByPhoneNumber(phoneNumber: number): Observable<UserDTO> {
        return this.http.get<UserDTO>(
            `${this.apiUrl}/auth/tenant/phone/${phoneNumber}`
        );
    }

    AdminFindTenantByUserId(userId: number): Observable<UserDTO> {
        return this.http.get<UserDTO>(`${this.apiUrl}/auth/tenant/${userId}`);
    }

    AdminFindTenantByCID(cid: string): Observable<UserDTO> {
        return this.http.get<UserDTO>(`${this.apiUrl}/auth/tenant/cid/${cid}`);
    }
}
