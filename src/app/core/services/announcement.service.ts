import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Announcement {
  id?: number;
  title: string;
  message: string;
  date: string;
  type: 'announcement' | 'event';
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private apiUrl = 'http://localhost:3000/announcements';
  private announcementsSubject = new BehaviorSubject<Announcement[]>([]);
  announcements$ = this.announcementsSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl);
  }

  addAnnouncement(data: Announcement): Observable<Announcement> {
    return this.http.post<Announcement>(this.apiUrl, data);
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateAnnouncement(id: number, data: Announcement): Observable<Announcement> {
    return this.http.put<Announcement>(`${this.apiUrl}/${id}`, data);
  }
}
