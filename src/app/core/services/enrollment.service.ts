import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { Child, ChildNote } from '../models/child.model';
import { Parent } from '../models/parent.model';
import { Guardian } from '../models/guardian.model';
import { EnrollmentDto } from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Get available packages
  getPackages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/packages`);
  }

  // Enroll child
  enrollChild(child: Child): Observable<Child> {
    return this.http.post<Child>(`${this.apiUrl}/children`, child);
  }

  // Enroll child note
  enrollChildNote(note: ChildNote): Observable<ChildNote> {
    return this.http.post<ChildNote>(`${this.apiUrl}/childNotes`, note);
  }

  // Enroll parents
  enrollParents(parents: Parent[], childId: number): Observable<Parent[]> {
    const requests = parents.map(parent =>
      this.http.post<Parent>(`${this.apiUrl}/parents`, { ...parent, childId })
    );
    return forkJoin(requests);
  }

  // Enroll guardians
  enrollGuardians(guardians: Guardian[], childId: number): Observable<Guardian[]> {
    const requests = guardians.map(guardian =>
      this.http.post<Guardian>(`${this.apiUrl}/guardians`, { ...guardian, childId })
    );
    return forkJoin(requests);
  }

  // Create final enrollment
  createEnrollment(enrollment: EnrollmentDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/enrollments`, enrollment);
  }

  // Update enrollment
  updateEnrollment(id: string, enrollment: EnrollmentDto): Observable<EnrollmentDto> {
    return this.http.put<EnrollmentDto>(`${this.apiUrl}/enrollments/${id}`, enrollment);
  }
 }
