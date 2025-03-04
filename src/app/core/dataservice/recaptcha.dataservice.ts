import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { API_URL } from '../constants/constants';
import { Observable } from 'rxjs';

interface recaptchaV3TokenVerificationResponse {
    success: boolean;
    challenge_ts: string;
    hostname: string;
    score: number;
    action: number;
}

@Injectable({
    providedIn: 'root',
})
export class RecaptchaService {
    apiUrl = API_URL;

    constructor(private http: HttpClient) {}

    Requestdemo(
        token: string,
        message: string
    ): Observable<recaptchaV3TokenVerificationResponse> {
        const headers = new HttpHeaders({
            'x-recaptcha-token': token,
        });

        return this.http.post<recaptchaV3TokenVerificationResponse>(
            `${this.apiUrl}/request-demo`,
            {
                message: message,
            },
            { headers }
        );
    }
}
