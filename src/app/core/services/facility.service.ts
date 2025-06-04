// facility.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FacilityService {
  private readonly STORAGE_KEY = 'selectedFacilityId';

	private selectedFacilityIdSubject = new BehaviorSubject<number | null>(null);
	selectedFacilityId$ = this.selectedFacilityIdSubject.asObservable();

  private facilitiesSubject = new BehaviorSubject<any[]>([]);
  facilities$ = this.facilitiesSubject.asObservable();

  constructor(private http: HttpClient) {}

	setSelectedFacilityId(id: number): void {
    this.selectedFacilityIdSubject.next(id);
	}

	getFacilityId(): number | null {
		return this.selectedFacilityIdSubject.value;
	}

  private getStoredFacilityId(): number | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? +stored : null;
  }

  loadFacilitiesForOwner(ownerId: number): void {
    this.http.get<any[]>(`http://localhost:3000/facilities?ownerId=${ownerId}`)
      .pipe(tap(facilities => this.facilitiesSubject.next(facilities)))
      .subscribe();
  }

  getFacilitiesSnapshot(): any[] {
    return this.facilitiesSubject.value;
  }

  getAllFacilities(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/facilities');
  }

	addFacility(data: any): Observable<any> {
		return this.http.post('http://localhost:3000/facilities', {
			...data,
			ownerId: Number(data.ownerId) // Ensure ownerId is a number
		});
	}

  updateFacility(id: number, data: any): Observable<any> {
    return this.http.patch(`http://localhost:3000/facilities/${id}`, data);
  }

  deleteFacility(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/facilities/${id}`);
  }
}
