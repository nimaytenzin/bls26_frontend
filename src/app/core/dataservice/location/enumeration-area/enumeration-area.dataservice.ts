import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../../constants/constants';
import {
	ApiResponse,
	BulkUploadResponse,
	CreateEnumerationAreaDto,
	CreateTwoSazsWithEaRequest,
	CreateTwoSazsWithEaResponse,
	CreateMultipleSazsWithEaResponse,
	SazData,
	EaData,
	EnumerationArea,
	EnumerationAreaGeoJSON,
	UpdateEnumerationAreaDto,
	EaLineageResponse,
	EaHistoryResponse,
	PaginatedResponse,
	SurveyWithHouseholdCountForEA,
} from './enumeration-area.dto';

@Injectable({
	providedIn: 'root',
})
export class EnumerationAreaDataService {
	private readonly apiUrl = `${BASEAPI_URL}/enumeration-area`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all enumeration areas
	 * @param withGeom - Include geometry (default: false)
	 * @param subAdministrativeZoneId - Filter by SAZ ID
	 * @param includeSubAdminZone - Include linked SAZs (default: false)
	 */
	findAllEnumerationAreas(
		withGeom: boolean = false,
		subAdministrativeZoneId?: number,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (subAdministrativeZoneId !== undefined)
			params = params.set('subAdministrativeZoneId', subAdministrativeZoneId.toString());
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http.get<EnumerationArea[]>(this.apiUrl, { params }).pipe(
			catchError((error) => {
				console.error('Error fetching enumeration areas:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all enumeration areas by sub-administrative zone ID
	 * Uses query parameter instead of path parameter per new API
	 */
	findEnumerationAreasBySubAdministrativeZone(
		subAdministrativeZoneId: number,
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		params = params.set('subAdministrativeZoneId', subAdministrativeZoneId.toString());
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http
			.get<EnumerationArea[]>(this.apiUrl, { params })
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration areas by sub-administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumeration areas by administrative zone ID
	 * @param administrativeZoneId - Administrative zone ID
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include sub-administrative zone data (default: false)
	 * @returns Observable<EnumerationArea[]> - Array of enumeration areas
	 */
	findByAdministrativeZone(
		administrativeZoneId: number,
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http
			.get<EnumerationArea[]>(
				`${this.apiUrl}/by-administrative-zone/${administrativeZoneId}`,
				{ params }
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration areas by administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumeration areas as GeoJSON
	 */
	getAllEnumerationAreaGeojson(): Observable<EnumerationAreaGeoJSON> {
		return this.http
			.get<EnumerationAreaGeoJSON>(`${this.apiUrl}/geojson/all`)
			.pipe(
				catchError((error) => {
					console.error('Error fetching enumeration area geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get single enumeration area as GeoJSON
	 * @param id - Enumeration Area ID
	 * @returns GeoJSON Feature
	 */
	findOneAsGeoJson(id: number): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/geojson/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching enumeration area as GeoJSON:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all enumeration areas by sub-administrative zone ID as GeoJSON
	 */
	getEnumerationAreaGeojsonBySubAdministrativeZone(
		subAdministrativeZoneId: number
	): Observable<EnumerationAreaGeoJSON> {
		return this.http
			.get<EnumerationAreaGeoJSON>(
				`${this.apiUrl}/geojson/by-sub-administrative-zone/${subAdministrativeZoneId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration area geojson by sub-administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all enumeration areas by administrative zone ID as GeoJSON
	 * @param administrativeZoneId - Administrative zone ID
	 * @returns Observable<EnumerationAreaGeoJSON> - GeoJSON FeatureCollection
	 */
	findAllAsGeoJsonByAdministrativeZone(
		administrativeZoneId: number
	): Observable<EnumerationAreaGeoJSON> {
		return this.http
			.get<EnumerationAreaGeoJSON>(
				`${this.apiUrl}/geojson/by-administrative-zone/${administrativeZoneId}`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching enumeration area geojson by administrative zone:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get enumeration area by ID
	 * @param id - Enumeration Area ID
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include linked SAZs (default: false)
	 */
	findEnumerationAreaById(
		id: number,
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http.get<EnumerationArea>(`${this.apiUrl}/${id}`, { params }).pipe(
			catchError((error) => {
				console.error('Error fetching enumeration area:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all surveys with household count for an enumeration area.
	 * Returns surveys that include this EA, with household count per survey.
	 * Ordered by survey.startDate descending (latest first). Public, no auth.
	 */
	getSurveysWithHouseholdCount(
		enumerationAreaId: number
	): Observable<SurveyWithHouseholdCountForEA[]> {
		return this.http
			.get<SurveyWithHouseholdCountForEA[]>(
				`${this.apiUrl}/${enumerationAreaId}/surveys-with-household-count`
			)
			.pipe(
				catchError((error) => {
					console.error(
						'Error fetching surveys with household count for EA:',
						error
					);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create new enumeration area
	 */
	createEnumerationArea(
		data: CreateEnumerationAreaDto
	): Observable<ApiResponse<EnumerationArea>> {
		return this.http.post<ApiResponse<EnumerationArea>>(this.apiUrl, data).pipe(
			catchError((error) => {
				console.error('Error creating enumeration area:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Update existing enumeration area
	 */
	updateEnumerationArea(
		id: number,
		data: UpdateEnumerationAreaDto
	): Observable<ApiResponse<EnumerationArea>> {
		return this.http
			.patch<ApiResponse<EnumerationArea>>(`${this.apiUrl}/${id}`, data)
			.pipe(
				catchError((error) => {
					console.error('Error updating enumeration area:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete enumeration area
	 */
	deleteEnumerationArea(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting enumeration area:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Upload GeoJSON file for enumeration area
	 */
	uploadGeojsonByEnumerationArea(
		enumerationAreaId: number,
		file: File
	): Observable<ApiResponse<EnumerationArea>> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<ApiResponse<EnumerationArea>>(
				`${this.apiUrl}/upload-geojson/${enumerationAreaId}`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error uploading geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk upload GeoJSON file to create multiple enumeration areas
	 * @param file GeoJSON FeatureCollection file containing multiple enumeration areas
	 * @returns Observable with bulk upload results including success count, skipped items, and errors
	 */
	bulkUploadGeojson(file: File): Observable<BulkUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<BulkUploadResponse>(`${this.apiUrl}/bulk-upload-geojson`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error bulk uploading geojson:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Bulk upload enumeration areas by Sub-Administrative Zone
	 * Uploads a GeoJSON file and automatically assigns all EAs to the specified SAZ
	 * @param subAdministrativeZoneId The ID of the Sub-Administrative Zone to assign to all uploaded EAs
	 * @param file GeoJSON FeatureCollection file containing enumeration areas
	 * @returns Observable with bulk upload results including success count, skipped items, and errors
	 */
	bulkUploadEAsBySubAdministrativeZone(
		subAdministrativeZoneId: number,
		file: File
	): Observable<BulkUploadResponse> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<BulkUploadResponse>(
				`${this.apiUrl}/by-sub-administrative-zone/${subAdministrativeZoneId}/bulk-upload-geojson`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error bulk uploading EAs by SAZ:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create two SAZs from GeoJSON files and a single EA that links to both
	 * @param saz1File - GeoJSON file for SAZ1
	 * @param saz2File - GeoJSON file for SAZ2
	 * @param saz1Data - SAZ1 metadata
	 * @param saz2Data - SAZ2 metadata
	 * @returns Observable with created SAZs and EA
	 * @deprecated Use createMultipleSazsWithEa instead for more flexibility
	 */
	createTwoSazsWithEa(
		saz1File: File,
		saz2File: File,
		saz1Data: CreateTwoSazsWithEaRequest['saz1Data'],
		saz2Data: CreateTwoSazsWithEaRequest['saz2Data']
	): Observable<CreateTwoSazsWithEaResponse> {
		const formData = new FormData();

		// Add files (order matters - first file is SAZ1, second is SAZ2)
		formData.append('files', saz1File);
		formData.append('files', saz2File);

		// Add JSON data as strings
		formData.append('saz1Data', JSON.stringify(saz1Data));
		formData.append('saz2Data', JSON.stringify(saz2Data));

		return this.http
			.post<CreateTwoSazsWithEaResponse>(
				`${this.apiUrl}/create-two-sazs-with-ea`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error creating two SAZs with EA:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Create multiple SAZs (2-20) from GeoJSON files and a single EA that links to all of them
	 * @param files - Array of GeoJSON files (one per SAZ, 2-20 files)
	 * @param sazDataArray - Array of SAZ metadata objects
	 * @param eaData - EA metadata object
	 * @returns Observable with created SAZs and EA
	 */
	createMultipleSazsWithEa(
		files: File[],
		sazDataArray: SazData[],
		eaData: EaData
	): Observable<CreateMultipleSazsWithEaResponse> {
		const formData = new FormData();

		// Add files (order must match sazDataArray order)
		files.forEach((file) => {
			formData.append('files', file);
		});

		// Add JSON data as strings
		formData.append('sazDataArray', JSON.stringify(sazDataArray));
		formData.append('eaData', JSON.stringify(eaData));

		return this.http
			.post<CreateMultipleSazsWithEaResponse>(
				`${this.apiUrl}/create-multiple-sazs-with-ea`,
				formData
			)
			.pipe(
				catchError((error) => {
					console.error('Error creating multiple SAZs with EA:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Split an enumeration area into multiple new areas
	 * @param id - Source enumeration area ID
	 * @param formData - FormData containing eaData (JSON string), files (GeoJSON files), and reason
	 * @returns Observable with array of created enumeration areas
	 */
	splitEnumerationArea(id: number, formData: FormData): Observable<EnumerationArea[]> {
		return this.http
			.post<EnumerationArea[]>(`${this.apiUrl}/${id}/split`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error splitting enumeration area:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Merge multiple enumeration areas into a single new area
	 * @param formData - FormData containing mergeData (JSON string), file (GeoJSON file), and reason
	 * @returns Observable with created merged enumeration area
	 */
	mergeEnumerationAreas(formData: FormData): Observable<EnumerationArea> {
		return this.http
			.post<EnumerationArea>(`${this.apiUrl}/merge`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error merging enumeration areas:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get EA lineage (ancestors and/or descendants)
	 * @param id - Enumeration area ID
	 * @param direction - Direction to fetch ('ancestors', 'descendants', or 'both')
	 * @returns Observable with lineage response
	 */
	getEaLineage(
		id: number,
		direction: 'ancestors' | 'descendants' | 'both' = 'both'
	): Observable<EaLineageResponse> {
		let params = new HttpParams();
		params = params.set('direction', direction);

		return this.http
			.get<EaLineageResponse>(`${this.apiUrl}/${id}/lineage`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching EA lineage:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get complete EA history tree
	 * @param id - Enumeration area ID
	 * @returns Observable with history response
	 */
	getEaHistory(id: number): Observable<EaHistoryResponse> {
		return this.http.get<EaHistoryResponse>(`${this.apiUrl}/${id}/history`).pipe(
			catchError((error) => {
				console.error('Error fetching EA history:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get all active enumeration areas
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include sub-administrative zones (default: false)
	 * @returns Observable with array of active enumeration areas
	 */
	getActiveEas(
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http
			.get<EnumerationArea[]>(`${this.apiUrl}/active`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching active enumeration areas:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all inactive enumeration areas
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include sub-administrative zones (default: false)
	 * @returns Observable with array of inactive enumeration areas
	 */
	getInactiveEas(
		withGeom: boolean = false,
		includeSubAdminZone: boolean = false
	): Observable<EnumerationArea[]> {
		let params = new HttpParams();
		if (withGeom) params = params.set('withGeom', 'true');
		if (includeSubAdminZone)
			params = params.set('includeSubAdminZone', 'true');

		return this.http
			.get<EnumerationArea[]>(`${this.apiUrl}/inactive`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching inactive enumeration areas:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all split enumeration areas (paginated)
	 * Returns a paginated list of all enumeration areas that were split (parent EAs in SPLIT operations)
	 * @param page - Page number (default: 1)
	 * @param limit - Items per page (default: 10, max: 100)
	 * @param sortBy - Field to sort by (default: 'operationDate')
	 * @param sortOrder - Sort order 'ASC' or 'DESC' (default: 'DESC')
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include sub-administrative zones (default: false)
	 * @returns Observable with paginated response of split enumeration areas
	 */
	getSplitEAs(
		page: number = 1,
		limit: number = 10,
		sortBy: string = 'operationDate',
		sortOrder: 'ASC' | 'DESC' = 'DESC',
		
	): Observable<PaginatedResponse<EnumerationArea>> {
		let params = new HttpParams();
		params = params.set('page', page.toString());
		params = params.set('limit', Math.min(limit, 100).toString());
		params = params.set('sortBy', sortBy);
		params = params.set('sortOrder', sortOrder);
		
		return this.http
			.get<PaginatedResponse<EnumerationArea>>(`${this.apiUrl}/split/paginated/all`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching split enumeration areas:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all merged enumeration areas (paginated)
	 * Returns a paginated list of all enumeration areas that were created through merge operations (child EAs in MERGE operations)
	 * @param page - Page number (default: 1)
	 * @param limit - Items per page (default: 10, max: 100)
	 * @param sortBy - Field to sort by (default: 'operationDate')
	 * @param sortOrder - Sort order 'ASC' or 'DESC' (default: 'DESC')
	 * @param withGeom - Include geometry (default: false)
	 * @param includeSubAdminZone - Include sub-administrative zones (default: false)
	 * @returns Observable with paginated response of merged enumeration areas
	 */
	getMergedEAs(
		page: number = 1,
		limit: number = 10,
		sortBy: string = 'operationDate',
		sortOrder: 'ASC' | 'DESC' = 'DESC',
		 
	): Observable<PaginatedResponse<EnumerationArea>> {
		let params = new HttpParams();
		params = params.set('page', page.toString());
		params = params.set('limit', Math.min(limit, 100).toString());
		params = params.set('sortBy', sortBy);
		params = params.set('sortOrder', sortOrder);
		 

		return this.http
			.get<PaginatedResponse<EnumerationArea>>(`${this.apiUrl}/merge/paginated/all`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching merged enumeration areas:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all RBA (Royal Bhutan Army) EAs – active with isRBA: true, paginated.
	 * Query: page, limit, sortBy, sortOrder, includeSubAdminZone (optional), search (optional – filter by dzongkhag code, EA name, description).
	 */
	findAllRbaPaginated(
		page: number = 1,
		limit: number = 10,
		sortBy: string = 'name',
		sortOrder: 'ASC' | 'DESC' = 'ASC',
		includeSubAdminZone: boolean = true,
		search?: string
	): Observable<PaginatedResponse<EnumerationArea>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('limit', Math.min(limit, 100).toString())
			.set('sortBy', sortBy)
			.set('sortOrder', sortOrder);
		if (includeSubAdminZone) params = params.set('includeSubAdminZone', 'true');
		if (search?.trim()) params = params.set('search', search.trim());

		return this.http
			.get<PaginatedResponse<EnumerationArea>>(`${this.apiUrl}/rba/paginated/all`, { params })
			.pipe(
				catchError((error) => {
					console.error('Error fetching RBA EAs:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get urban RBA EAs (Thromde), paginated.
	 * Optional search: filter by dzongkhag code, EA name, description.
	 */
	findAllUrbanRbaPaginated(
		page: number = 1,
		limit: number = 10,
		sortBy: string = 'name',
		sortOrder: 'ASC' | 'DESC' = 'ASC',
		includeSubAdminZone: boolean = true,
		search?: string
	): Observable<PaginatedResponse<EnumerationArea>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('limit', Math.min(limit, 100).toString())
			.set('sortBy', sortBy)
			.set('sortOrder', sortOrder);
		if (includeSubAdminZone) params = params.set('includeSubAdminZone', 'true');
		if (search?.trim()) params = params.set('search', search.trim());

		return this.http
			.get<PaginatedResponse<EnumerationArea>>(`${this.apiUrl}/rba/urban/paginated/all`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching urban RBA EAs:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get rural RBA EAs (Gewog), paginated.
	 * Optional search: filter by dzongkhag code, EA name, description.
	 */
	findAllRuralRbaPaginated(
		page: number = 1,
		limit: number = 10,
		sortBy: string = 'name',
		sortOrder: 'ASC' | 'DESC' = 'ASC',
		includeSubAdminZone: boolean = true,
		search?: string
	): Observable<PaginatedResponse<EnumerationArea>> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('limit', Math.min(limit, 100).toString())
			.set('sortBy', sortBy)
			.set('sortOrder', sortOrder);
		if (includeSubAdminZone) params = params.set('includeSubAdminZone', 'true');
		if (search?.trim()) params = params.set('search', search.trim());

		return this.http
			.get<PaginatedResponse<EnumerationArea>>(`${this.apiUrl}/rba/rural/paginated/all`, {
				params,
			})
			.pipe(
				catchError((error) => {
					console.error('Error fetching rural RBA EAs:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Mark enumeration area as RBA (sensitive).
	 */
	markAsRba(id: number): Observable<ApiResponse<EnumerationArea>> {
		return this.http
			.patch<ApiResponse<EnumerationArea>>(`${this.apiUrl}/${id}/mark-rba`, {})
			.pipe(
				catchError((error) => {
					console.error('Error marking EA as RBA:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Unmark enumeration area as RBA.
	 */
	unmarkAsRba(id: number): Observable<ApiResponse<EnumerationArea>> {
		return this.http
			.patch<ApiResponse<EnumerationArea>>(`${this.apiUrl}/${id}/unmark-rba`, {})
			.pipe(
				catchError((error) => {
					console.error('Error unmarking EA as RBA:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download all RBA enumeration areas as Excel.
	 */
	downloadRbaExcel(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/rba/excel`, { responseType: 'blob' })
			.pipe(
				catchError((error) => {
					console.error('Error downloading RBA Excel:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Urban RBA enumeration areas as Excel.
	 */
	downloadUrbanRbaExcel(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/rba/urban/excel`, { responseType: 'blob' })
			.pipe(
				catchError((error) => {
					console.error('Error downloading Urban RBA Excel:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Download Rural RBA enumeration areas as Excel.
	 */
	downloadRuralRbaExcel(): Observable<Blob> {
		return this.http
			.get(`${this.apiUrl}/rba/rural/excel`, { responseType: 'blob' })
			.pipe(
				catchError((error) => {
					console.error('Error downloading Rural RBA Excel:', error);
					return throwError(() => error);
				})
			);
	}
}
