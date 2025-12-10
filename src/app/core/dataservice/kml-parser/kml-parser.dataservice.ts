import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KMLPARSER_URL } from '../../constants/constants';
import {
	AutoKmlUploadRequest,
	AutoKmlUploadResponse,
} from './kml-parser.dto';

/**
 * KML Parser Data Service
 * Handles HTTP operations for auto KML upload workflow
 */
@Injectable({
	providedIn: 'root',
})
export class KmlParserDataService {
	private readonly apiUrl = KMLPARSER_URL;

	constructor(private http: HttpClient) {}

	/**
	 * Auto upload KML file - Complete workflow (convert, dissolve, create SAZ, upload EAs)
	 * @param request - Auto upload request containing file and zone information
	 * @returns Observable with auto upload results
	 */
	autoUploadKml(request: AutoKmlUploadRequest): Observable<AutoKmlUploadResponse> {
		const formData = new FormData();
		formData.append('kml_file', request.kmlFile);
		formData.append('apiBaseUrl', request.apiBaseUrl);
		formData.append('token', request.token);
		formData.append('administrativeZoneId', request.administrativeZoneId.toString());
		formData.append('sazName', request.sazName);
		formData.append('sazAreaCode', request.sazAreaCode);
		formData.append('sazType', request.sazType);

		return this.http
			.post<AutoKmlUploadResponse>(`${this.apiUrl}/auto-kml-upload`, formData)
			.pipe(
				catchError((error) => {
					console.error('Error auto uploading KML:', error);
					return throwError(() => error);
				})
			);
	}
}

