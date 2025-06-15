import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoginDto, LoginResponse, ApiError } from './auth.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthDataService {
	private readonly apiUrl = '/api/auth';

	constructor(private http: HttpClient) {}

	/**
	 * Login user with phone number and password
	 * @param loginDto - Login credentials
	 * @returns Observable<LoginResponse>
	 */
	login(loginDto: LoginDto): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginDto).pipe(
			map((response) => {
				// Transform the response if needed
				return response;
			}),
			catchError(this.handleError)
		);
	}

	/**
	 * Logout user
	 * @returns Observable<any>
	 */
	logout(): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/logout`, {})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Refresh authentication token
	 * @returns Observable<LoginResponse>
	 */
	refreshToken(): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/refresh`, {})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Verify token validity
	 * @returns Observable<any>
	 */
	verifyToken(): Observable<any> {
		return this.http
			.get(`${this.apiUrl}/verify`)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Register new user
	 * @param registerDto - Registration data
	 * @returns Observable<any>
	 */
	register(registerDto: any): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/register`, registerDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Request password reset
	 * @param phoneNumber - User's phone number
	 * @returns Observable<any>
	 */
	forgotPassword(phoneNumber: number): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/forgot-password`, { phoneNumber })
			.pipe(catchError(this.handleError));
	}

	/**
	 * Reset password with token
	 * @param resetData - Reset password data
	 * @returns Observable<any>
	 */
	resetPassword(resetData: {
		token: string;
		newPassword: string;
	}): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/reset-password`, resetData)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Change user password
	 * @param changePasswordData - Change password data
	 * @returns Observable<any>
	 */
	changePassword(changePasswordData: {
		currentPassword: string;
		newPassword: string;
	}): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/change-password`, changePasswordData)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Handle HTTP errors
	 * @param error - HttpErrorResponse
	 * @returns Observable<never>
	 */
	private handleError(error: HttpErrorResponse): Observable<never> {
		let errorMessage = 'An unexpected error occurred';

		if (error.error instanceof ErrorEvent) {
			// Client-side error
			errorMessage = `Error: ${error.error.message}`;
		} else {
			// Server-side error
			if (error.error && error.error.message) {
				errorMessage = error.error.message;
			} else {
				switch (error.status) {
					case 400:
						errorMessage = 'Bad request. Please check your input.';
						break;
					case 401:
						errorMessage = 'Invalid credentials. Please try again.';
						break;
					case 403:
						errorMessage = 'Access denied. Please contact support.';
						break;
					case 404:
						errorMessage = 'Service not found.';
						break;
					case 500:
						errorMessage = 'Server error. Please try again later.';
						break;
					default:
						errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
				}
			}
		}

		console.error('Auth Data Service Error:', error);

		// Return an observable with the error
		return throwError(
			() =>
				({
					statusCode: error.status || 500,
					message: errorMessage,
					error: error.error,
				} as ApiError)
		);
	}
}
