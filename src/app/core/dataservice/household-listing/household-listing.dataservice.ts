import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	HouseholdListing,
	CreateHouseholdListingDto,
	UpdateHouseholdListingDto,
	DeleteHouseholdListingResponse,
} from './household-listing.interface';

@Injectable({
	providedIn: 'root',
})
export class HouseholdListingDataService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/admin/household-listing`;

	constructor(private http: HttpClient) {}

	/**
	 * Create a new household listing entry
	 * @param createDto - Household listing data
	 * @returns Observable<HouseholdListing>
	 */
	createHouseholdListing(
		createDto: CreateHouseholdListingDto
	): Observable<HouseholdListing> {
		return this.http.post<HouseholdListing>(this.baseUrl, createDto);
	}

	/**
	 * Get all household listings for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey Enumeration Area ID
	 * @returns Observable<HouseholdListing[]>
	 */
	getHouseholdListings(
		surveyEnumerationAreaId: number
	): Observable<HouseholdListing[]> {
		return this.http.get<HouseholdListing[]>(
			`${this.baseUrl}/survey-ea/${surveyEnumerationAreaId}`
		);
	}

	/**
	 * Update an existing household listing
	 * @param id - Household listing ID
	 * @param updateDto - Update data
	 * @returns Observable<HouseholdListing>
	 */
	updateHouseholdListing(
		id: number,
		updateDto: UpdateHouseholdListingDto
	): Observable<HouseholdListing> {
		return this.http.patch<HouseholdListing>(
			`${this.baseUrl}/${id}`,
			updateDto
		);
	}

	/**
	 * Delete a household listing
	 * @param id - Household listing ID
	 * @returns Observable<DeleteHouseholdListingResponse>
	 */
	deleteHouseholdListing(
		id: number
	): Observable<DeleteHouseholdListingResponse> {
		return this.http.delete<DeleteHouseholdListingResponse>(
			`${this.baseUrl}/${id}`
		);
	}
}
