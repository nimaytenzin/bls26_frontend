// facility.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private facilityIdSubject = new BehaviorSubject<number | null>(null);
  selectedFacilityId$ = this.facilityIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Context Management
  setFacility(id: number): void {
    this.facilityIdSubject.next(id);
  }

  getFacilityId(): number | null {
    return this.facilityIdSubject.value;
  }

  // CRUD operations
  getFacilitiesByOwner(ownerId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/facilities?ownerId=${ownerId}`);
  }

  getAllFacilities(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/facilities');
  }

  addFacility(data: any): Observable<any> {
    return this.http.post('http://localhost:3000/facilities', data);
  }

  updateFacility(id: number, data: any): Observable<any> {
    return this.http.patch(`http://localhost:3000/facilities/${id}`, data);
  }

  deleteFacility(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/facilities/${id}`);
  }
}
