import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private apiUrl = 'http://localhost:3000'; // Adjust if your json-server runs elsewhere

  constructor(private http: HttpClient) {}

  // Get available packages (e.g., for selection)
  getPackages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/packages`);
  }

  // Register child (adds to "children" array)
  registerChild(childDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/children`, childDto);
  }

  // Register child note (adds to "childNotes" array)
  registerChildNote(childNoteDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/childNotes`, childNoteDto);
  }

  // Log selected package (e.g., log to "childPackages" or "registrations" array)
  registerChildPackage(packageDto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/childPackages`, packageDto);
  }

  // Register each parent under "parents"
  registerParents(parents: any[], childId: number): Observable<any[]> {
    const requests = parents.map(parent =>
      this.http.post(`${this.apiUrl}/parents`, { ...parent, childId })
    );
    return forkJoin(requests);
  }

  // Orchestrates full registration
  completeRegistration(formData: any): Observable<any> {
    return this.registerChild(formData.child).pipe(
      switchMap(child => {
        const childId = child.id;

        return forkJoin([
          this.registerChildNote({ ...formData.childNote, childId }),
          this.registerChildPackage({ ...formData.packageForm, childId }),
          this.registerParents(formData.parents, childId)
        ]);
      })
    );
  }
}
