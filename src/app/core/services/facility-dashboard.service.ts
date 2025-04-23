import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FacilityDashboardService {
  constructor() {}

  getDashboardStats(): Observable<{
    totalEnrollments: number;
    activeFacilitators: number;
    upcomingEvents: number;
    pendingInvoices: number;
  }> {
    // Mock data; replace with API call if needed
    return of({
      totalEnrollments: 120,
      activeFacilitators: 15,
      upcomingEvents: 5,
      pendingInvoices: 8,
    });
  }

  getRecentActivities(): Observable<string[]> {
    // Mock data; replace with API call if needed
    return of([
      'John Doe enrolled in Package A',
      'New announcement posted: "Sports Day"',
      'Attendance updated for 04/23/2025',
    ]);
  }
}