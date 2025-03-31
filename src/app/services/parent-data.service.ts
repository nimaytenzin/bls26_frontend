import { Injectable } from '@angular/core';
import { API_URL } from '../core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { ParentDTO } from '../core/dto/ems';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParentDataService {
  private apiUrl = API_URL

  constructor(private http: HttpClient) { }

  gerParentByCid(cid: string): Observable<ParentDTO[]> {
    return this.http.get<ParentDTO[]>(`${this.apiUrl}/user/parent-profile/${cid}`);
  }

}
