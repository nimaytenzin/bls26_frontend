import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
	SurveyEnumerationAreaHouseholdListing,
	BulkUploadResponse,
} from '../survey-enumeration-area-household-listing/survey-enumeration-area-household-listing.dto';

// Legacy interface for backward compatibility
export interface BulkUploadResult {
	success: boolean;
	uploadedCount: number;
	replacedCount: number;
	errors: string[];
	households: SurveyEnumerationAreaHouseholdListing[];
}

@Injectable({
	providedIn: 'root',
})
export class HouseholdUploadService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/survey-enumeration-area-household-listing`;

	constructor(private http: HttpClient) {}

	/**
	 * Upload CSV file with household listings using the bulk upload API
	 * POST /survey-household-listing/bulk-upload-csv
	 */
	uploadHouseholdListings(formData: FormData): Observable<BulkUploadResponse> {
		return this.http.post<BulkUploadResponse>(
			`${this.baseUrl}/bulk-upload-csv`,
			formData
		);
	}

	/**
	 * Upload CSV file with backward compatible result format
	 * Transforms the new API response to legacy format for existing components
	 */
	uploadHouseholdListingsLegacy(
		formData: FormData
	): Observable<BulkUploadResult> {
		return new Observable<BulkUploadResult>((observer) => {
			this.uploadHouseholdListings(formData).subscribe({
				next: (response) => {
					const legacyResult: BulkUploadResult = {
						success: response.errors.length === 0,
						uploadedCount: response.success,
						replacedCount: response.failed,
						errors: response.errors.map(
							(err, index) => `Row ${index + 1}: ${err.error}`
						),
						households: [],
					};
					observer.next(legacyResult);
					observer.complete();
				},
				error: (error) => {
					observer.error(error);
				},
			});
		});
	}

	/**
	 * Download CSV template from backend API
	 * GET /survey-enumeration-area-household-listing/template/csv/:surveyEnumerationAreaId
	 */
	downloadTemplate(surveyEnumerationAreaId: number): Observable<Blob> {
		return this.http.get(
			`${this.baseUrl}/template/csv/${surveyEnumerationAreaId}`,
			{
				responseType: 'blob',
				headers: new HttpHeaders({
					Accept: 'text/csv',
				}),
			}
		);
	}

	/**
	 * Generate CSV template with pre-populated surveyEnumerationAreaId
	 * Uses the exact format required by the API (fallback method)
	 */
	generateTemplate(surveyEnumerationAreaId: number): Observable<Blob> {
		return new Observable<Blob>((observer) => {
			const headers = [
				'surveyEnumerationAreaId',
				'structureNumber',
				'householdIdentification',
				'householdSerialNumber',
				'nameOfHOH',
				'totalMale',
				'totalFemale',
				'phoneNumber',
				'remarks',
			];

			// Create sample rows matching the API example
			const sampleRows = [
				[
					surveyEnumerationAreaId.toString(),
					'STR001',
					'HH001',
					'1',
					'John Doe',
					'2',
					'3',
					'+97517123456',
					'First household',
				],
				[
					surveyEnumerationAreaId.toString(),
					'STR002',
					'HH002',
					'2',
					'Jane Smith',
					'1',
					'2',
					'',
					'Second household',
				],
				[
					surveyEnumerationAreaId.toString(),
					'STR003',
					'HH003',
					'3',
					'Bob Johnson',
					'3',
					'1',
					'+97517654321',
					'Third household',
				],
			];

			// Create CSV content
			let csvContent = headers.join(',') + '\n';
			sampleRows.forEach((row) => {
				csvContent += row.join(',') + '\n';
			});

			// Create blob
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			observer.next(blob);
			observer.complete();
		});
	}

	/**
	 * Validate CSV file before upload
	 */
	validateCSV(formData: FormData): Observable<{
		valid: boolean;
		errors: string[];
		warnings: string[];
		recordCount: number;
		preview: any[];
	}> {
		return this.http.post<{
			valid: boolean;
			errors: string[];
			warnings: string[];
			recordCount: number;
			preview: any[];
		}>(`${this.baseUrl}/validate-csv`, formData);
	}

	/**
	 * Get upload history for a survey
	 */
	getUploadHistory(surveyId: number): Observable<{
		uploads: {
			id: number;
			fileName: string;
			uploadedAt: Date;
			uploadedBy: string;
			recordCount: number;
			enumerationAreaId: number;
			enumerationAreaName: string;
			status: 'success' | 'failed' | 'partial';
		}[];
	}> {
		return this.http.get<{
			uploads: {
				id: number;
				fileName: string;
				uploadedAt: Date;
				uploadedBy: string;
				recordCount: number;
				enumerationAreaId: number;
				enumerationAreaName: string;
				status: 'success' | 'failed' | 'partial';
			}[];
		}>(`${this.baseUrl}/upload-history/${surveyId}`);
	}

	/**
	 * Delete all household listings for an enumeration area
	 */
	clearEnumerationArea(
		surveyId: number,
		enumerationAreaId: number
	): Observable<{
		deletedCount: number;
	}> {
		return this.http.delete<{ deletedCount: number }>(
			`${this.baseUrl}/clear-enumeration-area`,
			{
				params: {
					surveyId: surveyId.toString(),
					enumerationAreaId: enumerationAreaId.toString(),
				},
			}
		);
	}
}
