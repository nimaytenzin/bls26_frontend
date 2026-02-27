import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EnumerationArea } from '../enumeration-area/enumeration-area.service';

export interface Dzongkhag {
	id: number;
	name: string;
	areaCode: string;
	enumerationAreas:EnumerationArea[]
}

export interface DzongkhagStatistics {
	dzongkhagId: number;
	totalEnumerationAreas: number;
	totalStructures: number;
	totalHouseholds: number;
}

export interface EnumerationAreaSummary {
	id: number;
	name: string;
	description?: string;
	areaCode: string;
	dzongkhagId?: number;
	status?: string;
	[key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class DzongkhagService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/dzongkhags`;

	constructor(private http: HttpClient) {}

	getAll(): Observable<Dzongkhag[]> {
		return this.http.get<Dzongkhag[]>(this.baseUrl);
	}

	getById(id: number): Observable<Dzongkhag> {
		return this.http.get<Dzongkhag>(`${this.baseUrl}/${id}`);
	}

	getStatistics(id: number): Observable<DzongkhagStatistics> {
		return this.http.get<DzongkhagStatistics>(`${this.baseUrl}/${id}/statistics`);
	}

	getEnumerationAreas(id: number): Observable<EnumerationAreaSummary[]> {
		return this.http.get<EnumerationAreaSummary[]>(
			`${this.baseUrl}/${id}/enumeration-areas`
		);
	}
}
