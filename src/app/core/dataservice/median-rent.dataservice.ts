import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { API_URL } from '../constants/constants';

@Injectable({
    providedIn: 'root',
})
export class MedianRentDataService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    GetMedianRents() {
        return this.http.get(`${this.apiUrl}/median-rent`);
    }
}
