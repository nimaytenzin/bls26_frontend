import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SurveyEnumerator,
	AssignEnumeratorDto,
	BulkAssignEnumeratorsDto,
	BulkRemoveEnumeratorsDto,
	BulkAssignmentResponse,
	BulkRemovalResponse,
	BulkAssignCSVDto,
	BulkCSVAssignmentResponse,
	CreateSingleEnumeratorDto,
	CreateSingleEnumeratorResponse,
	UpdateEnumeratorDto,
	ResetPasswordDto,
	RestoreAllAssignmentsResponse,
} from './survey-enumerator.dto';
import { User } from '../auth/auth.interface';

/**
 * Survey Enumerator Data Service
 * Handles all HTTP operations for managing survey-enumerator assignments
 * Implements assignment, retrieval, and removal operations
 */
@Injectable({
	providedIn: 'root',
})
export class SurveyEnumeratorDataService {
	private apiUrl = `${BASEAPI_URL}/survey-enumerator`;

	constructor(private http: HttpClient) {}

	/**
	 * Get HTTP headers with authentication token
	 * Used for protected endpoints that require ADMIN or SUPERVISOR role
	 */
	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('auth_token');
		return new HttpHeaders({
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		});
	}

	/**
	 * Assign a single enumerator to a survey
	 * @param dto Assignment data
	 * @returns Observable of created SurveyEnumerator
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	assignEnumerator(dto: AssignEnumeratorDto): Observable<SurveyEnumerator> {
		return this.http
			.post<SurveyEnumerator>(this.apiUrl, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error assigning enumerator:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk assign multiple enumerators to a survey
	 * @param dto Bulk assignment data
	 * @returns Observable of BulkAssignmentResponse
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	bulkAssignEnumerators(
		dto: BulkAssignEnumeratorsDto
	): Observable<BulkAssignmentResponse> {
		return this.http
			.post<BulkAssignmentResponse>(`${this.apiUrl}/bulk-assign`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error bulk assigning enumerators:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk assign enumerators via CSV data
	 * Creates new users if they don't exist, assigns them to the survey
	 * @param dto Bulk CSV assignment data
	 * @returns Observable of BulkCSVAssignmentResponse
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	bulkAssignEnumeratorsCSV(
		dto: BulkAssignCSVDto
	): Observable<BulkCSVAssignmentResponse> {
		return this.http
			.post<BulkCSVAssignmentResponse>(`${this.apiUrl}/bulk-assign-csv`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error bulk assigning enumerators via CSV:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all survey-enumerator assignments
	 * @returns Observable of SurveyEnumerator array
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getAllAssignments(): Observable<SurveyEnumerator[]> {
		return this.http
			.get<SurveyEnumerator[]>(this.apiUrl, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching assignments:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumerators assigned to a specific survey
	 * @param surveyId Survey ID
	 * @returns Observable of SurveyEnumerator array with user details
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getEnumeratorsBySurvey(surveyId: number): Observable<SurveyEnumerator[]> {
		return this.http
			.get<SurveyEnumerator[]>(`${this.apiUrl}/by-survey/${surveyId}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching enumerators for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all surveys assigned to a specific enumerator
	 * @param userId Enumerator user ID
	 * @returns Observable of SurveyEnumerator array
	 * @public Can be accessed by the enumerator themselves
	 */
	getSurveysByEnumerator(userId: number): Observable<SurveyEnumerator[]> {
		return this.http
			.get<SurveyEnumerator[]>(`${this.apiUrl}/by-enumerator/${userId}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching surveys for enumerator ${userId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Remove a single enumerator assignment from a survey
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @returns Observable of void
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	removeEnumerator(userId: number, surveyId: number): Observable<void> {
		return this.http
			.delete<void>(`${this.apiUrl}/${userId}/${surveyId}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error removing enumerator ${userId} from survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk remove multiple enumerators from a survey
	 * @param surveyId Survey ID
	 * @param dto Bulk removal data containing userIds
	 * @returns Observable of BulkRemovalResponse
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	bulkRemoveEnumerators(
		surveyId: number,
		dto: BulkRemoveEnumeratorsDto
	): Observable<BulkRemovalResponse> {
		return this.http
			.delete<BulkRemovalResponse>(`${this.apiUrl}/bulk-remove/${surveyId}`, {
				headers: this.getAuthHeaders(),
				body: dto,
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error bulk removing enumerators from survey ${surveyId}:`,
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
	 * Check if a user is assigned to a survey
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @param assignments Array of survey enumerator assignments
	 * @returns True if the user is assigned to the survey
	 */
	isUserAssignedToSurvey(
		userId: number,
		surveyId: number,
		assignments: SurveyEnumerator[]
	): boolean {
		return assignments.some(
			(assignment) =>
				assignment.userId === userId && assignment.surveyId === surveyId
		);
	}

	/**
	 * Get count of enumerators assigned to a survey
	 * @param surveyId Survey ID
	 * @param assignments Array of survey enumerator assignments
	 * @returns Number of enumerators assigned to the survey
	 */
	getEnumeratorCountForSurvey(
		surveyId: number,
		assignments: SurveyEnumerator[]
	): number {
		return assignments.filter((assignment) => assignment.surveyId === surveyId)
			.length;
	}

	/**
	 * Get count of surveys assigned to an enumerator
	 * @param userId User ID
	 * @param assignments Array of survey enumerator assignments
	 * @returns Number of surveys assigned to the enumerator
	 */
	getSurveyCountForEnumerator(
		userId: number,
		assignments: SurveyEnumerator[]
	): number {
		return assignments.filter((assignment) => assignment.userId === userId)
			.length;
	}

	/**
	 * Format assignment date for display
	 * @param date Date string or Date object
	 * @returns Formatted date string
	 */
	formatAssignmentDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	/**
	 * Download CSV template for bulk enumerator assignment
	 * @returns Observable of Blob (CSV file)
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	downloadTemplateCSV(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/template/csv`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading CSV template:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get HTTP headers for file uploads (multipart/form-data)
	 */
	private getFileUploadHeaders(): HttpHeaders {
		const token = localStorage.getItem('auth_token');
		return new HttpHeaders({
			Authorization: `Bearer ${token}`,
			// Don't set Content-Type - browser will set it with boundary
		});
	}

	/**
	 * Bulk upload enumerators from CSV file (file upload endpoint)
	 * @param surveyId Survey ID
	 * @param file CSV file
	 * @returns Observable of bulk assign response
	 * @requires Authentication (ADMIN role)
	 */
	bulkUploadEnumeratorsFromFile(
		surveyId: number,
		file: File
	): Observable<BulkCSVAssignmentResponse> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('surveyId', surveyId.toString());

		return this.http
			.post<BulkCSVAssignmentResponse>(`${this.apiUrl}/bulk-assign-csv`, formData, {
				headers: this.getFileUploadHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error bulk uploading enumerators from file:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Soft delete a single enumerator assignment
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @param dzongkhagId Dzongkhag ID
	 * @returns Observable of delete response
	 * @requires Authentication (ADMIN role)
	 */
	softDeleteAssignment(
		userId: number,
		surveyId: number,
		dzongkhagId: number
	): Observable<{ message: string }> {
		return this.http
			.delete<{ message: string }>(
				`${this.apiUrl}/${userId}/${surveyId}/${dzongkhagId}/soft`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error soft deleting assignment ${userId}/${surveyId}/${dzongkhagId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Soft delete all enumerator assignments for a user-survey combination
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @returns Observable of delete response
	 * @requires Authentication (ADMIN role)
	 */
	softDeleteAllAssignments(
		userId: number,
		surveyId: number
	): Observable<{ message: string; deletedCount: number }> {
		return this.http
			.delete<{ message: string; deletedCount: number }>(
				`${this.apiUrl}/${userId}/${surveyId}/soft`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error soft deleting all assignments for ${userId}/${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Restore a soft-deleted enumerator assignment
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @param dzongkhagId Dzongkhag ID
	 * @returns Observable of restore response
	 * @requires Authentication (ADMIN role)
	 */
	restoreAssignment(
		userId: number,
		surveyId: number,
		dzongkhagId: number
	): Observable<{ message: string }> {
		return this.http
			.post<{ message: string }>(
				`${this.apiUrl}/${userId}/${surveyId}/${dzongkhagId}/restore`,
				{},
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error restoring assignment ${userId}/${surveyId}/${dzongkhagId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Restore all soft-deleted enumerator assignments for a user-survey combination
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @returns Observable of restore response
	 * @requires Authentication (ADMIN role)
	 */
	restoreAllAssignments(
		userId: number,
		surveyId: number
	): Observable<RestoreAllAssignmentsResponse> {
		return this.http
			.post<RestoreAllAssignmentsResponse>(
				`${this.apiUrl}/${userId}/${surveyId}/restore`,
				{},
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error restoring all assignments for ${userId}/${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create a single enumerator with dzongkhag assignments
	 * @param createDto Enumerator data with dzongkhag assignments
	 * @returns Observable of created enumerator and assignments
	 * @requires Authentication (ADMIN role)
	 */
	createSingleEnumerator(
		createDto: CreateSingleEnumeratorDto
	): Observable<CreateSingleEnumeratorResponse> {
		return this.http
			.post<CreateSingleEnumeratorResponse>(`${this.apiUrl}/single`, createDto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error creating single enumerator:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update enumerator details and/or assignments
	 * @param userId User ID
	 * @param updateDto Update data
	 * @returns Observable of update response
	 * @requires Authentication (ADMIN role)
	 */
	updateEnumerator(
		userId: number,
		updateDto: UpdateEnumeratorDto
	): Observable<{ message: string; user?: User; assignments?: SurveyEnumerator[] }> {
		return this.http
			.patch<{ message: string; user?: User; assignments?: SurveyEnumerator[] }>(
				`${this.apiUrl}/${userId}`,
				updateDto,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(`Error updating enumerator ${userId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Reset enumerator password
	 * @param userId User ID
	 * @param resetDto Password reset data
	 * @returns Observable of reset response
	 * @requires Authentication (ADMIN role)
	 */
	resetPassword(
		userId: number,
		resetDto: ResetPasswordDto
	): Observable<{ message: string; user: User }> {
		return this.http
			.post<{ message: string; user: User }>(
				`${this.apiUrl}/${userId}/reset-password`,
				{ newPassword: resetDto.newPassword },
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(`Error resetting password for user ${userId}:`, error);
					return throwError(() => error);
				})
			);
	}
}
