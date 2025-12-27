import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SurveyEnumerationAreaHouseholdListing,
	CreateBlankHouseholdListingsDto,
	CreateBlankHouseholdListingsResponseDto,
	BulkUploadResponse,
	HouseholdListingStatisticsResponseDto,
} from '../survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';
import {
	PaginationQueryDto,
	PaginatedResponse,
} from '../../utility/pagination.utility.service';

/**
 * Update Household DTO for supervisor routes
 */
export interface UpdateHouseholdDto {
	structureId?: number;
	householdIdentification?: string;
	householdSerialNumber?: number;
	nameOfHOH?: string;
	totalMale?: number;
	totalFemale?: number;
	phoneNumber?: string;
	remarks?: string;
}

/**
 * Household Count Response
 */
export interface HouseholdCount {
	surveyEnumerationAreaId: number;
	totalHouseholds: number;
	totalMale: number;
	totalFemale: number;
	totalPopulation: number;
	averageHouseholdSize: number;
}

/**
 * Dzongkhag Household Count Response
 */
export interface DzongkhagHouseholdCount {
	dzongkhagId: number;
	summary: {
		totalHouseholds: number;
		totalMale: number;
		totalFemale: number;
		totalPopulation: number;
	};
	administrativeZones: Array<{
		id: number;
		name: string;
		areaCode: string;
		type: 'Gewog' | 'Thromde';
		subAdministrativeZones: Array<{
			id: number;
			name: string;
			areaCode: string;
			type: 'chiwog' | 'lap';
			enumerationAreas: Array<{
				id: number;
				name: string;
				areaCode: string;
				totalHouseholds: number;
				totalMale: number;
				totalFemale: number;
				totalPopulation: number;
			}>;
		}>;
	}>;
}

/**
 * Supervisor Survey Enumeration Area Household Listing Data Service
 * Handles HTTP operations for supervisor-specific household listing routes
 * All routes are prefixed with /supervisor/
 */
@Injectable({
	providedIn: 'root',
})
export class SupervisorSurveyEnumerationAreaHouseholdListingDataService {
	private apiUrl = `${BASEAPI_URL}/supervisor/survey-enumeration-area-household-listing`;

	constructor(private http: HttpClient) {}

	/**
	 * Get HTTP headers with authentication token
	 */
	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
		return new HttpHeaders({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * Get HTTP headers for file uploads (multipart/form-data)
	 */
	private getFileUploadHeaders(): HttpHeaders {
		const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
		return new HttpHeaders({
			Authorization: `Bearer ${token}`,
			// Don't set Content-Type - browser will set it with boundary
		});
	}

	/**
	 * Get all household listings for a survey enumeration area
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of household listing array
	 */
	getHouseholdsByEA(
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
						`Error fetching households for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get sampled households for a survey enumeration area
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of sampled household listing array
	 */
	getSampledHouseholds(
		surveyEnumerationAreaId: number
	): Observable<SurveyEnumerationAreaHouseholdListing[]> {
		return this.http
			.get<SurveyEnumerationAreaHouseholdListing[]>(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/sampled`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching sampled households for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update a household listing
	 * @param id Household listing ID
	 * @param data Update data
	 * @returns Observable of updated household listing
	 */
	updateHousehold(
		id: number,
		data: UpdateHouseholdDto
	): Observable<SurveyEnumerationAreaHouseholdListing> {
		return this.http
			.patch<SurveyEnumerationAreaHouseholdListing>(
				`${this.apiUrl}/${id}`,
				data,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(`Error updating household ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create blank household listings
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @param data Create blank listings data
	 * @returns Observable of create blank response
	 */
	createBlankHouseholds(
		surveyEnumerationAreaId: number,
		data: CreateBlankHouseholdListingsDto
	): Observable<CreateBlankHouseholdListingsResponseDto> {
		return this.http
			.post<CreateBlankHouseholdListingsResponseDto>(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/create-blank`,
				data,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error creating blank households for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk upload households from CSV file
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @param file CSV file
	 * @returns Observable of bulk upload response
	 */
	bulkUploadHouseholds(
		surveyEnumerationAreaId: number,
		file: File
	): Observable<BulkUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('surveyEnumerationAreaId', surveyEnumerationAreaId.toString());

		return this.http
			.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload`, formData, {
				headers: this.getFileUploadHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error bulk uploading households:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download CSV template for household data entry
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of Blob (CSV file)
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
	 * Download household listings as ZIP file
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of Blob (ZIP file)
	 */
	downloadHouseholdListingsZip(surveyEnumerationAreaId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/export/zip`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading ZIP for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Export household listings by enumeration area as CSV
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of Blob (CSV file)
	 */
	exportHouseholdListingCSVByEA(surveyEnumerationAreaId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/export/csv`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error exporting CSV for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get household count by enumeration area
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @returns Observable of household count
	 */
	getHouseholdCount(surveyEnumerationAreaId: number): Observable<HouseholdCount> {
		return this.http
			.get<HouseholdCount>(
				`${this.apiUrl}/by-survey-ea/${surveyEnumerationAreaId}/export/count`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching household count for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get household count by dzongkhag
	 * @param dzongkhagId Dzongkhag ID
	 * @returns Observable of dzongkhag household count
	 */
	getDzongkhagHouseholdCount(dzongkhagId: number): Observable<DzongkhagHouseholdCount> {
		return this.http
			.get<DzongkhagHouseholdCount>(
				`${this.apiUrl}/by-dzongkhag/${dzongkhagId}/export/count`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching household count for dzongkhag ${dzongkhagId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get paginated household listings for a survey (scoped to supervisor's dzongkhags)
	 * @param surveyId Survey ID
	 * @param query Pagination query parameters
	 * @returns Observable of paginated household listings
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
	 * @param surveyEnumerationAreaId Survey enumeration area ID
	 * @param query Pagination query parameters
	 * @returns Observable of paginated household listings
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
						`Error fetching paginated household listings for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get statistics for an entire survey (scoped to supervisor's dzongkhags)
	 * @param surveyId Survey ID
	 * @returns Observable of household listing statistics
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
	 * Export household count by dzongkhag as CSV
	 * @param dzongkhagId Dzongkhag ID
	 * @returns Observable of Blob (CSV file)
	 */
	exportHouseholdCountByDzongkhag(dzongkhagId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/by-dzongkhag/${dzongkhagId}/export/count`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error exporting household count for dzongkhag ${dzongkhagId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
}

