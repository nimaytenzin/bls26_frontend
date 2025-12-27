import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASEAPI_URL } from '../../constants/constants';
import {
	SamplingMethod,
	RunEnumerationAreaSamplingDto,
	SurveyEnumerationAreaSamplingDto,
	SurveySamplingConfigDto,
} from '../sampling/sampling.dto';
import { SurveyEnumerationAreaHouseholdListing } from '../survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';

/**
 * Run Sampling DTO for supervisor routes
 */
export interface RunSamplingDto {
	method?: SamplingMethod;
	sampleSize?: number;
	randomStart?: number;
	overwriteExisting?: boolean;
}

/**
 * Run Sampling Response
 */
export interface RunSamplingResponse {
	success: boolean;
	message: string;
	data: {
		samplingId: number;
		surveyEnumerationAreaId: number;
		method: SamplingMethod;
		sampleSize: number;
		populationSize: number;
		isFullSelection: boolean;
		executedAt: string;
	};
}

/**
 * Sampling Results Response
 */
export interface SamplingResults {
	success: boolean;
	message: string;
	data: {
		sampling: {
			id: number;
			method: SamplingMethod;
			sampleSize: number;
			populationSize: number;
			samplingInterval: number | null;
			randomStart: number | null;
			wrapAroundCount: number;
			isFullSelection: boolean;
			selectedIndices: number[];
			metadata: Record<string, any>;
			executedAt: string;
			executedBy: number | null;
		};
		surveyEnumerationArea: {
			id: number;
			surveyId: number;
			enumerationAreaId: number;
			isEnumerated: boolean;
			isSampled: boolean;
			isPublished: boolean;
		};
		enumerationArea: {
			id: number;
			name: string;
			areaCode: string;
			subAdminZone: {
				name: string;
				areaCode: string;
				type: 'chiwog' | 'lap';
			} | null;
			adminZone: {
				name: string;
				areaCode: string;
				type: 'Gewog' | 'Thromde';
			} | null;
		};
		selectedHouseholds: Array<{
			selectionOrder: number;
			isReplacement: boolean;
			household: SurveyEnumerationAreaHouseholdListing;
		}>;
	};
}

/**
 * Bulk Run Sampling DTO
 */
export interface BulkRunSamplingDto {
	surveyEnumerationAreaIds: number[];
	method?: SamplingMethod;
	sampleSize?: number;
	randomStart?: number;
}

/**
 * Bulk Run Sampling Response
 */
export interface BulkRunSamplingResponse {
	success: number;
	failed: number;
	results: Array<{
		surveyEnumerationAreaId: number;
		result: RunSamplingResponse;
	}>;
	errors: Array<{
		surveyEnumerationAreaId: number;
		error: string;
	}>;
}

/**
 * Supervisor Sampling Data Service
 * Handles HTTP operations for supervisor-specific sampling routes
 * All routes are prefixed with /supervisor/
 */
@Injectable({
	providedIn: 'root',
})
export class SupervisorSamplingDataService {
	private apiUrl = `${BASEAPI_URL}/supervisor/sampling`;

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
	 * Run sampling for an enumeration area
	 * @param surveyId Survey ID
	 * @param seaId Survey enumeration area ID
	 * @param options Sampling options
	 * @returns Observable of run sampling response
	 */
	runSampling(
		surveyId: number,
		seaId: number,
		options: RunSamplingDto
	): Observable<RunSamplingResponse> {
		return this.http
			.post<RunSamplingResponse>(
				`${this.apiUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/run`,
				options,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error running sampling for survey ${surveyId}, EA ${seaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get sampling results for an enumeration area
	 * @param surveyId Survey ID
	 * @param seaId Survey enumeration area ID
	 * @returns Observable of sampling results
	 */
	getSamplingResults(surveyId: number, seaId: number): Observable<SamplingResults> {
		return this.http
			.get<SamplingResults>(
				`${this.apiUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/results`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching sampling results for survey ${surveyId}, EA ${seaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk run sampling for multiple enumeration areas
	 * @param surveyId Survey ID
	 * @param data Bulk run sampling data
	 * @returns Observable of bulk run sampling response
	 */
	bulkRunSampling(
		surveyId: number,
		data: BulkRunSamplingDto
	): Observable<BulkRunSamplingResponse> {
		return this.http
			.post<BulkRunSamplingResponse>(
				`${this.apiUrl}/surveys/${surveyId}/bulk-run`,
				data,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(`Error bulk running sampling for survey ${surveyId}:`, error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Re-sample an enumeration area (overwrites existing sampling)
	 * @param surveyId Survey ID
	 * @param seaId Survey enumeration area ID
	 * @param options Sampling options (overwriteExisting is automatically set to true)
	 * @returns Observable of run sampling response
	 */
	resampleEA(
		surveyId: number,
		seaId: number,
		options: Omit<RunSamplingDto, 'overwriteExisting'>
	): Observable<RunSamplingResponse> {
		return this.http
			.post<RunSamplingResponse>(
				`${this.apiUrl}/surveys/${surveyId}/enumeration-areas/${seaId}/resample`,
				options,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error resampling for survey ${surveyId}, EA ${seaId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get survey sampling configuration (scoped to supervisor's dzongkhags)
	 * @param surveyId Survey ID
	 * @returns Observable of survey sampling config
	 */
	getSurveyConfig(surveyId: number): Observable<SurveySamplingConfigDto> {
		return this.http
			.get<SurveySamplingConfigDto>(
				`${this.apiUrl}/surveys/${surveyId}/config`,
				{
					headers: this.getAuthHeaders(),
				}
			)
			.pipe(
				catchError((error) => {
					console.error(
						`Error fetching sampling config for survey ${surveyId}:`,
						error
					);
					return throwError(() => error);
				})
			);
	}
}

