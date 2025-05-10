import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Child } from '../models/child.model';

@Injectable({ providedIn: 'root' })
export class ChildService {
  private apiUrl = 'http://localhost:3000'; // adjust if needed for json-server or backend

  constructor(private http: HttpClient) {}

  getChildren(): Observable<Child[]> {
    return this.http.get<Child[]>(`${this.apiUrl}/children`);
  }

  getChildById(id: string): Observable<Child> {
    return this.http.get<Child>(`${this.apiUrl}/children/${id}`);
  }
}
