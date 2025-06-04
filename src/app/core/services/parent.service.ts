import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Parent } from '../models/parent.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class ParentService {
  constructor(private http: HttpClient) {}

  registerParent(parent: Partial<Parent>) {
    return this.http.post('/api/parents', parent);
  }
}
