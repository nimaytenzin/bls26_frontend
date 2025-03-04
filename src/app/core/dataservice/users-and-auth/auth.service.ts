import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API_URL } from '../../constants/constants';
import {
    AUTH_TOKEN_KEY,
    CURRENT_ROLE_KEY,
} from '../../constants/api-constants';
import { AdminCreateTenantDTO } from '../../dto/users/tenant.dto';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
    AdminDisableUserLoginDTO,
    UpdateUserDetailsDTO,
    UserDTO,
} from './dto/user.dto';
import {
    CurrentRoleDTO,
    AuthenticatedUserDTO,
    UpdatePasswordDTO,
    RequestPasswordResetDto,
} from './dto/auth.dto';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    apiUrl = API_URL;
    authTokenKey = AUTH_TOKEN_KEY;
    currentRoleKey = CURRENT_ROLE_KEY;

    constructor(private http: HttpClient, private router: Router) {}

    Login(data) {
        return this.http.post(`${this.apiUrl}/auth/login`, data);
    }

    UpdateUserDetails(id: number, data: UpdateUserDetailsDTO) {
        return this.http.patch(
            `${this.apiUrl}/auth/update/details/${id}`,
            data
        );
    }

    GetAdminDetails(id: number): Observable<UserDTO> {
        return this.http.get<UserDTO>(
            `${this.apiUrl}/auth/admin-details/${id}`
        );
    }

    AdminDisableUserLogin(data: AdminDisableUserLoginDTO) {
        return this.http.post(`${this.apiUrl}/auth/admin/disable-login`, data);
    }

    AdminEnableUserLogin(data: AdminDisableUserLoginDTO) {
        return this.http.post(`${this.apiUrl}/auth/admin/enable-login`, data);
    }

    GetTenantDetails(phoneNumber: number): Observable<UserDTO> {
        return this.http.get<UserDTO>(
            `${this.apiUrl}/auth/tenant/phone/${phoneNumber}`
        );
    }

    LogOut() {
        this.RemoveAuthToken();
        this.RemoveCurrentRole();
        this.router.navigate(['/auth']);
    }

    SetAuthToken(token) {
        sessionStorage.setItem(this.authTokenKey, token);
    }

    SetCurrentRole(role: CurrentRoleDTO) {
        sessionStorage.setItem(this.currentRoleKey, JSON.stringify(role));
    }
    GetCurrentRole(): CurrentRoleDTO {
        console.log(sessionStorage.getItem(this.currentRoleKey));
        return JSON.parse(sessionStorage.getItem(this.currentRoleKey));
    }
    RemoveCurrentRole() {
        sessionStorage.removeItem(this.currentRoleKey);
    }

    GetAuthenticatedUser(): AuthenticatedUserDTO {
        if (this.GetToken()) {
            return jwtDecode(this.GetToken());
        } else {
            return null;
        }
    }

    RemoveAuthToken() {
        return sessionStorage.removeItem(this.authTokenKey);
    }
    GetToken() {
        return sessionStorage.getItem(this.authTokenKey);
    }

    AdminCreateTenant(data: AdminCreateTenantDTO) {
        return this.http.post(`${this.apiUrl}/auth/admin-tenant-signup`, data);
    }

    UpdatePassword(data: UpdatePasswordDTO) {
        return this.http.post(`${this.apiUrl}/auth/update-password`, data);
    }

    AdminRequestPasswordReset(data: RequestPasswordResetDto) {
        return this.http.post(`${this.apiUrl}/auth/request-reset`, data);
    }
}
