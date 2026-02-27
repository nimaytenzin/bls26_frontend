import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Structure {
	id: number;
	enumerationAreaId: number;
	structureNumber: string;
	latitude?: number;
	longitude?: number;
}

export interface CreateStructureDto {
	enumerationAreaId: number;
	structureNumber: string;
	latitude?: number;
	longitude?: number;
}

export interface BulkStructuresDto {
	structures: CreateStructureDto[];
}

@Injectable({ providedIn: 'root' })
export class StructureService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/structures`;

	constructor(private http: HttpClient) {}

	getAll(enumerationAreaId?: number): Observable<Structure[]> {
		let params = new HttpParams();
		if (enumerationAreaId != null) {
			params = params.set('enumerationAreaId', String(enumerationAreaId));
		}
		return this.http.get<Structure[]>(this.baseUrl, { params });
	}

	getById(id: number): Observable<Structure> {
		return this.http.get<Structure>(`${this.baseUrl}/${id}`);
	}

	/** Next available structure number for the same EA as the given structure. */
	getNextStructureNumber(structureId: number): Observable<{ nextNumber: string }> {
		return this.http.get<{ nextNumber: string }>(
			`${this.baseUrl}/${structureId}/next-structure-number`
		);
	}

	create(dto: CreateStructureDto): Observable<Structure> {
		return this.http.post<Structure>(this.baseUrl, dto);
	}

	bulkCreate(dto: BulkStructuresDto): Observable<Structure[]> {
		return this.http.post<Structure[]>(`${this.baseUrl}/bulk`, dto);
	}

	update(id: number, dto: Partial<CreateStructureDto>): Observable<Structure> {
		return this.http.patch<Structure>(`${this.baseUrl}/${id}`, dto);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}
}
