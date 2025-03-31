import { Injectable } from '@angular/core';
import { API_URL, BASE_URL } from '../core/constants/constants';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChildDto } from '../core/dto/ems';

@Injectable({
  providedIn: 'root'
})
export class ChildService {

  private apiUrl = API_URL + '/child';
  private baseUrl = BASE_URL;

  constructor(private http: HttpClient) { }

  getChildByStudentCode(studentCode: string): Observable<ChildDto> {
    return this.http.get<ChildDto>(`${this.apiUrl}/student-code/${studentCode}`);
  }

  uploadPhoto(file: File): Observable<string | null> {
    const formData = new FormData();
    formData.append('photo', file);

    return new Observable<string | null>((observer) => {
      this.http.post<{ filename: string }>(`${this.apiUrl}/upload-photo`, formData).subscribe({
        next: (response) => {
          const filePath = `${this.baseUrl}/images/${response.filename}`;
          observer.next(filePath);
          observer.complete();
        },
        error: () => {
          observer.next(null);
          observer.complete();
        }
      });
    });
  }
}
