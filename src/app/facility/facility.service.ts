import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacilityService {
  private apiUrl = 'http://localhost:3000/facilities';

  constructor(private http: HttpClient) {}

  getFacilities(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addFacility(facility: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, facility);
  }
}
