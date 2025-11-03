import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	CreateHistoricalHouseholdListingDto,
	HistoricalHouseholdListing,
	UpdateHistoricalHouseholdListingDto,
	HistoricalStatistics,
} from './historical-household-listing.dto';

@Injectable({
	providedIn: 'root',
})
export class HistoricalHouseholdListingDataService {
	private readonly apiUrl = `${BASEAPI_URL}/historical-household-listing`;

	constructor(private http: HttpClient) {}

	/**
	 * Create a new historical household listing
	 * Requires authentication: ADMIN, SUPERVISOR, or ENUMERATOR
	 */
	createHistoricalListing(
		data: CreateHistoricalHouseholdListingDto
	): Observable<ApiResponse<HistoricalHouseholdListing>> {
		return this.http
			.post<ApiResponse<HistoricalHouseholdListing>>(this.apiUrl, data)
			.pipe(
				catchError((error) => {
					console.error('Error creating historical listing:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all historical household listings
	 * Public endpoint - no authentication required
	 * Returns records ordered by year ascending
	 */
	findAllHistoricalListings(): Observable<HistoricalHouseholdListing[]> {
		return this.http.get<HistoricalHouseholdListing[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching historical listings:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get historical listings by enumeration area ID (using query param)
	 * Public endpoint - no authentication required
	 * Returns records ordered by year ascending
	 */
	findHistoricalListingsByEnumerationArea(
		eaId: number
	): Observable<HistoricalHouseholdListing[]> {
		return this.http
			.get<HistoricalHouseholdListing[]>(
				`${this.apiUrl}?enumerationAreaId=${eaId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching historical listings by enumeration area:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get historical listings by enumeration area ID (using route param)
	 * Public endpoint - no authentication required
	 * Returns records ordered by year ascending
	 */
	findHistoricalListingsByEnumerationAreaRoute(
		eaId: number
	): Observable<HistoricalHouseholdListing[]> {
		return this.http
			.get<HistoricalHouseholdListing[]>(
				`${this.apiUrl}/by-enumeration-area/${eaId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching historical listings by enumeration area (route):',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get a single historical listing by ID
	 * Public endpoint - no authentication required
	 */
	findHistoricalListingById(
		id: number
	): Observable<HistoricalHouseholdListing> {
		return this.http
			.get<HistoricalHouseholdListing>(`${this.apiUrl}/${id}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching historical listing:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update an existing historical listing
	 * Requires authentication: ADMIN, SUPERVISOR, or ENUMERATOR
	 */
	updateHistoricalListing(
		id: number,
		data: UpdateHistoricalHouseholdListingDto
	): Observable<ApiResponse<HistoricalHouseholdListing>> {
		return this.http
			.patch<ApiResponse<HistoricalHouseholdListing>>(
				`${this.apiUrl}/${id}`,
				data
			)
			.pipe(
				catchError((error) => {
					console.error('Error updating historical listing:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete a historical listing
	 * Requires authentication: ADMIN only
	 */
	deleteHistoricalListing(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting historical listing:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Calculate historical statistics for a given dataset
	 */
	calculateStatistics(
		listings: HistoricalHouseholdListing[]
	): HistoricalStatistics {
		if (listings.length === 0) {
			return {
				totalYears: 0,
				firstYear: 0,
				lastYear: 0,
				averageHouseholds: 0,
				maxHouseholds: 0,
				minHouseholds: 0,
				trend: 'stable',
			};
		}

		const years = listings.map((l) => l.year).sort((a, b) => a - b);
		const householdCounts = listings.map((l) => l.householdCount);

		const firstYear = Math.min(...years);
		const lastYear = Math.max(...years);
		const totalHouseholds = householdCounts.reduce(
			(sum, count) => sum + count,
			0
		);
		const averageHouseholds = totalHouseholds / listings.length;
		const maxHouseholds = Math.max(...householdCounts);
		const minHouseholds = Math.min(...householdCounts);

		// Calculate trend (simple comparison of first and last year data)
		let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
		if (listings.length >= 2) {
			const firstYearData = listings.find((l) => l.year === firstYear);
			const lastYearData = listings.find((l) => l.year === lastYear);

			if (firstYearData && lastYearData) {
				if (lastYearData.householdCount > firstYearData.householdCount) {
					trend = 'increasing';
				} else if (lastYearData.householdCount < firstYearData.householdCount) {
					trend = 'decreasing';
				}
			}
		}

		return {
			totalYears: listings.length,
			firstYear,
			lastYear,
			averageHouseholds: Number(averageHouseholds.toFixed(1)),
			maxHouseholds,
			minHouseholds,
			trend,
		};
	}

	/**
	 * Get years with missing data in a range
	 */
	getMissingYears(
		listings: HistoricalHouseholdListing[],
		startYear?: number,
		endYear?: number
	): number[] {
		if (listings.length === 0) return [];

		const existingYears = new Set(listings.map((l) => l.year));
		const firstYear = startYear || Math.min(...existingYears);
		const lastYear = endYear || Math.max(...existingYears);

		const missingYears: number[] = [];
		for (let year = firstYear; year <= lastYear; year++) {
			if (!existingYears.has(year)) {
				missingYears.push(year);
			}
		}

		return missingYears;
	}

	/**
	 * Check if a year already exists for an enumeration area
	 */
	checkYearExists(
		listings: HistoricalHouseholdListing[],
		year: number
	): boolean {
		return listings.some((l) => l.year === year);
	}
}
