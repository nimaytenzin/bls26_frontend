import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Announcement } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private apiUrl = 'http://localhost:3000/announcements';
  private announcementsSubject = new BehaviorSubject<Announcement[]>([]);
  announcements$ = this.announcementsSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(this.apiUrl).pipe(
      tap(data => this.announcementsSubject.next(data))
    );
  }

  addAnnouncement(data: Announcement): Observable<Announcement> {
    return this.http.post<Announcement>(this.apiUrl, data);
  }

  deleteAnnouncement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateAnnouncement(id: number, data: Partial<Announcement>): Observable<Announcement> {
    return this.http.patch<Announcement>(`${this.apiUrl}/${id}`, data);
  }

  likeAnnouncement(id: number, userId: string): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/${id}/like`, { userId });
  }

  addComment(id: number, comment: { user: string; text: string }): Observable<Announcement> {
    return this.http.post<Announcement>(`${this.apiUrl}/${id}/comment`, comment);
  }

  filterAnnouncements(type?: string, dateRange?: { from: string; to: string }): Observable<Announcement[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (dateRange?.from) params = params.set('from', dateRange.from);
    if (dateRange?.to) params = params.set('to', dateRange.to);
    return this.http.get<Announcement[]>(this.apiUrl, { params });
  }
}
