import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import { SurveyEnumerationArea } from '../survey-enumeration-area/survey-enumeration-area.dto';
import { DzongkhagHierarchicalResponse } from '../location/dzongkhag/dzongkhag.interface';

/**
 * Supervisor Survey Enumeration Area Data Service
 * Handles HTTP operations for supervisor-specific survey enumeration area routes
 * All routes are prefixed with /supervisor/
 */
@Injectable({
	providedIn: 'root',
})
export class SupervisorSurveyEnumerationAreaDataService {
	private apiUrl = `${BASEAPI_URL}/supervisor/survey-enumeration-area`;

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
	 * Get all enumeration areas for a survey, filtered by supervisor's dzongkhags
	 * @param surveyId Survey ID
	 * @returns Observable of Dzongkhag array with nested enumeration areas
	 */
	getEAsBySurvey(surveyId: number): Observable<DzongkhagHierarchicalResponse[]> {
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
	 * Get single survey enumeration area
	 * @param id Survey enumeration area ID
	 * @returns Observable of SurveyEnumerationArea
	 */
	getSurveyEA(id: number): Observable<SurveyEnumerationArea> {
		return this.http
			.get<SurveyEnumerationArea>(`${this.apiUrl}/${id}`, {
				headers: this.getAuthHeaders(),
			})
			.pipe(
				catchError((error) => {
					console.error(`Error fetching survey EA ${id}:`, error);
					return throwError(() => error);
				})
			);
	}
}

