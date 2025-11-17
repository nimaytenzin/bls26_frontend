import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Survey } from '../survey/survey.dto';

/**
 * Enumerator Data Service
 * Handles API calls for enumerator-specific operations
 */
@Injectable({
	providedIn: 'root',
})
export class EnumeratorDataService {
	private apiUrl = `${environment.BASEAPI_URL}/enumerator`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all active surveys assigned to the authenticated enumerator
	 * @returns Observable of Survey array
	 */
	getMySurveys(): Observable<Survey[]> {
		return this.http.get<Survey[]>(`${this.apiUrl}/my-surveys`);
	}

	/**
	 * Get survey details with enumeration areas for the authenticated enumerator
	 * @param surveyId - The ID of the survey
	 * @returns Observable of Survey with enumeration areas
	 */
	getSurveyDetails(surveyId: number): Observable<Survey> {
		return this.http.get<Survey>(`${this.apiUrl}/my-surveys/${surveyId}`);
	}

	/**
	 * Get survey submission status with hierarchical enumeration area data
	 * Shows submission status, validation status, and household counts grouped by geography
	 * @param surveyId - The ID of the survey
	 * @returns Observable of SurveySubmissionStatusResponse
	 */
	getSurveySubmissionStatus(surveyId: number): Observable<any> {
		return this.http.get(`${this.apiUrl}/my-surveys/${surveyId}/status`);
	}

	/**
	 * Get survey enumeration area details by ID
	 * @param surveyEnumerationAreaId - The ID of the survey enumeration area
	 * @returns Observable of SurveyEnumerationArea
	 */
	getSurveyEnumerationAreaDetails(
		surveyEnumerationAreaId: number
	): Observable<any> {
		return this.http.get(
			`${this.apiUrl}/survey-enumeration-area/${surveyEnumerationAreaId}`
		);
	}

	/**
	 * Get household listings for a survey enumeration area
	 * @param surveyEnumerationAreaId - The ID of the survey enumeration area
	 * @returns Observable of HouseholdListing array
	 */
	getHouseholdListings(surveyEnumerationAreaId: number): Observable<any[]> {
		return this.http.get<any[]>(
			`${this.apiUrl}/household-listing/survey-ea/${surveyEnumerationAreaId}`
		);
	}

	/**
	 * Create a household listing entry
	 * @param createDto - Household listing data
	 * @returns Observable of created HouseholdListing
	 */
	createHouseholdListing(createDto: any): Observable<any> {
		return this.http.post<any>(`${this.apiUrl}/household-listing`, createDto);
	}

	/**
	 * Update a household listing entry
	 * @param id - Household listing ID
	 * @param updateDto - Updated household listing data
	 * @returns Observable of updated HouseholdListing
	 */
	updateHouseholdListing(id: number, updateDto: any): Observable<any> {
		return this.http.patch<any>(
			`${this.apiUrl}/household-listing/${id}`,
			updateDto
		);
	}

	/**
	 * Delete a household listing entry
	 * @param id - Household listing ID
	 * @returns Observable of delete result
	 */
	deleteHouseholdListing(id: number): Observable<any> {
		return this.http.delete<any>(`${this.apiUrl}/household-listing/${id}`);
	}
}
