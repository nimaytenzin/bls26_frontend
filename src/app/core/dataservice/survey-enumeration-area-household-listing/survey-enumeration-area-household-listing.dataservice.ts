import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SurveyEnumerationAreaHouseholdListing,
	CreateSurveyEnumerationAreaHouseholdListingDto,
	BulkUploadResponse,
	HouseholdStatistics,
	CurrentHouseholdListingResponseDto,
} from './survey-enumeration-area-household-listing.dto';

/**
 * Survey Enumeration Area Household Listing Data Service
 * Handles HTTP operations for household listings
 */
@Injectable({
	providedIn: 'root',
})
export class SurveyEnumerationAreaHouseholdListingDataService {
	private apiUrl = `${BASEAPI_URL}/survey-enumeration-area-household-listing`;

	constructor(private http: HttpClient) {}

	/**
	 * Get HTTP headers with authentication token
	 */
	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('access_token');
		return new HttpHeaders({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * Download CSV template for household data entry
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of Blob (CSV file)
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	downloadTemplate(surveyEnumerationAreaId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/template/csv/${surveyEnumerationAreaId}`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading template for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Upload household listings in bulk
	 * @param listings Array of household listing DTOs
	 * @returns Observable of BulkUploadResponse
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	bulkUpload(
		listings: CreateSurveyEnumerationAreaHouseholdListingDto[]
	): Observable<BulkUploadResponse> {
		return this.http
			.post<BulkUploadResponse>(`${this.apiUrl}/bulk`, listings, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error uploading household listings:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all household listings for a survey enumeration area
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of household listing array
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getBySurveyEA(
		surveyEnumerationAreaId: number
	): Observable<SurveyEnumerationAreaHouseholdListing[]> {
		return this.http
			.get<SurveyEnumerationAreaHouseholdListing[]>(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching household listings for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get household statistics for a survey enumeration area
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of HouseholdStatistics
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getStatistics(
		surveyEnumerationAreaId: number
	): Observable<HouseholdStatistics> {
		return this.http
			.get<HouseholdStatistics>(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/statistics`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching statistics for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get current household listings for an enumeration area
	 * Retrieves the most recent validated household listing data
	 * @param enumerationAreaId - The ID of the enumeration area
	 * @returns Observable with the current household listing response
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getCurrentHouseholdListings(
		enumerationAreaId: number
	): Observable<CurrentHouseholdListingResponseDto> {
		const url = `${this.apiUrl}/current/enumeration-area/${enumerationAreaId}`;

		return this.http.get<CurrentHouseholdListingResponseDto>(url, {
			headers: this.getAuthHeaders(),
		});
	}
}
