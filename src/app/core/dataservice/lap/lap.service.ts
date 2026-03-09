import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EnumerationArea } from '../enumeration-area/enumeration-area.service';

export interface Lap {
	id: number;
	name: string;
	areaCode: string;
	townId: number;
	enumerationAreas?: EnumerationArea[];
}

@Injectable({ providedIn: 'root' })
export class LapService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/laps`;

	constructor(private http: HttpClient) {}

	getAll(townId?: number): Observable<Lap[]> {
		let params = new HttpParams();
		if (townId != null) {
			params = params.set('townId', String(townId));
		}
		return this.http.get<Lap[]>(this.baseUrl, { params });
	}

	getById(id: number): Observable<Lap> {
		return this.http.get<Lap>(`${this.baseUrl}/${id}`);
	}
}
