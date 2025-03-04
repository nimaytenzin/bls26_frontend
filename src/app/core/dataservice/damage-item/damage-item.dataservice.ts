import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';

import { Observable } from 'rxjs';

import {
    CreateDamageItemDTO,
    CreateDamageItemThreadDTO,
    DamageItemDTO,
    DamageItemThreamDTO,
    ResolveDamageItemDTO,
} from './damage.item.dto';
import { LeaseAgreeementDTO } from '../lease/lease-agreement.dto';

@Injectable({
    providedIn: 'root',
})
export class DamageItemService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateEntryDamageItem(
        data: CreateDamageItemDTO
    ): Observable<DamageItemDTO> {
        const formData = new FormData();

        formData.append('leaseAgreementId', data.leaseAgreementId.toString());
        formData.append('type', data.type);
        formData.append('title', data.title);
        formData.append('location', data.location);
        formData.append('description', data.description);

        data.images.forEach((image, index) => {
            formData.append('images', image, image.name);
        });

        console.log('DATA', formData);

        return this.http.post<DamageItemDTO>(
            `${this.apiUrl}/damage-item`,
            formData
        );
    }

    GetEntryDamageItemsBylease(
        leaseAgreementId: number
    ): Observable<DamageItemDTO[]> {
        return this.http.get<DamageItemDTO[]>(
            `${this.apiUrl}/damage-item/DR/lease/${leaseAgreementId}`
        );
    }

    GetMaintenanceItemsBylease(
        leaseAgreementId: number
    ): Observable<DamageItemDTO[]> {
        return this.http.get<DamageItemDTO[]>(
            `${this.apiUrl}/damage-item/MR/lease/${leaseAgreementId}`
        );
    }

    ResolveDamageItem(data: ResolveDamageItemDTO): Observable<DamageItemDTO> {
        return this.http.patch<DamageItemDTO>(
            `${this.apiUrl}/damage-item/resolve/${data.damageItemId}`,
            data
        );
    }

    CreateDamageItemThread(
        data: CreateDamageItemThreadDTO
    ): Observable<DamageItemThreamDTO[]> {
        return this.http.post<DamageItemThreamDTO[]>(
            `${this.apiUrl}/damage-item-thread`,
            data
        );
    }

    GetDamageItemThreadByDamageItem(
        damageItemId: number
    ): Observable<DamageItemThreamDTO[]> {
        return this.http.get<DamageItemThreamDTO[]>(
            `${this.apiUrl}/damage-item-thread/damage-item/${damageItemId}`
        );
    }

    GetAllDamageItemByAdmin(adminId: number): Observable<DamageItemDTO[]> {
        return this.http.get<DamageItemDTO[]>(
            `${this.apiUrl}/damage-item/admin/${adminId}`
        );
    }
}
