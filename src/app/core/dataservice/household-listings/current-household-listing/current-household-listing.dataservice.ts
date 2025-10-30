import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	CreateCurrentHouseholdListingDto,
	CurrentHouseholdListing,
	UpdateCurrentHouseholdListingDto,
} from './current-household-listing.dto';

@Injectable({
	providedIn: 'root',
})
export class CurrentHouseholdListingDataService {
	private readonly apiUrl = `${BASEAPI_URL}/current-household-listing`;

	constructor(private http: HttpClient) {}

	/**
	 * Create a new household listing
	 * Requires authentication: ADMIN, SUPERVISOR, or ENUMERATOR
	 */
	createHouseholdListing(
		data: CreateCurrentHouseholdListingDto
	): Observable<ApiResponse<CurrentHouseholdListing>> {
		return this.http
			.post<ApiResponse<CurrentHouseholdListing>>(this.apiUrl, data)
			.pipe(
				catchError((error) => {
					console.error('Error creating household listing:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all household listings
	 * Public endpoint - no authentication required
	 */
	findAllHouseholdListings(): Observable<CurrentHouseholdListing[]> {
		return this.http.get<CurrentHouseholdListing[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching household listings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get household listings by enumeration area ID (using query param)
	 * Public endpoint - no authentication required
	 */
	findHouseholdListingsByEnumerationArea(
		eaId: number
	): Observable<CurrentHouseholdListing[]> {
		return this.http
			.get<CurrentHouseholdListing[]>(`${this.apiUrl}?eaId=${eaId}`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching household listings by enumeration area:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get household listings by enumeration area ID (using route param)
	 * Public endpoint - no authentication required
	 */
	findHouseholdListingsByEnumerationAreaRoute(
		eaId: number
	): Observable<CurrentHouseholdListing[]> {
		return this.http
			.get<CurrentHouseholdListing[]>(
				`${this.apiUrl}/by-enumeration-area/${eaId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching household listings by enumeration area (route):',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get a single household listing by ID
	 * Public endpoint - no authentication required
	 */
	findHouseholdListingById(id: number): Observable<CurrentHouseholdListing> {
		return this.http.get<CurrentHouseholdListing>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching household listing:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update an existing household listing
	 * Requires authentication: ADMIN, SUPERVISOR, or ENUMERATOR
	 */
	updateHouseholdListing(
		id: number,
		data: UpdateCurrentHouseholdListingDto
	): Observable<ApiResponse<CurrentHouseholdListing>> {
		return this.http
			.patch<ApiResponse<CurrentHouseholdListing>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating household listing:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete a household listing
	 * Requires authentication: ADMIN or SUPERVISOR
	 */
	deleteHouseholdListing(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting household listing:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get total members for a household listing
	 */
	getTotalMembers(listing: CurrentHouseholdListing): number {
		return listing.totalMale + listing.totalFemale;
	}

	/**
	 * Get gender ratio as percentage
	 */
	getGenderRatio(listing: CurrentHouseholdListing): {
		malePercentage: number;
		femalePercentage: number;
	} {
		const total = this.getTotalMembers(listing);
		if (total === 0) {
			return { malePercentage: 0, femalePercentage: 0 };
		}
		return {
			malePercentage: (listing.totalMale / total) * 100,
			femalePercentage: (listing.totalFemale / total) * 100,
		};
	}
}
