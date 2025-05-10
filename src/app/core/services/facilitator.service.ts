import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facilitator } from '../models/facilitator.model';

@Injectable({ providedIn: 'root' })
  export class FacilitatorService {
    private apiUrl = 'http://localhost:3000/facilitators';

    constructor(private http: HttpClient) {}

    getFacilitators(): Observable<Facilitator[]> {
      return this.http.get<Facilitator[]>(this.apiUrl);
    }

    addFacilitator(facilitator: Facilitator): Observable<Facilitator> {
      return this.http.post<Facilitator>(this.apiUrl, facilitator);
    }

    updateFacilitator(facilitator: Facilitator): Observable<Facilitator> {
      return this.http.put<Facilitator>(`${this.apiUrl}/${facilitator.id}`, facilitator);
    }

    archiveFacilitator(id: string): Observable<void> { // Changed id to string
      return this.http.patch<void>(`${this.apiUrl}/${id}`, { archived: true });
    }
  }
