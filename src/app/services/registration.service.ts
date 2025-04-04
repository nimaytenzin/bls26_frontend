import { Injectable } from '@angular/core';
import { API_URL } from '../core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { RegistrationDto } from '../core/dto/ems';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private apiUrl = API_URL + "/registration"

  constructor(private http: HttpClient) { }

  createRegistration(registration: RegistrationDto) {
    return this.http.post<RegistrationDto>(`${this.apiUrl}/register`, registration);
  }

}
