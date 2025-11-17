import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SubmitSurveyEnumerationAreaDto,
	SurveyEnumerationArea,
	SurveyEnumerationAreaStatistics,
	ValidateSurveyEnumerationAreaDto,
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
	 * @param filters Optional filters (isSubmitted, isValidated)
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
	 * Submit an enumeration area for validation
	 * @param id Survey enumeration area ID
	 * @param dto Submission data (submittedBy, comments)
	 * @returns Observable of updated SurveyEnumerationArea
	 * @requires Authentication (SUPERVISOR role)
	 */
	submit(
		id: number,
		dto: SubmitSurveyEnumerationAreaDto
	): Observable<SurveyEnumerationArea> {
		return this.http
			.post<SurveyEnumerationArea>(`${this.apiUrl}/${id}/submit`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error submitting enumeration area ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Validate a submitted enumeration area
	 * @param id Survey enumeration area ID
	 * @param dto Validation data (validatedBy, isApproved, comments)
	 * @returns Observable of updated SurveyEnumerationArea
	 * @requires Authentication (ADMIN role)
	 */
	validate(
		id: number,
		dto: ValidateSurveyEnumerationAreaDto
	): Observable<SurveyEnumerationArea> {
		return this.http
			.post<SurveyEnumerationArea>(`${this.apiUrl}/${id}/validate`, dto, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error validating enumeration area ${id}:`, error);
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
}
