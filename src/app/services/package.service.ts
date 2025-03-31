import { Injectable } from '@angular/core';
import { API_URL } from '../core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PackageDTO } from '../core/dto/ems';

@Injectable({
  providedIn: 'root'
})
export class PackageService {

  private apiUrl = API_URL

  constructor(private http: HttpClient) { }

  getAllPackagesByFacilityId(id: number): Observable<PackageDTO[]> {
    return this.http.get<PackageDTO[]>(`${this.apiUrl}/package/facility/${id}`);
  }
}
