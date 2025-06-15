import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
	Language,
	CreateLanguageDto,
	ApiResponse,
	UpdateLanguageDto,
} from './language.interface';
import { BASEAPI_URL } from '../../constants/constants';

@Injectable({
	providedIn: 'root',
})
export class LanguageDataService {
	private readonly apiUrl = `${BASEAPI_URL}/languages`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all languages
	 */
	findAllLanguages(): Observable<Language[]> {
		return this.http.get<Language[]>(this.apiUrl).pipe(
			catchError((error) => {
				console.error('Error fetching languages:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Create new language
	 */
	createLanguage(
		languageData: CreateLanguageDto
	): Observable<ApiResponse<Language>> {
		return this.http
			.post<ApiResponse<Language>>(this.apiUrl, languageData)
			.pipe(
				catchError((error) => {
					console.error('Error creating language:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Update existing language
	 */
	updateLanguage(
		id: number,
		languageData: UpdateLanguageDto
	): Observable<ApiResponse<Language>> {
		return this.http
			.patch<ApiResponse<Language>>(`${this.apiUrl}/${id}`, languageData)
			.pipe(
				catchError((error) => {
					console.error('Error updating language:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Delete language
	 */
	deleteLanguage(id: number): Observable<ApiResponse<any>> {
		return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error deleting language:', error);
				return throwError(() => error);
			})
		);
	}
}
