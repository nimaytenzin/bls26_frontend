import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SurveyEnumerationAreaStructure,
	CreateSurveyEnumerationAreaStructureDto,
	UpdateSurveyEnumerationAreaStructureDto,
	SurveyEnumerationAreaStructureResponseDto,
} from './survey-enumeration-area-structure.dto';

/**
 * Survey Enumeration Area Structure Data Service
 * Handles HTTP operations for structures
 */
@Injectable({
	providedIn: 'root',
})
export class SurveyEnumerationAreaStructureDataService {
	private apiUrl = `${BASEAPI_URL}/survey-enumeration-area-structure`;

	constructor(private http: HttpClient) {}

	/**
	 * Create a new structure
	 * @param createDto - Structure creation data
	 * @returns Observable of created structure
	 */
	create(
		createDto: CreateSurveyEnumerationAreaStructureDto
	): Observable<SurveyEnumerationAreaStructureResponseDto> {
		return this.http
			.post<SurveyEnumerationAreaStructureResponseDto>(
				this.apiUrl,
				createDto
			)
			.pipe(
				catchError((error) => {
					console.error('Error creating structure:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get structure by ID
	 * @param id - Structure ID
	 * @returns Observable of structure
	 */
	findOne(id: number): Observable<SurveyEnumerationAreaStructure> {
		return this.http
			.get<SurveyEnumerationAreaStructure>(`${this.apiUrl}/${id}`)
			.pipe(
				catchError((error) => {
					console.error(`Error fetching structure ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update structure
	 * @param id - Structure ID
	 * @param updateDto - Update data
	 * @returns Observable of updated structure
	 */
	update(
		id: number,
		updateDto: UpdateSurveyEnumerationAreaStructureDto
	): Observable<SurveyEnumerationAreaStructureResponseDto> {
		return this.http
			.put<SurveyEnumerationAreaStructureResponseDto>(
				`${this.apiUrl}/${id}`,
				updateDto
			)
			.pipe(
				catchError((error) => {
					console.error(`Error updating structure ${id}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete structure (fails if structure has associated households)
	 * @param id - Structure ID
	 * @returns Observable of delete result (204 on success)
	 */
	delete(id: number): Observable<any> {
		return this.http.delete(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error(`Error deleting structure ${id}:`, error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Force delete structure: deletes all associated household samples and household listings, then the structure.
	 * @param id - Structure ID
	 * @returns Observable of delete result (204 on success)
	 */
	forceDelete(id: number): Observable<any> {
		return this.http.delete(`${this.apiUrl}/${id}/force`).pipe(
			catchError((error) => {
				console.error(`Error force-deleting structure ${id}:`, error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all structures for a survey enumeration area
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @returns Observable of structure array
	 */
	getBySurveyEA(
		surveyEnumerationAreaId: number
	): Observable<SurveyEnumerationAreaStructure[]> {
		return this.http
			.get<SurveyEnumerationAreaStructure[]>(
				`${BASEAPI_URL}/survey-enumeration-area/survey-ea/structures/${surveyEnumerationAreaId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching structures for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
	/**
	 * Get current structures for enumeration area
	 * Retrieves all structures from the latest published survey for a specific enumeration area
	 * @param enumerationAreaId - Enumeration area ID
	 * @returns Observable of structure array
	 */
	getStructuresByEnumerationArea(
		enumerationAreaId: number
	): Observable<SurveyEnumerationAreaStructure[]> {
		return this.http
			.get<SurveyEnumerationAreaStructure[]>(
				`${BASEAPI_URL}/survey-enumeration-area-household-listing/current/enumeration-area/${enumerationAreaId}/structures`
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching structures for enumeration area ${enumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all structures for a survey enumeration area with household listings grouped by structure
	 * @param surveyEnumerationAreaId - Survey enumeration area ID
	 * @returns Observable of structure array with household listings
	 */
	getStructuresWithHouseholdListings(
		surveyEnumerationAreaId: number
	): Observable<SurveyEnumerationAreaStructure[]> {
		return this.http
			.get<SurveyEnumerationAreaStructure[]>(
				`${this.apiUrl}/survey-ea/structures/${surveyEnumerationAreaId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching structures with household listings for EA ${surveyEnumerationAreaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
}

