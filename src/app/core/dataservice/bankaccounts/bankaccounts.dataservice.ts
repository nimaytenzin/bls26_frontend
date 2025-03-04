import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URL } from '../../constants/constants';

import { Observable } from 'rxjs';

import {
    BuildingAmenityDTO,
    CreateBuildingAmenityDto,
} from '../../dto/properties/building-amenity.dto';
import { BankAccountDto, CreateBankAccountDto } from './bankaccount.dto';

export interface BankListWithLogoDto {
    bankCode: string;
    bankName: string;
    logourl: string;
    status: string;
    shorthand: string;
}

@Injectable({
    providedIn: 'root',
})
export class BankAccountDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    CreateBankAccount(data: CreateBankAccountDto): Observable<BankAccountDto> {
        return this.http.post<BankAccountDto>(
            `${this.apiUrl}/bank-account`,
            data
        );
    }
    GetAllBankAccountsByAdmin(adminId: number): Observable<BankAccountDto[]> {
        return this.http.get<BankAccountDto[]>(
            `${this.apiUrl}/bank-account/admin/${adminId}`
        );
    }

    UpdateBankAccount(
        data: CreateBankAccountDto,
        id
    ): Observable<BankAccountDto> {
        return this.http.patch<BankAccountDto>(
            `${this.apiUrl}/bank-account/${id}`,
            data
        );
    }
    DownloadAllBankAccountsAsExcel() {
        return this.http.get(`${this.apiUrl}/bank-account/export/excel`, {
            responseType: 'blob',
        });
    }

    BankListWithLogo: BankListWithLogoDto[] = [
        {
            bankCode: '1010',
            bankName: 'BANK OF BHUTAN LIMITED',
            logourl: 'assets/banks/bob.png',
            status: 'A',
            shorthand: 'BOB',
        },
        {
            bankCode: '1020',
            bankName: 'Bhutan National Bank Limited',
            logourl: 'assets/banks/bnb.png',
            status: 'A',
            shorthand: 'BNB',
        },
        {
            bankCode: '1030',
            bankName: 'Druk PNBL',
            logourl: 'assets/banks/pnb.jpeg ',
            status: 'A',
            shorthand: 'PNB',
        },
        {
            bankCode: '1050',
            bankName: 'Bhutan Development Bank Ltd.',
            logourl: 'assets/banks/bdbl.png',
            status: 'A',
            shorthand: 'BDBL',
        },
        {
            bankCode: '1040',
            bankName: 'T Bank Ltd.',
            logourl: 'assets/banks/tbank.png',
            status: 'A',
            shorthand: 'TBANK',
        },
        {
            bankCode: '1060',
            bankName: 'DK Limited Bank',
            logourl: 'assets/banks/dk.png',
            status: 'A',
            shorthand: 'DKBANK',
        },
    ];
}
