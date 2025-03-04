import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../constants/constants';

@Injectable({
    providedIn: 'root',
})
export class FileUploadService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    UploadTenantProfilePicture(data: any, id: number) {
        return this.http.patch(`${this.apiUrl}/tenant/profile/${id}`, data);
    }
    UploadTenantSignature(data: any, id: number) {
        return this.http.patch(`${this.apiUrl}/tenant/signature/${id}`, data);
    }
}
