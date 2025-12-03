import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	CompleteEnumerationDto,
	SurveyEnumerationArea,
	SurveyEnumerationAreaStatistics,
	PublishSurveyEnumerationAreaDto,
	BulkPublishDto,
	BulkUploadResponse,
} from './survey-enumeration-area.dto';
import { DzongkhagHierarchicalResponse } from '../location/dzongkhag/dzongkhag.interface';
/**
 * Survey Enumeration Area Data Service
 * Handles HTTP operations for survey enumeration areas
 */
@Injectable({
	providedIn: 'root',
})
export class SurveyEnumerationAreaDataService {
	private apiUrl = `${BASEAPI_URL}/survey-enumeration-area`;

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
	 * Get all enumeration areas for a specific survey
	 * Returns hierarchical data: Dzongkhag -> AdminZone -> SubAdminZone -> EA -> SurveyEA
	 * @param surveyId Survey ID
	 * @returns Observable of Dzongkhag array with nested data
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getBySurvey(surveyId: number): Observable<DzongkhagHierarchicalResponse[]> {
		return this.http
			.get<DzongkhagHierarchicalResponse[]>(
				`${this.apiUrl}/by-survey/${surveyId}`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching enumeration areas for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get submission statistics for a survey
	 * @param surveyId Survey ID
	 * @returns Observable of statistics
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getStatistics(surveyId: number): Observable<SurveyEnumerationAreaStatistics> {
		return this.http
			.get<SurveyEnumerationAreaStatistics>(
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
	 * Get enumeration areas that are enumerated and ready for sampling
	 * @param surveyId Survey ID
	 * @returns Observable of SurveyEnumerationArea array
	 * @requires Authentication (SUPERVISOR role)
	 */
	getEnumeratedForSampling(surveyId: number): Observable<SurveyEnumerationArea[]> {
		return this.http
			.get<SurveyEnumerationArea[]>(
				`${this.apiUrl}/by-survey/${surveyId}/enumerated-for-sampling`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching enumerated areas for sampling for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get enumeration areas that are sampled and ready for publishing
	 * @param surveyId Survey ID
	 * @returns Observable of SurveyEnumerationArea array
	 * @requires Authentication (ADMIN role)
	 */
	getReadyForPublishing(surveyId: number): Observable<SurveyEnumerationArea[]> {
		return this.http
			.get<SurveyEnumerationArea[]>(
				`${this.apiUrl}/by-survey/${surveyId}/ready-for-publishing`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching areas ready for publishing for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get sampling status and progress for a survey
	 * @param surveyId Survey ID
	 * @returns Observable of sampling status object
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getSamplingStatus(surveyId: number): Observable<any> {
		return this.http
			.get<any>(
				`${this.apiUrl}/by-survey/${surveyId}/sampling-status`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching sampling status for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Complete enumeration for a survey enumeration area (Enumerator only)
	 * @param id Survey enumeration area ID
	 * @param dto Enumeration data (enumeratedBy, comments)
	 * @returns Observable of updated SurveyEnumerationArea
	 * @requires Authentication (ENUMERATOR role)
	 */
	completeEnumeration(
		id: number,
		dto: CompleteEnumerationDto
	): Observable<SurveyEnumerationArea> {
		return this.http
			.post<SurveyEnumerationArea>(`${this.apiUrl}/${id}/complete-enumeration`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error completing enumeration for EA ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Publish sampled data for a survey enumeration area (Admin only)
	 * @param id Survey enumeration area ID
	 * @param dto Publishing data (publishedBy, comments)
	 * @returns Observable of updated SurveyEnumerationArea
	 * @requires Authentication (ADMIN role)
	 */
	publishData(
		id: number,
		dto: PublishSurveyEnumerationAreaDto
	): Observable<SurveyEnumerationArea> {
		return this.http
			.post<SurveyEnumerationArea>(`${this.apiUrl}/${id}/publish`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error publishing data for EA ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk publish sampled data for multiple enumeration areas (Admin only)
	 * @param dto Bulk publish data (surveyId, enumerationAreaIds, publishedBy)
	 * @returns Observable of updated SurveyEnumerationArea array
	 * @requires Authentication (ADMIN role)
	 */
	bulkPublish(
		dto: BulkPublishDto
	): Observable<SurveyEnumerationArea[]> {
		return this.http
			.post<SurveyEnumerationArea[]>(`${this.apiUrl}/bulk-publish`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error bulk publishing enumeration areas:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get a single survey enumeration area by ID
	 * @param id Survey enumeration area ID
	 * @returns Observable of SurveyEnumerationArea
	 * @requires Authentication (ADMIN or SUPERVISOR role)
	 */
	getById(id: number): Observable<SurveyEnumerationArea> {
		return this.http
			.get<SurveyEnumerationArea>(`${this.apiUrl}/${id}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching enumeration area ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download CSV template for bulk upload
	 * @returns Observable of Blob (CSV file)
	 * @requires No authentication (public endpoint)
	 */
	downloadTemplate(): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/template/csv`, {
			responseType: 'blob',
		}).pipe(
			catchError((error) => {
				console.error('Error downloading template:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Upload CSV file for bulk upload of enumeration areas
	 * @param surveyId Survey ID
	 * @param file CSV file to upload
	 * @returns Observable of bulk upload result
	 * @requires Authentication (ADMIN role)
	 */
	bulkUpload(surveyId: number, file: File): Observable<BulkUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);

		const token = localStorage.getItem('access_token');
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
			// Don't set Content-Type - let browser set it with boundary for multipart/form-data
		});

		return this.http
			.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload/${surveyId}`, formData, {
				headers: headers,
			})
			.pipe(
				catchError((error: any) => {
					console.error(`Error uploading CSV for survey ${surveyId}:`, error);
					return throwError(() => error);
				})
			);
	}
}
