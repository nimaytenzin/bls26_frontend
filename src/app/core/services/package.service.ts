// package.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Package } from '../models/package.model';


@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private apiUrl = 'http://localhost:3000/packages';

  constructor(private http: HttpClient) {}

  getPackagesByFacility(facilityId: string): Observable<Package[]> {
    return this.http.get<Package[]>(`${this.apiUrl}?facilityId=${facilityId}`);
  }

  addPackage(pkg: Package): Observable<Package> {
    return this.http.post<Package>(this.apiUrl, pkg);
  }

  updatePackage(pkg: Package): Observable<Package> {
    return this.http.put<Package>(`${this.apiUrl}/${pkg.id}`, pkg);
  }

	deletePackage(id: string): Observable<void> {
		return this.http.delete<void>(`/api/packages/${id}`);
	}
}
