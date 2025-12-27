import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import { Survey } from '../survey/survey.dto';
import { DzongkhagHierarchicalResponse } from '../location/dzongkhag/dzongkhag.interface';

/**
 * Supervisor Survey Summary Interface
 */
export interface SupervisorSurveySummary {
	totalDzongkhags: number;
	totalAdministrativeZones: number;
	totalSubAdministrativeZones: number;
	totalEnumerationAreas: number;
}

/**
 * Supervisor Survey Response Interface
 * Response from /supervisor/survey/:surveyId/enumeration-hierarchy endpoint
 */
export interface SupervisorSurveyResponse {
	survey: Survey;
	summary: SupervisorSurveySummary;
	hierarchy: DzongkhagHierarchicalResponse[];
}

/**
 * Supervisor Survey Data Service
 * Handles HTTP operations for supervisor-specific survey routes
 * All routes are prefixed with /supervisor/
 */
@Injectable({
	providedIn: 'root',
})
export class SupervisorSurveyDataService {
	private apiUrl = `${BASEAPI_URL}/supervisor/survey`;

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
	 * Get survey by ID (only if survey has EAs in supervisor's dzongkhags)
	 * @param surveyId Survey ID
	 * @returns Observable of Survey object
	 */
	getSurveyById(surveyId: number): Observable<Survey> {
		return this.http
			.get<Survey>(`${this.apiUrl}/${surveyId}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching survey ${surveyId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get enumeration hierarchy for a survey (scoped to supervisor's dzongkhags)
	 * Returns: Dzongkhag → Administrative Zone → Sub-Administrative Zone → Enumeration Areas
	 * Only includes dzongkhags assigned to the supervisor
	 * @param surveyId Survey ID
	 * @returns Observable of supervisor survey response with survey, summary, and hierarchy
	 */
	getSurveyEnumerationHierarchy(surveyId: number): Observable<SupervisorSurveyResponse> {
		return this.http
			.get<SupervisorSurveyResponse>(`${this.apiUrl}/${surveyId}/enumeration-hierarchy`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching enumeration hierarchy for survey ${surveyId}:`, error);
					return throwError(() => error);
				})
			);
	}
}

