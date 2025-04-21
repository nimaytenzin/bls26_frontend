// src/app/facility/facility-context.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FacilityContextService {
  private facilityIdSubject = new BehaviorSubject<number | null>(null);
  selectedFacilityId$ = this.facilityIdSubject.asObservable();

  setFacility(id: number) {
    this.facilityIdSubject.next(id);
  }

  getFacilityId(): number | null {
    return this.facilityIdSubject.value;
  }
}
