import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SurveyEnumerationAreaHouseholdListing,
	CreateSurveyEnumerationAreaHouseholdListingDto,
	BulkUploadResponse,
	HouseholdStatistics,
	HouseholdListingStatisticsResponseDto,
	CurrentHouseholdListingResponseDto,
	CreateBlankHouseholdListingsDto,
	CreateBlankHouseholdListingsResponseDto,
} from './survey-enumeration-area-household-listing.dto';
import {
	PaginationQueryDto,
	PaginatedResponse,
} from '../../utility/pagination.utility.service';

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
	 * Get statistics for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey Enumeration Area ID
	 * @returns Observable of household listing statistics for the enumeration area
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getStatisticsByEnumerationArea(
		surveyEnumerationAreaId: number
	): Observable<HouseholdListingStatisticsResponseDto> {
		return this.http
			.get<HouseholdListingStatisticsResponseDto>(
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
	 * Get statistics for an entire survey (across all enumeration areas)
	 * @param surveyId - Survey ID
	 * @returns Observable of household listing statistics for the entire survey (includes totalEnumerationAreas)
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getStatisticsBySurvey(
		surveyId: number
	): Observable<HouseholdListingStatisticsResponseDto> {
		return this.http
			.get<HouseholdListingStatisticsResponseDto>(
				`${this.apiUrl}/by-survey/${surveyId}/statistics`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching statistics for survey ${surveyId}:`,
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

	/**
	 * Get paginated household listings for a survey (across all enumeration areas)
	 * @param surveyId - Survey ID
	 * @param query - Pagination query parameters (page, limit, sortBy, sortOrder)
	 * @returns Observable of paginated household listings
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getBySurveyPaginated(
		surveyId: number,
		query: PaginationQueryDto
	): Observable<PaginatedResponse<SurveyEnumerationAreaHouseholdListing>> {
		const url = `${this.apiUrl}/by-survey/${surveyId}/paginated`;
		
		// Build HttpParams from PaginationQueryDto
		let params = new HttpParams();
		if (query.page) {
			params = params.set('page', query.page.toString());
		}
		if (query.limit) {
			params = params.set('limit', query.limit.toString());
		}
		if (query.sortBy) {
			params = params.set('sortBy', query.sortBy);
		}
		if (query.sortOrder) {
			params = params.set('sortOrder', query.sortOrder);
		}

		return this.http
			.get<PaginatedResponse<SurveyEnumerationAreaHouseholdListing>>(url, {
				headers: this.getAuthHeaders(),
				params,
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching paginated household listings for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get paginated household listings for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey Enumeration Area ID
	 * @param query - Pagination query parameters (page, limit, sortBy, sortOrder)
	 * @returns Observable of paginated household listings
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	getBySurveyEnumerationAreaPaginated(
		surveyEnumerationAreaId: number,
		query: PaginationQueryDto
	): Observable<PaginatedResponse<SurveyEnumerationAreaHouseholdListing>> {
		const url = `${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/paginated`;
		
		// Build HttpParams from PaginationQueryDto
		let params = new HttpParams();
		if (query.page) {
			params = params.set('page', query.page.toString());
		}
		if (query.limit) {
			params = params.set('limit', query.limit.toString());
		}
		if (query.sortBy) {
			params = params.set('sortBy', query.sortBy);
		}
		if (query.sortOrder) {
			params = params.set('sortOrder', query.sortOrder);
		}

		return this.http
			.get<PaginatedResponse<SurveyEnumerationAreaHouseholdListing>>(url, {
				headers: this.getAuthHeaders(),
				params,
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching paginated household listings for survey enumeration area ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Export all household listings for a survey as ZIP (CSV + metadata TXT)
	 * @param surveyId - Survey ID
	 * @returns Observable of Blob (ZIP file)
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	exportSurveyHouseholdListings(surveyId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/by-survey/${surveyId}/export/zip`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error exporting survey household listings for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Export all household listings for a survey enumeration area as ZIP (CSV + metadata TXT)
	 * @param surveyEnumerationAreaId - Survey Enumeration Area ID
	 * @returns Observable of Blob (ZIP file)
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	exportEnumerationAreaHouseholdListings(
		surveyEnumerationAreaId: number
	): Observable<Blob> {
		return this.http
			.get(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/export/zip`,
				{
					headers: this.getAuthHeaders(),
					responseType: 'blob',
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error exporting enumeration area household listings for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Export all household listings for a survey enumeration area as CSV (Admin only)
	 * Downloads CSV for a specific enumeration area
	 * @param surveyEnumerationAreaId - Survey Enumeration Area ID
	 * @returns Observable of Blob (CSV file)
	 * @requires Authentication (ADMIN role)
	 */
	exportEnumerationAreaHouseholdListingsCSV(
		surveyEnumerationAreaId: number
	): Observable<Blob> {
		return this.http
			.get(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/export/csv`,
				{
					headers: this.getAuthHeaders(),
					responseType: 'blob',
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error exporting enumeration area household listings CSV for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create blank household listing entries for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey Enumeration Area ID
	 * @param dto - Request DTO with count and optional remarks
	 * @returns Observable of CreateBlankHouseholdListingsResponseDto
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	createBlankHouseholdListings(
		surveyEnumerationAreaId: number,
		dto: CreateBlankHouseholdListingsDto
	): Observable<CreateBlankHouseholdListingsResponseDto> {
		const url = `${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/create-blank`;
		
		return this.http
			.post<CreateBlankHouseholdListingsResponseDto>(url, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error creating blank household listings for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get household listings by structure ID
	 * @param structureId - Structure ID
	 * @returns Observable of household listing array ordered by serial number
	 * @requires Authentication (ADMIN, SUPERVISOR, or ENUMERATOR role)
	 */
	findByStructure(
		structureId: number
	): Observable<SurveyEnumerationAreaHouseholdListing[]> {
		return this.http
			.get<SurveyEnumerationAreaHouseholdListing[]>(
				`${this.apiUrl}/by-structure/${structureId}`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching household listings for structure ${structureId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
}
