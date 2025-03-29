import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/constants/constants';
import { FacilityDTO } from '../core/dto/properties/building.dto';

@Injectable({
  providedIn: 'root'
})
export class FacilityDataService {
  private apiUrl = API_URL

  constructor(private http: HttpClient) { }

  addFacility(data: FacilityDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/facility`, data);
  }

  getFacilityByOwnerId(id: number): Observable<FacilityDTO[]> {
    return this.http.get<FacilityDTO[]>(`${this.apiUrl}/facility/owner/${id}`);
  }
}
