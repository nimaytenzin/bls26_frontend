import { Injectable } from '@angular/core';
import { API_URL } from '../core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { ChildNoteDto } from '../core/dto/ems';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChildNoteService {

  private apiUrl = API_URL + '/child-notes';

  constructor(private http: HttpClient) { }

  createChildNote(childNote: ChildNoteDto): Observable<ChildNoteDto> {
    return this.http.post<ChildNoteDto>(`${this.apiUrl}`, childNote);
  }
}
