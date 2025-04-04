import { Injectable } from '@angular/core';
import { API_URL } from '../core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { UserDTO } from '../core/dto/ems';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EMSUserDataService{
  private apiUrl = API_URL + "/user"

  constructor(private http: HttpClient) { }

  getParentByCid(cid: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/parent/${cid}`);
  }

  createParent(parent: UserDTO) {
    return this.http.post<UserDTO>(`${this.apiUrl}/register-parent`, parent);
  }

}
