import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = 'http://localhost:3000'; // Adjust if your json-server runs elsewhere

  constructor(private http: HttpClient) {}

  // Get available packages (e.g., for selection during enrollment)
  getPackages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/packages`);
  }

  // Enroll a child (adds to "children" array)
  enrollChild(childDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/children`, childDto);
  }

  // Add a note for the enrolled child (adds to "childNotes" array)
  enrollChildNote(childNoteDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/childNotes`, childNoteDto);
  }

  // Log selected package for the enrolled child
  enrollChildPackage(packageDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/childPackages`, packageDto);
  }

  // Enroll parents for the child
  enrollParents(parents: any[], childId: number): Observable<any[]> {
    const requests = parents.map(parent =>
      this.http.post(`${this.apiUrl}/parents`, { ...parent, childId })
    );
    return forkJoin(requests);
  }

  // Orchestrates full enrollment process
  completeEnrollment(formData: any): Observable<any> {
    return this.enrollChild(formData.child).pipe(
      switchMap(child => {
        const childId = child.id;

        return forkJoin([
          this.enrollChildNote({ ...formData.childNote, childId }),
          this.enrollChildPackage({ ...formData.packageForm, childId }),
          this.enrollParents(formData.parents, childId)
        ]);
      })
    );
  }
}