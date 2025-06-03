import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Owner } from '../models/owner.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OwnerService {
  private apiUrl = 'http://localhost:3000/owners'; // your API or json-server

  constructor(private http: HttpClient) {}

  registerOwner(owner: Owner): Observable<Owner> {
    return this.http.post<Owner>(this.apiUrl, owner);
  }
}
