import { Injectable } from '@angular/core';
import {
	HttpClient,
	HttpErrorResponse,
	HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
	LoginDto,
	LoginResponse,
	RegisterDto,
	ChangePasswordDto,
	CreateSupervisorDto,
	CreateEnumeratorDto,
	UpdateUserDto,
	User,
	UserRole,
	ApiError,
	AssignDzongkhagDto,
	AssignDzongkhagResponse,
	RemoveDzongkhagResponse,
	SupervisorDzongkhagAssignment,
	Supervisor,
} from './auth.interface';
import { BASEAPI_URL } from '../../constants/constants';

@Injectable({
	providedIn: 'root',
})
export class AuthDataService {
	private readonly apiUrl = BASEAPI_URL + '/auth';

	constructor(private http: HttpClient) {}

	// ========================
	// COMMON AUTH ENDPOINTS
	// ========================

	/**
	 * Login user with email and password
	 * @param loginDto - Login credentials
	 * @returns Observable<LoginResponse>
	 */
	login(loginDto: LoginDto): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/login`, loginDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Register new user
	 * @param registerDto - Registration data
	 * @returns Observable<LoginResponse>
	 */
	register(registerDto: RegisterDto): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/register`, registerDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Get current user profile
	 * @returns Observable<User>
	 */
	getProfile(): Observable<User> {
		return this.http
			.get<User>(`${this.apiUrl}/profile`)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Change user password
	 * @param changePasswordDto - Change password data
	 * @returns Observable<any>
	 */
	changePassword(changePasswordDto: ChangePasswordDto): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/change-password`, changePasswordDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Sign out user
	 * @returns Observable<any>
	 */
	signOut(): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/signout`, {})
			.pipe(catchError(this.handleError));
	}

	// ========================
	// USER MANAGEMENT ENDPOINTS
	// ========================

	/**
	 * Get all users with optional role filter
	 * @param role - Optional role filter
	 * @returns Observable<User[]>
	 */
	getAllUsers(role?: UserRole): Observable<User[]> {
		let params = new HttpParams();
		if (role) {
			params = params.set('role', role);
		}
		return this.http
			.get<User[]>(`${this.apiUrl}/users`, { params })
			.pipe(catchError(this.handleError));
	}

	/**
	 * Get user by ID
	 * @param userId - User ID
	 * @returns Observable<User>
	 */
	getUserById(userId: number): Observable<User> {
		return this.http
			.get<User>(`${this.apiUrl}/users/${userId}`)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Update user
	 * @param userId - User ID
	 * @param updateUserDto - Update data
	 * @returns Observable<User>
	 */
	updateUser(userId: number, updateUserDto: UpdateUserDto): Observable<User> {
		return this.http
			.patch<User>(`${this.apiUrl}/users/${userId}`, updateUserDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Delete user (Admin only)
	 * @param userId - User ID
	 * @returns Observable<any>
	 */
	deleteUser(userId: number): Observable<any> {
		return this.http
			.delete(`${this.apiUrl}/users/${userId}`)
			.pipe(catchError(this.handleError));
	}

	// ========================
	// SUPERVISOR ENDPOINTS
	// ========================

	/**
	 * Get all supervisors (Admin only)
	 * @returns Observable<User[]>
	 */
	getAllSupervisors(): Observable<User[]> {
		return this.http
			.get<User[]>(`${this.apiUrl}/supervisors`)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Get all supervisors with their assigned dzongkhags (Admin only)
	 * @returns Observable<Supervisor[]>
	 */
	getAllSupervisorsWithDzongkhags(): Observable<Supervisor[]> {
		return this.http
			.get<Supervisor[]>(`${this.apiUrl}/supervisors/with-dzongkhags`)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Create supervisor (Admin only)
	 * @param createSupervisorDto - Supervisor data
	 * @returns Observable<User>
	 */
	createSupervisor(createSupervisorDto: CreateSupervisorDto): Observable<User> {
		return this.http
			.post<User>(`${this.apiUrl}/supervisors`, createSupervisorDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Get all enumerators (Admin, Supervisor)
	 * @returns Observable<User[]>
	 */
	getAllEnumerators(): Observable<User[]> {
		return this.http
			.get<User[]>(`${this.apiUrl}/enumerators`)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Create enumerator (Admin, Supervisor)
	 * @param createEnumeratorDto - Enumerator data
	 * @returns Observable<User>
	 */
	createEnumerator(createEnumeratorDto: CreateEnumeratorDto): Observable<User> {
		return this.http
			.post<User>(`${this.apiUrl}/enumerators`, createEnumeratorDto)
			.pipe(catchError(this.handleError));
	}

	// ========================
	// SUPERVISOR-DZONGKHAG ASSIGNMENT ENDPOINTS
	// ========================

	/**
	 * Assign dzongkhags to supervisor (Admin only)
	 * @param supervisorId - Supervisor ID
	 * @param assignDzongkhagDto - Dzongkhag IDs to assign
	 * @returns Observable<AssignDzongkhagResponse>
	 */
	assignDzongkhagsToSupervisor(
		supervisorId: number,
		assignDzongkhagDto: AssignDzongkhagDto
	): Observable<AssignDzongkhagResponse> {
		return this.http
			.post<AssignDzongkhagResponse>(
				`${this.apiUrl}/supervisors/${supervisorId}/dzongkhags`,
				assignDzongkhagDto
			)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Remove dzongkhag assignments from supervisor (Admin only)
	 * @param supervisorId - Supervisor ID
	 * @param assignDzongkhagDto - Dzongkhag IDs to remove
	 * @returns Observable<RemoveDzongkhagResponse>
	 */
	removeDzongkhagsFromSupervisor(
		supervisorId: number,
		assignDzongkhagDto: AssignDzongkhagDto
	): Observable<RemoveDzongkhagResponse> {
		return this.http
			.request<RemoveDzongkhagResponse>(
				'DELETE',
				`${this.apiUrl}/supervisors/${supervisorId}/dzongkhags`,
				{
					body: assignDzongkhagDto,
				}
			)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Get dzongkhag assignments for a supervisor
	 * @param supervisorId - Supervisor ID
	 * @returns Observable<SupervisorDzongkhagAssignment[]>
	 */
	getSupervisorDzongkhagAssignments(
		supervisorId: number
	): Observable<SupervisorDzongkhagAssignment[]> {
		return this.http
			.get<SupervisorDzongkhagAssignment[]>(
				`${this.apiUrl}/supervisors/${supervisorId}/dzongkhags`
			)
			.pipe(catchError(this.handleError));
	}

	// ========================
	// LEGACY ENDPOINTS (for backward compatibility)
	// ========================

	/**
	 * Admin signup (Legacy)
	 * @param adminSignupDto - Admin signup data
	 * @returns Observable<any>
	 */
	adminSignup(adminSignupDto: any): Observable<any> {
		return this.http
			.post(`${this.apiUrl}/admin/signup`, adminSignupDto)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Admin toggle login access (Legacy)
	 * @param userId - User ID
	 * @returns Observable<any>
	 */
	adminToggleLoginAccess(userId: number): Observable<any> {
		return this.http
			.patch(`${this.apiUrl}/admin/users/${userId}/toggle-access`, {})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Admin reset password (Legacy)
	 * @param userId - User ID
	 * @param resetPasswordData - Reset password data
	 * @returns Observable<any>
	 */
	adminResetPassword(userId: number, resetPasswordData: any): Observable<any> {
		return this.http
			.patch(
				`${this.apiUrl}/admin/users/${userId}/reset-password`,
				resetPasswordData
			)
			.pipe(catchError(this.handleError));
	}

	/**
	 * Refresh authentication token (legacy)
	 * @returns Observable<LoginResponse>
	 */
	refreshToken(): Observable<LoginResponse> {
		return this.http
			.post<LoginResponse>(`${this.apiUrl}/refresh`, {})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Verify token validity (legacy)
	 * @returns Observable<any>
	 */
	verifyToken(): Observable<any> {
		return this.http
			.get(`${this.apiUrl}/verify`)
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
						errorMessage = 'Access denied. Insufficient permissions.';
						break;
					case 404:
						errorMessage = 'Resource not found.';
						break;
					case 409:
						errorMessage = 'Conflict. Resource already exists.';
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
