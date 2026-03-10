import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HouseholdListing {
	id: number;
	structureId: number;
	userId: number;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
}

export interface CreateHouseholdListingDto {
	structureId: number;
	userId: number;
	householdIdentification: string;
	householdSerialNumber: number;
	nameOfHOH: string;
	totalMale: number;
	totalFemale: number;
	phoneNumber?: string;
	remarks?: string;
}

export interface BulkHouseholdListingsDto {
	householdListings: CreateHouseholdListingDto[];
}

@Injectable({ providedIn: 'root' })
export class HouseholdListingService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/household-listings`;

	constructor(private http: HttpClient) {}

	getAll(params?: {
		eaId?: number;
		userId?: number;
		structureId?: number;
	}): Observable<HouseholdListing[]> {
		let httpParams = new HttpParams();
		if (params?.eaId != null) {
			httpParams = httpParams.set('eaId', String(params.eaId));
		}
		if (params?.userId != null) {
			httpParams = httpParams.set('userId', String(params.userId));
		}
		if (params?.structureId != null) {
			httpParams = httpParams.set('structureId', String(params.structureId));
		}
		return this.http.get<HouseholdListing[]>(this.baseUrl, {
			params: httpParams,
		});
	}

	getByUser(userId: number): Observable<HouseholdListing[]> {
		return this.http.get<HouseholdListing[]>(
			`${this.baseUrl}/user/${userId}`
		);
	}

	getByStructure(structureId: number): Observable<HouseholdListing[]> {
		return this.http.get<HouseholdListing[]>(
			`${this.baseUrl}/structure/${structureId}`
		);
	}

	getById(id: number): Observable<HouseholdListing> {
		return this.http.get<HouseholdListing>(`${this.baseUrl}/${id}`);
	}

	create(dto: CreateHouseholdListingDto): Observable<HouseholdListing> {
		return this.http.post<HouseholdListing>(this.baseUrl, dto);
	}

	bulkCreate(dto: BulkHouseholdListingsDto): Observable<HouseholdListing[]> {
		return this.http.post<HouseholdListing[]>(`${this.baseUrl}/bulk`, dto);
	}

	update(
		id: number,
		dto: Partial<CreateHouseholdListingDto>
	): Observable<HouseholdListing> {
		return this.http.put<HouseholdListing>(`${this.baseUrl}/${id}`, dto);
	}

	patch(
		id: number,
		dto: Partial<CreateHouseholdListingDto>
	): Observable<HouseholdListing> {
		return this.http.patch<HouseholdListing>(`${this.baseUrl}/${id}`, dto);
	}

	delete(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/${id}`);
	}

	deleteByEa(eaId: number): Observable<number> {
		return this.http.delete<number>(`${this.baseUrl}/by-ea/${eaId}`);
	}
}
