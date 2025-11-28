import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	BulkRunSamplingDto,
	ExportSurveyEAsParams,
	PaginationResponse,
	RunEnumerationAreaSamplingDto,
	SamplingExistsCheckDto,
	SamplingJobDto,
	SamplingJobQuery,
	SamplingResultsResponseDto,
	SamplingEnumerationHierarchyDto,
	SurveyEAListQuery,
	SurveyEnumerationAreaSamplingDto,
	SurveySamplingConfigDto,
	SurveySamplingEAListItemDto,
	SurveySamplingHierarchyDzongkhagDto,
	UpdateSurveySamplingConfigDto,
} from './sampling.dto';

@Injectable({
	providedIn: 'root',
})
export class SamplingDataService {
	private readonly baseUrl = `${BASEAPI_URL}/sampling`;

	constructor(private http: HttpClient) {}

	getSurveyConfig(surveyId: number): Observable<SurveySamplingConfigDto> {
		return this.http
			.get<SurveySamplingConfigDto>(`${this.baseUrl}/surveys/${surveyId}/config`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching sampling config:', error);
					return throwError(() => error);
				})
			);
	}

	saveSurveyConfig(
		surveyId: number,
		payload: UpdateSurveySamplingConfigDto
	): Observable<SurveySamplingConfigDto> {
		return this.http
			.post<SurveySamplingConfigDto>(
				`${this.baseUrl}/surveys/${surveyId}/config`,
				payload
			)
			.pipe(
				catchError((error) => {
					console.error('Error saving sampling config:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Check if sampling already exists for an enumeration area
	 * @param surveyId - Survey ID
	 * @param seaId - Survey Enumeration Area ID
	 * @returns Check result with existence status and sampling data if exists
	 */
	checkSamplingExists(
		surveyId: number,
		seaId: number
	): Observable<SamplingExistsCheckDto> {
		return this.http
			.get<SamplingExistsCheckDto>(
				`${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/check`
			)
			.pipe(
				catchError((error) => {
					console.error(`Error checking sampling existence for EA ${seaId}:`, error);
					return throwError(() => error);
				})
			);
	}

	runSampling(
		surveyId: number,
		seaId: number,
		payload: RunEnumerationAreaSamplingDto
	): Observable<SurveyEnumerationAreaSamplingDto> {
		return this.http
			.post<SurveyEnumerationAreaSamplingDto>(
				`${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/run`,
				payload
			)
			.pipe(
				catchError((error) => {
					console.error(`Error running sampling for EA ${seaId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get detailed sampling results for an enumeration area
	 * @param surveyId - Survey ID
	 * @param seaId - Survey Enumeration Area ID
	 * @returns Complete sampling results with selected households
	 */
	getSamplingResults(
		surveyId: number,
		seaId: number
	): Observable<SamplingResultsResponseDto> {
		return this.http
			.get<SamplingResultsResponseDto>(
				`${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/results`
			)
			.pipe(
				catchError((error) => {
					console.error(`Error fetching sampling results for EA ${seaId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get enumeration hierarchy with sampling information for a survey
	 * @param surveyId - Survey ID
	 * @returns Complete hierarchy with sampling status for each enumeration area
	 */
	getEnumerationHierarchy(
		surveyId: number
	): Observable<SamplingEnumerationHierarchyDto> {
		return this.http
			.get<SamplingEnumerationHierarchyDto>(
				`${this.baseUrl}/surveys/${surveyId}/enumeration-hierarchy`
			)
			.pipe(
				catchError((error) => {
					console.error(`Error fetching enumeration hierarchy for survey ${surveyId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get selected household IDs for a survey enumeration area
	 * @param surveyId - Survey ID
	 * @param seaId - Survey Enumeration Area ID
	 * @returns Array of household listing IDs that were selected (empty array if no sampling)
	 */
	getSelectedHouseholdIds(
		surveyId: number,
		seaId: number
	): Observable<number[]> {
		return this.http
			.get<number[]>(
				`${this.baseUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/selected-households`
			)
			.pipe(
				catchError((error) => {
					// Return empty array if 404 (no sampling exists) - this is not an error
					if (error?.status === 404) {
						return new Observable<number[]>((subscriber) => {
							subscriber.next([]);
							subscriber.complete();
						});
					}
					console.error(`Error fetching selected household IDs for EA ${seaId}:`, error);
					return throwError(() => error);
				})
			);
	}

}
