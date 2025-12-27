import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import { User } from '../auth/auth.interface';

/**
 * Supervisor Survey Enumerator Interface
 * Extended interface for supervisor routes
 */
export interface SupervisorSurveyEnumerator {
	userId: number;
	surveyId: number;
	dzongkhagId: number | null;
	user: {
		id: number;
		name: string;
		emailAddress: string;
		cid: string;
		phoneNumber: string | null;
		role: 'ENUMERATOR';
	};
	survey: {
		id: number;
		name: string;
		year: number;
		status: string;
	};
	dzongkhag?: {
		id: number;
		name: string;
		areaCode: string;
	};
}

/**
 * Bulk Assign Response for Supervisor Routes
 */
export interface SupervisorBulkAssignResponse {
	success: number;
	failed: number;
	created: number; // New users created
	existing: number; // Existing users assigned
	assignments: Array<{
		userId: number;
		surveyId: number;
		dzongkhagId: number | null;
	}>;
	errors: Array<{
		enumerator: any;
		error: string;
	}>;
}

/**
 * Update Enumerator DTO
 */
export interface UpdateEnumeratorDto {
	name?: string;
	emailAddress?: string;
	phoneNumber?: string;
	surveyId?: number;
	dzongkhagId?: number;
}

/**
 * Reset Password DTO
 */
export interface ResetPasswordDto {
	newPassword: string;
}

/**
 * Reset Password Response
 */
export interface ResetPasswordResponse {
	message: string;
	user: User;
}

/**
 * Supervisor Survey Enumerator Data Service
 * Handles HTTP operations for supervisor-specific enumerator management routes
 * All routes are prefixed with /supervisor/
 */
@Injectable({
	providedIn: 'root',
})
export class SupervisorSurveyEnumeratorDataService {
	private apiUrl = `${BASEAPI_URL}/supervisor/survey-enumerator`;

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
	 * Get enumerators by survey
	 * @param surveyId Survey ID
	 * @returns Observable of supervisor survey enumerator array
	 */
	getEnumeratorsBySurvey(surveyId: number): Observable<SupervisorSurveyEnumerator[]> {
		return this.http
			.get<SupervisorSurveyEnumerator[]>(`${this.apiUrl}/by-survey/${surveyId}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching enumerators for survey ${surveyId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk upload enumerators from CSV file
	 * @param surveyId Survey ID
	 * @param file CSV file
	 * @returns Observable of bulk assign response
	 */
	bulkUploadEnumerators(
		surveyId: number,
		file: File
	): Observable<SupervisorBulkAssignResponse> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('surveyId', surveyId.toString());

		return this.http
			.post<SupervisorBulkAssignResponse>(`${this.apiUrl}/bulk-assign-csv`, formData, {
				headers: this.getFileUploadHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error('Error bulk uploading enumerators:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download CSV template for enumerator upload
	 * @returns Observable of Blob (CSV file)
	 */
	downloadTemplate(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/template/csv`, {
				headers: this.getAuthHeaders(),
				responseType: 'blob',
			})
			.pipe(
				catchError((error) => {
					console.error('Error downloading enumerator template:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Reset enumerator password
	 * @param userId User ID
	 * @param data Reset password data
	 * @returns Observable of reset password response
	 */
	resetEnumeratorPassword(
		userId: number,
		data: ResetPasswordDto
	): Observable<ResetPasswordResponse> {
		return this.http
			.post<ResetPasswordResponse>(`${this.apiUrl}/${userId}/reset-password`, data, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error resetting password for user ${userId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update enumerator
	 * @param userId User ID
	 * @param data Update data
	 * @returns Observable of update response
	 */
	updateEnumerator(
		userId: number,
		data: UpdateEnumeratorDto
	): Observable<ResetPasswordResponse> {
		return this.http
			.patch<ResetPasswordResponse>(`${this.apiUrl}/${userId}`, data, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error updating enumerator ${userId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete enumerator from survey
	 * @param userId User ID
	 * @param surveyId Survey ID
	 * @returns Observable of delete response
	 */
	deleteEnumerator(userId: number, surveyId: number): Observable<{ deleted: boolean }> {
		return this.http
			.delete<{ deleted: boolean }>(`${this.apiUrl}/${userId}/${surveyId}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(
						`Error deleting enumerator ${userId} from survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
}

