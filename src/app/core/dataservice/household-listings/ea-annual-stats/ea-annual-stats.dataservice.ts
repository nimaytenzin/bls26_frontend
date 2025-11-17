import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	CreateEAAnnualStatsDto,
	EAAnnualStats,
	UpdateEAAnnualStatsDto,
	HistoricalStatistics,
} from './ea-annual-stats.dto';

@Injectable({
	providedIn: 'root',
})
export class EAAnnualStatsDataService {
	private readonly apiUrl = `${BASEAPI_URL}/ea-annual-stats`;

	constructor(private http: HttpClient) {}

	/**
	 * Create a new EA annual stats record
	 * Requires authentication: ADMIN, SUPERVISOR, or ENUMERATOR
	 */
	createEAAnnualStats(
		data: CreateEAAnnualStatsDto
	): Observable<ApiResponse<EAAnnualStats>> {
		return this.http.post<ApiResponse<EAAnnualStats>>(this.apiUrl, data).pipe(
			catchError((error) => {
				console.error('Error creating EA annual stats:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all EA annual stats records
	 * Public endpoint - no authentication required
	 * Returns records ordered by year ascending
	 */
	findAllEAAnnualStats(): Observable<EAAnnualStats[]> {
		return this.http.get<EAAnnualStats[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching EA annual stats:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * GET /ea-annual-stats/history/:enumerationAreaId
	 * Get historical records for a specific Enumeration Area
	 * Returns all annual statistics ordered by year (ascending)
	 * Accessible by all authenticated users
	 */
	getHistoricalRecords(enumerationAreaId: number): Observable<EAAnnualStats[]> {
		return this.http
			.get<EAAnnualStats[]>(`${this.apiUrl}/history/${enumerationAreaId}`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching historical records:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get EA annual stats by enumeration area ID (using query param)
	 * Public endpoint - no authentication required
	 * Returns records ordered by year ascending
	 */
	findEAAnnualStatsByEnumerationArea(
		eaId: number
	): Observable<EAAnnualStats[]> {
		return this.http
			.get<EAAnnualStats[]>(`${this.apiUrl}?enumerationAreaId=${eaId}`)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching EA annual stats by enumeration area:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get a single EA annual stats record by ID
	 * Public endpoint - no authentication required
	 */
	findEAAnnualStatsById(id: number): Observable<EAAnnualStats> {
		return this.http.get<EAAnnualStats>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching EA annual stats:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update an existing EA annual stats record
	 * Requires authentication: ADMIN, SUPERVISOR, or ENUMERATOR
	 */
	updateEAAnnualStats(
		id: number,
		data: UpdateEAAnnualStatsDto
	): Observable<ApiResponse<EAAnnualStats>> {
		return this.http
			.patch<ApiResponse<EAAnnualStats>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating EA annual stats:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete an EA annual stats record
	 * Requires authentication: ADMIN only
	 */
	deleteEAAnnualStats(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting EA annual stats:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Calculate historical statistics for a given dataset
	 */
	calculateStatistics(stats: EAAnnualStats[]): HistoricalStatistics {
		if (stats.length === 0) {
			return {
				totalYears: 0,
				firstYear: 0,
				lastYear: 0,
				averageHouseholds: 0,
				maxHouseholds: 0,
				minHouseholds: 0,
				averageMale: 0,
				averageFemale: 0,
				averagePopulation: 0,
				trend: 'stable',
			};
		}

		const years = stats.map((s) => s.year).sort((a, b) => a - b);
		const householdCounts = stats.map((s) => s.totalHouseholds);
		const maleCounts = stats.map((s) => s.totalMale);
		const femaleCounts = stats.map((s) => s.totalFemale);

		const firstYear = Math.min(...years);
		const lastYear = Math.max(...years);
		const totalHouseholds = householdCounts.reduce(
			(sum, count) => sum + count,
			0
		);
		const totalMale = maleCounts.reduce((sum, count) => sum + count, 0);
		const totalFemale = femaleCounts.reduce((sum, count) => sum + count, 0);

		const averageHouseholds = totalHouseholds / stats.length;
		const averageMale = totalMale / stats.length;
		const averageFemale = totalFemale / stats.length;
		const averagePopulation = averageMale + averageFemale;

		const maxHouseholds = Math.max(...householdCounts);
		const minHouseholds = Math.min(...householdCounts);

		// Calculate trend (simple comparison of first and last year data)
		let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
		if (stats.length >= 2) {
			const firstYearData = stats.find((s) => s.year === firstYear);
			const lastYearData = stats.find((s) => s.year === lastYear);

			if (firstYearData && lastYearData) {
				const firstPopulation =
					firstYearData.totalMale + firstYearData.totalFemale;
				const lastPopulation =
					lastYearData.totalMale + lastYearData.totalFemale;

				if (lastPopulation > firstPopulation) {
					trend = 'increasing';
				} else if (lastPopulation < firstPopulation) {
					trend = 'decreasing';
				}
			}
		}

		return {
			totalYears: stats.length,
			firstYear,
			lastYear,
			averageHouseholds: Number(averageHouseholds.toFixed(1)),
			maxHouseholds,
			minHouseholds,
			averageMale: Number(averageMale.toFixed(1)),
			averageFemale: Number(averageFemale.toFixed(1)),
			averagePopulation: Number(averagePopulation.toFixed(1)),
			trend,
		};
	}

	/**
	 * Get years with missing data in a range
	 */
	getMissingYears(
		stats: EAAnnualStats[],
		startYear?: number,
		endYear?: number
	): number[] {
		if (stats.length === 0) return [];

		const existingYears = new Set(stats.map((s) => s.year));
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
	checkYearExists(stats: EAAnnualStats[], year: number): boolean {
		return stats.some((s) => s.year === year);
	}
}
