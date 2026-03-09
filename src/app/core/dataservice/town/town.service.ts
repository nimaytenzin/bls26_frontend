import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Lap } from '../lap/lap.service';

export interface Town {
	id: number;
	name: string;
	areaCode: string;
	dzongkhagId: number;
	laps?: Lap[];
}

@Injectable({ providedIn: 'root' })
export class TownService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/towns`;

	constructor(private http: HttpClient) {}

	getAll(dzongkhagId?: number): Observable<Town[]> {
		let params = new HttpParams();
		if (dzongkhagId != null) {
			params = params.set('dzongkhagId', String(dzongkhagId));
		}
		return this.http.get<Town[]>(this.baseUrl, { params });
	}

	getById(id: number): Observable<Town> {
		return this.http.get<Town>(`${this.baseUrl}/${id}`);
	}
}
