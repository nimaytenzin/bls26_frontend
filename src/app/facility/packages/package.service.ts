import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Package {
  id: number;
  facilityId: number;
  name: string;
  description: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getFacilities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/facilities`);
  }

  getPackagesByFacility(facilityId: number): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}/packages?facilityId=${facilityId}`);
  }

  addPackage(pkg: Package): Observable<Package> {
    return this.http.post<Package>(`${this.apiUrl}/packages`, pkg);
  }

  deletePackage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/packages/${id}`);
  }
}
