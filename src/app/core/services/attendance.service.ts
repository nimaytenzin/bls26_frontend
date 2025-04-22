// src/app/core/services/attendance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Attendance {
  id?: number;
  childId: number;
  facilityId: string;
  date: string;
  session: string;
  status: 'Present' | 'Absent';
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAttendanceByFacility(facilityId: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.apiUrl}/attendances?facilityId=${facilityId}`);
  }

  getChildrenByFacility(facilityId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/children?facilityId=${facilityId}`);
  }

	getFacilitatorsByFacility(facilityId: string): Observable<any[]> {
		return this.http.get<any[]>(`${this.apiUrl}/facilitators?facilityId=${facilityId}`);
	}

  addAttendance(record: Attendance): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/attendances`, record);
  }

  saveBulkAttendance(records: Attendance[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendances`, records); // use mock logic or backend update
  }

  updateAttendance(id: number, record: Attendance): Observable<Attendance> {
    return this.http.put<Attendance>(`${this.apiUrl}/attendances/${id}`, record);
  }

  deleteAttendance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attendances/${id}`);
  }
}
