import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  constructor(private http: HttpClient) {}

  getPackages(): Observable<any[]> {
    return this.http.get<any[]>('/api/packages');
  }

  registerChild(childDto: any): Observable<any> {
    return this.http.post('/api/children', childDto);
  }

  registerChildNote(childNoteDto: any): Observable<any> {
    return this.http.post('/api/child-notes', childNoteDto);
  }

  registerChildPackage(packageDto: any): Observable<any> {
    return this.http.post('/api/packages', packageDto);
  }

  registerParents(parents: any[], childId: number): Observable<any[]> {
    const requests = parents.map(parent =>
      this.http.post('/api/parents', { ...parent, childId })
    );
    return forkJoin(requests);
  }

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
