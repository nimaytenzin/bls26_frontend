import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	Survey,
	CreateSurveyDto,
	UpdateSurveyDto,
	SaveSurveyDto,
	ManageEnumerationAreasDto,
	SurveyStatisticsResponseDto,
	PaginationQueryDto,
	PaginatedResponse,
	AutoHouseholdUploadRequestDto,
	AutoHouseholdUploadResponseDto,
	AutoHouseholdUploadCsvResponseDto,
} from './survey.dto';
import { SurveyStatus } from '../../constants/enums';
import { SurveyEnumerationHierarchyDto } from './survey-enumeration-hierarchy.dto';

/**
 * Survey Data Service
 * Handles all HTTP operations for the Survey module
 * Implements CRUD operations and enumeration area management
 */
@Injectable({
	providedIn: 'root',
})
export class SurveyDataService {
	private apiUrl = `${BASEAPI_URL}/survey`;

	constructor(private http: HttpClient) {}

	/**
	 * Get HTTP headers with authentication token
	 * Used for protected endpoints that require ADMIN role
	 */
	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('access_token');
		return new HttpHeaders({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * Get auth headers for multipart/form-data requests
	 * Leaves Content-Type unset so the browser sets the boundary
	 */
	private getAuthHeadersForMultipart(): HttpHeaders {
		const token = localStorage.getItem('access_token');
		return new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * Create a new survey
	 * @param dto Survey creation data
	 * @returns Observable of created Survey
	 * @requires Authentication (ADMIN role)
	 */
	createSurvey(dto: CreateSurveyDto): Observable<Survey> {
		return this.http
			.post<Survey>(this.apiUrl, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error creating survey:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all active surveys (status = ACTIVE)
	 * @returns Observable of Survey array
	 * @public No authentication required
	 */
	findAllActiveSurveys(): Observable<Survey[]> {
		return this.http.get<Survey[]>(`${this.apiUrl}/active`).pipe(
			catchError((error) => {
				console.error('Error fetching active surveys:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get paginated surveys
	 * @param query Pagination query parameters (page, limit, sortBy, sortOrder)
	 * @returns Observable of PaginatedResponse<Survey>
	 * @public No authentication required
	 */
	findAllSurveysPaginated(
		query?: PaginationQueryDto
	): Observable<PaginatedResponse<Survey>> {
		// Build query parameters
		const params: any = {};
		if (query?.page) params.page = query.page.toString();
		if (query?.limit) params.limit = query.limit.toString();
		if (query?.sortBy) params.sortBy = query.sortBy;
		if (query?.sortOrder) params.sortOrder = query.sortOrder;

		return this.http
			.get<PaginatedResponse<Survey>>(`${this.apiUrl}/paginated`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching paginated surveys:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get a single survey by ID with associated enumeration areas
	 * @param id Survey ID
	 * @returns Observable of Survey
	 * @public No authentication required
	 */
	findSurveyById(id: number): Observable<Survey> {
		return this.http.get<Survey>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error(`Error fetching survey ${id}:`, error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update an existing survey
	 * @param id Survey ID
	 * @param dto Survey update data
	 * @returns Observable of updated Survey
	 * @requires Authentication (ADMIN role)
	 */
	updateSurvey(id: number, dto: UpdateSurveyDto): Observable<Survey> {
		return this.http
			.patch<Survey>(`${this.apiUrl}/${id}`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error updating survey ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Save survey (create or update)
	 * If id is provided and survey exists, it will be updated
	 * If id is not provided or doesn't exist, a new survey will be created
	 * @param dto Save survey data (with optional id)
	 * @returns Observable of saved Survey
	 * @requires Authentication (ADMIN role)
	 */
	saveSurvey(dto: SaveSurveyDto): Observable<Survey> {
		return this.http
			.post<Survey>(`${this.apiUrl}/save`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error saving survey:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete a survey
	 * @param id Survey ID
	 * @returns Observable of void
	 * @requires Authentication (ADMIN role)
	 */
	deleteSurvey(id: number): Observable<void> {
		return this.http
			.delete<void>(`${this.apiUrl}/${id}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error deleting survey ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Add enumeration areas to a survey
	 * @param surveyId Survey ID
	 * @param enumerationAreaIds Array of enumeration area IDs to add
	 * @returns Observable of updated Survey
	 * @requires Authentication (ADMIN role)
	 */
	addEnumerationAreas(
		surveyId: number,
		enumerationAreaIds: number[]
	): Observable<Survey> {
		const dto: ManageEnumerationAreasDto = { enumerationAreaIds };
		return this.http
			.post<Survey>(`${this.apiUrl}/${surveyId}/enumeration-areas`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error adding enumeration areas to survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Remove enumeration areas from a survey
	 * @param surveyId Survey ID
	 * @param enumerationAreaIds Array of enumeration area IDs to remove
	 * @returns Observable of updated Survey
	 * @requires Authentication (ADMIN role)
	 */
	removeEnumerationAreas(
		surveyId: number,
		enumerationAreaIds: number[]
	): Observable<Survey> {
		const dto: ManageEnumerationAreasDto = { enumerationAreaIds };
		return this.http
			.delete<Survey>(`${this.apiUrl}/${surveyId}/enumeration-areas`, {
				headers: this.getAuthHeaders(),
				body: dto,
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error removing enumeration areas from survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get supervisors assigned to a survey
	 * Based on the relationship: Survey → EAs → Sub-Admin Zones → Admin Zones → Dzongkhags → Supervisors
	 * @param surveyId Survey ID
	 * @returns Observable of Supervisors with their assigned dzongkhags
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getSupervisorsForSurvey(surveyId: number): Observable<any[]> {
		return this.http
			.get<any[]>(`${this.apiUrl}/${surveyId}/supervisors`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching supervisors for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all active surveys for a supervisor
	 * Returns surveys with enumeration areas falling under the supervisor's management
	 * @param supervisorId Supervisor user ID
	 * @returns Observable of Survey array with dzongkhags and enumeration areas
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getSurveysForSupervisor(supervisorId: number): Observable<any[]> {
		return this.http
			.get<any[]>(`${this.apiUrl}/supervisor/${supervisorId}/active`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching surveys for supervisor ${supervisorId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get comprehensive statistics for a survey
	 * Includes submission, validation, household, and population data
	 * @param surveyId Survey ID
	 * @returns Observable of SurveyStatisticsResponseDto
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getSurveyStatistics(
		surveyId: number
	): Observable<SurveyStatisticsResponseDto> {
		return this.http
			.get<SurveyStatisticsResponseDto>(
				`${this.apiUrl}/${surveyId}/statistics`,
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
	 * Get survey enumeration hierarchy
	 * Returns complete hierarchical structure: Dzongkhag → Admin Zone → Sub-Admin Zone → EAs
	 * @param surveyId Survey ID
	 * @returns Observable of hierarchy response
	 * @public No authentication required
	 */
	getSurveyEnumerationHierarchy(surveyId: number): Observable<SurveyEnumerationHierarchyDto> {
		return this.http
			.get<SurveyEnumerationHierarchyDto>(`${this.apiUrl}/${surveyId}/enumeration-hierarchy`)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching hierarchy for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Auto household upload
	 * Bulk upload household counts for multiple Enumeration Area and Survey combinations
	 * Automatically creates SurveyEnumerationArea records if they don't exist
	 * @param dto Auto household upload request data
	 * @returns Observable of upload response with summary
	 * @requires Authentication (ADMIN role)
	 */
	autoHouseholdUpload(
		dto: AutoHouseholdUploadRequestDto
	): Observable<AutoHouseholdUploadResponseDto> {
		return this.http
			.post<AutoHouseholdUploadResponseDto>(
				`${this.apiUrl}/auto-household-upload`,
				dto,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading household data:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Auto household upload via CSV
	 * Accepts a CSV file in multipart/form-data
	 * @param formData FormData containing the file under "file"
	 * @returns Observable of CSV upload response with parse errors and bulk result
	 * @requires Authentication (ADMIN role)
	 */
	autoHouseholdUploadCsv(
		formData: FormData
	): Observable<AutoHouseholdUploadCsvResponseDto> {
		return this.http
			.post<AutoHouseholdUploadCsvResponseDto>(
				`${this.apiUrl}/auto-household-upload/csv`,
				formData,
				{
					headers: this.getAuthHeadersForMultipart(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading household data via CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download survey household counts CSV
	 * Generates CSV with household counts per enumeration area including geographic hierarchy
	 * @param surveyId Survey ID
	 * @returns Observable of Blob (CSV file)
	 * @requires Authentication (ADMIN role)
	 */
	downloadSurveyHouseholdCountCSV(surveyId: number): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/${surveyId}/download/household-counts`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error downloading household counts CSV for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	// ============================================================
	// UTILITY METHODS
	// ============================================================

	/**
	 * Calculate survey duration in days
	 * @param survey Survey object
	 * @returns Number of days between start and end date
	 */
	getSurveyDuration(survey: Survey): number {
		const start = new Date(survey.startDate);
		const end = new Date(survey.endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}

	/**
	 * Check if survey is currently active based on dates
	 * @param survey Survey object
	 * @returns True if today is between start and end date
	 */
	isSurveyActive(survey: Survey): boolean {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const start = new Date(survey.startDate);
		start.setHours(0, 0, 0, 0);
		const end = new Date(survey.endDate);
		end.setHours(23, 59, 59, 999);
		return today >= start && today <= end;
	}

	/**
	 * Check if survey is ending soon (within 7 days)
	 * @param survey Survey object
	 * @returns True if survey ends within 7 days
	 */
	isSurveyEndingSoon(survey: Survey): boolean {
		const today = new Date();
		const end = new Date(survey.endDate);
		const diffTime = end.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 && diffDays <= 7;
	}

	/**
	 * Format date for display
	 * @param date Date string or Date object
	 * @returns Formatted date string
	 */
	formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Get status badge CSS class
	 * @param status Survey status
	 * @returns CSS class name for badge
	 */
	getStatusBadgeClass(status: SurveyStatus): string {
		return status === SurveyStatus.ACTIVE ? 'badge-success' : 'badge-secondary';
	}

	/**
	 * Count associated enumeration areas
	 * @param survey Survey object
	 * @returns Number of associated enumeration areas
	 */
	getEACount(survey: Survey): number {
		return survey.enumerationAreas?.length || 0;
	}

	/**
	 * Convert date to ISO string (YYYY-MM-DD) for API
	 * @param date Date object
	 * @returns ISO date string
	 */
	toISODateString(date: Date): string {
		return date.toISOString().split('T')[0];
	}
}
