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
} from './survey-enumerator.dto';

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
}
