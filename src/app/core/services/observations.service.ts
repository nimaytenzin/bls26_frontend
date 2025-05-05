import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Observation } from '../models/observation.model';

@Injectable({ providedIn: 'root' })
export class ObservationsService {
  private api = 'http://localhost:3000/observations';
  private observationsSubject = new BehaviorSubject<Observation[]>([]);
  observations$ = this.observationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getObservations(): void {
    this.http.get<Observation[]>(this.api).subscribe({
      next: (data) => this.observationsSubject.next(data),
      error: (err) => console.error('Failed to load observations:', err)
    });
  }

  addObservation(observation: Observation): Observable<Observation> {
    return this.http.post<Observation>(this.api, observation);
  }

  updateObservation(id: number, observation: Observation): Observable<Observation> {
    return this.http.put<Observation>(`${this.api}/${id}`, observation);
  }

  deleteObservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
