import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type EaStatus = 'incomplete' | 'in_progress' | 'completed';

/** GeoJSON geometry as returned by API (e.g. MultiPolygon with EPSG:4326) */
export interface EaGeom {
	crs?: { type: string; properties: { name: string } };
	type: string;
	coordinates: number[][] | number[][][] | number[][][][];
}

export interface EnumerationArea {
	id: number;
	name: string;
	description: string;
	areaCode: string;
	fullEaCode?: string;
	dzongkhagId?: number;
	lapId?: number;
	status: EaStatus;
	geom?: string | EaGeom;
}

export interface CreateEaDto {
	dzongkhagId?: number;
	name: string;
	description: string;
	areaCode: string;
	status?: EaStatus;
	geom?: string;
}

export interface EaProgress {
	totalStructures: number;
	totalHouseholds: number;
	status: EaStatus;
}

@Injectable({ providedIn: 'root' })
export class EnumerationAreaService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/enumeration-areas`;

	constructor(private http: HttpClient) {}

	getAll(params?: {
		dzongkhagId?: number;
		status?: EaStatus;
	}): Observable<EnumerationArea[]> {
		let httpParams = new HttpParams();
		if (params?.dzongkhagId != null) {
			httpParams = httpParams.set('dzongkhagId', String(params.dzongkhagId));
		}
		if (params?.status) {
			httpParams = httpParams.set('status', params.status);
		}
		return this.http.get<EnumerationArea[]>(this.baseUrl, { params: httpParams });
	}

	getById(
		id: number,
		withGeom = false,
		includeStructures = false
	): Observable<EnumerationArea> {
		let httpParams = new HttpParams();
		if (withGeom) httpParams = httpParams.set('withGeom', 'true');
		if (includeStructures) httpParams = httpParams.set('includeStructures', 'true');
		return this.http.get<EnumerationArea>(`${this.baseUrl}/${id}`, {
			params: httpParams,
		});
	}

	getProgress(id: number): Observable<EaProgress> {
		return this.http.get<EaProgress>(`${this.baseUrl}/${id}/progress`);
	}

	create(dto: CreateEaDto): Observable<EnumerationArea> {
		return this.http.post<EnumerationArea>(this.baseUrl, dto);
	}

	updateStatus(id: number, status: EaStatus): Observable<EnumerationArea> {
		return this.http.patch<EnumerationArea>(`${this.baseUrl}/${id}/status`, {
			status,
		});
	}

	complete(id: number): Observable<EnumerationArea> {
		return this.http.post<EnumerationArea>(`${this.baseUrl}/${id}/complete`, {});
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}
