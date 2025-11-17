import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthDataService } from './auth.api';
import {
	AuthState,
	LoginDto,
	LoginResponse,
	RegisterDto,
	ChangePasswordDto,
	CreateSupervisorDto,
	CreateEnumeratorDto,
	UpdateUserDto,
	User,
	UserRole,
	AdminSignupDto,
	Supervisor,
} from './auth.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly TOKEN_KEY = 'auth_token';
	private readonly USER_KEY = 'auth_user';

	private authStateSubject = new BehaviorSubject<AuthState>({
		isAuthenticated: false,
		user: null,
		token: null,
	});

	public authState$ = this.authStateSubject.asObservable();

	constructor(
		private authDataService: AuthDataService,
		private router: Router
	) {
		this.initializeAuthState();
	}

	// ========================
	// COMMON AUTH METHODS
	// ========================

	/**
	 * Initialize authentication state from localStorage
	 */
	private initializeAuthState(): void {
		const token = this.getStoredToken();
		const user = this.getStoredUser();

		if (token && user) {
			this.authStateSubject.next({
				isAuthenticated: true,
				user,
				token,
			});
		}
	}

	/**
	 * Login user
	 * @param loginDto - Login credentials
	 * @returns Observable<LoginResponse>
	 */
	login(loginDto: LoginDto): Observable<LoginResponse> {
		return this.authDataService.login(loginDto).pipe(
			tap((response) => {
				if (response.token && response.user) {
					this.setAuthData(response.token, response.user);
					this.authStateSubject.next({
						isAuthenticated: true,
						user: response.user,
						token: response.token,
					});
				}
			}),
			catchError((error) => throwError(() => error))
		);
	}

	/**
	 * Register user
	 * @param registerDto - Registration data
	 * @returns Observable<LoginResponse>
	 */
	register(registerDto: RegisterDto): Observable<LoginResponse> {
		return this.authDataService.register(registerDto).pipe(
			tap((response) => {
				if (response.token && response.user) {
					this.setAuthData(response.token, response.user);
					this.authStateSubject.next({
						isAuthenticated: true,
						user: response.user,
						token: response.token,
					});
				}
			}),
			catchError((error) => throwError(() => error))
		);
	}

	/**
	 * Get current user profile
	 * @returns Observable<User>
	 */
	getProfile(): Observable<User> {
		return this.authDataService.getProfile().pipe(
			tap((user) => {
				// Update stored user data
				const currentState = this.authStateSubject.value;
				this.setAuthData(currentState.token!, user);
				this.authStateSubject.next({
					...currentState,
					user,
				});
			}),
			catchError((error) => throwError(() => error))
		);
	}

	/**
	 * Change password
	 * @param changePasswordDto - Change password data
	 * @returns Observable<any>
	 */
	changePassword(changePasswordDto: ChangePasswordDto): Observable<any> {
		return this.authDataService.changePassword(changePasswordDto);
	}

	/**
	 * Sign out user
	 * @returns Observable<any>
	 */
	signOut(): Observable<any> {
		return this.authDataService.signOut().pipe(
			tap(() => {
				this.clearAuthData();
				this.router.navigate(['/auth/login']);
			}),
			catchError((error) => {
				// Even if server signOut fails, clear local auth data
				this.clearAuthData();
				this.router.navigate(['/auth/login']);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Force logout without server call (for token expiration, etc.)
	 */
	forceLogout(): void {
		this.clearAuthData();
		this.router.navigate(['/auth/login']);
	}

	// ========================
	// USER MANAGEMENT METHODS
	// ========================

	/**
	 * Get all users with optional role filter
	 * @param role - Optional role filter
	 * @returns Observable<User[]>
	 */
	getAllUsers(role?: UserRole): Observable<User[]> {
		return this.authDataService.getAllUsers(role);
	}

	/**
	 * Get user by ID
	 * @param userId - User ID
	 * @returns Observable<User>
	 */
	getUserById(userId: number): Observable<User> {
		return this.authDataService.getUserById(userId);
	}

	/**
	 * Update user
	 * @param userId - User ID
	 * @param updateUserDto - Update data
	 * @returns Observable<User>
	 */
	updateUser(userId: number, updateUserDto: UpdateUserDto): Observable<User> {
		return this.authDataService.updateUser(userId, updateUserDto);
	}

	/**
	 * Delete user (Admin only)
	 * @param userId - User ID
	 * @returns Observable<any>
	 */
	deleteUser(userId: number): Observable<any> {
		return this.authDataService.deleteUser(userId);
	}

	// ========================
	// SUPERVISOR SPECIFIC METHODS
	// ========================

	/**
	 * Get all supervisors (Admin only)
	 * @returns Observable<User[]>
	 */
	getAllSupervisors(): Observable<User[]> {
		return this.authDataService.getAllSupervisors();
	}

	/**
	 * Get all supervisors with their assigned dzongkhags (Admin only)
	 * @returns Observable<Supervisor[]>
	 */
	getAllSupervisorsWithDzongkhags(): Observable<Supervisor[]> {
		return this.authDataService.getAllSupervisorsWithDzongkhags();
	}

	/**
	 * Create supervisor (Admin only)
	 * @param createSupervisorDto - Supervisor data
	 * @returns Observable<User>
	 */
	createSupervisor(createSupervisorDto: CreateSupervisorDto): Observable<User> {
		return this.authDataService.createSupervisor(createSupervisorDto);
	}

	/**
	 * Get all enumerators (Admin, Supervisor)
	 * @returns Observable<User[]>
	 */
	getAllEnumerators(): Observable<User[]> {
		return this.authDataService.getAllEnumerators();
	}

	/**
	 * Create enumerator (Admin, Supervisor)
	 * @param createEnumeratorDto - Enumerator data
	 * @returns Observable<User>
	 */
	createEnumerator(createEnumeratorDto: CreateEnumeratorDto): Observable<User> {
		return this.authDataService.createEnumerator(createEnumeratorDto);
	}

	// ========================
	// SUPERVISOR-DZONGKHAG ASSIGNMENT METHODS
	// ========================

	/**
	 * Assign dzongkhags to supervisor (Admin only)
	 * @param supervisorId - Supervisor ID
	 * @param dzongkhagIds - Array of dzongkhag IDs to assign
	 * @returns Observable<AssignDzongkhagResponse>
	 */
	assignDzongkhagsToSupervisor(
		supervisorId: number,
		dzongkhagIds: number[]
	): Observable<any> {
		return this.authDataService.assignDzongkhagsToSupervisor(supervisorId, {
			dzongkhagIds,
		});
	}

	/**
	 * Remove dzongkhag assignments from supervisor (Admin only)
	 * @param supervisorId - Supervisor ID
	 * @param dzongkhagIds - Array of dzongkhag IDs to remove
	 * @returns Observable<RemoveDzongkhagResponse>
	 */
	removeDzongkhagsFromSupervisor(
		supervisorId: number,
		dzongkhagIds: number[]
	): Observable<any> {
		return this.authDataService.removeDzongkhagsFromSupervisor(supervisorId, {
			dzongkhagIds,
		});
	}

	/**
	 * Get dzongkhag assignments for a supervisor
	 * @param supervisorId - Supervisor ID
	 * @returns Observable<SupervisorDzongkhagAssignment[]>
	 */
	getSupervisorDzongkhagAssignments(supervisorId: number): Observable<any[]> {
		return this.authDataService.getSupervisorDzongkhagAssignments(supervisorId);
	}

	// ========================
	// AUTH STATE & UTILITY METHODS
	// ========================

	/**
	 * Check if user is authenticated
	 * @returns boolean
	 */
	isAuthenticated(): boolean {
		return this.authStateSubject.value.isAuthenticated;
	}

	/**
	 * Get current user
	 * @returns User | null
	 */
	getCurrentUser(): User | null {
		return this.authStateSubject.value.user;
	}

	/**
	 * Get current token
	 * @returns string | null
	 */
	getToken(): string | null {
		return this.authStateSubject.value.token;
	}

	/**
	 * Check if user has specific role
	 * @param role - UserRole
	 * @returns boolean
	 */
	hasRole(role: UserRole): boolean {
		const user = this.getCurrentUser();
		return user ? user.role === role : false;
	}

	/**
	 * Check if user has any of the specified roles
	 * @param roles - Array of UserRole
	 * @returns boolean
	 */
	hasAnyRole(roles: UserRole[]): boolean {
		const user = this.getCurrentUser();
		return user ? roles.includes(user.role) : false;
	}

	/**
	 * Check if user is admin
	 * @returns boolean
	 */
	isAdmin(): boolean {
		return this.hasRole(UserRole.ADMIN);
	}

	/**
	 * Check if user is supervisor
	 * @returns boolean
	 */
	isSupervisor(): boolean {
		return this.hasRole(UserRole.SUPERVISOR);
	}

	/**
	 * Check if user is enumerator
	 * @returns boolean
	 */
	isEnumerator(): boolean {
		return this.hasRole(UserRole.ENUMERATOR);
	}

	/**
	 * Check if user can manage enumerators (Admin or Supervisor)
	 * @returns boolean
	 */
	canManageEnumerators(): boolean {
		return this.hasAnyRole([UserRole.ADMIN, UserRole.SUPERVISOR]);
	}

	/**
	 * Check if user can manage supervisors (Admin only)
	 * @returns boolean
	 */
	canManageSupervisors(): boolean {
		return this.isAdmin();
	}

	/**
	 * Check if user can manage all users (Admin only)
	 * @returns boolean
	 */
	canManageAllUsers(): boolean {
		return this.isAdmin();
	}

	// ========================
	// LEGACY METHODS (for backward compatibility)
	// ========================

	/**
	 * Legacy logout method
	 * @returns Observable<any>
	 */
	logout(): Observable<any> {
		return this.signOut();
	}

	/**
	 * Admin signup (Legacy)
	 * @param adminSignupDto - Admin signup data
	 * @returns Observable<any>
	 */
	adminSignup(adminSignupDto: AdminSignupDto): Observable<any> {
		return this.authDataService.adminSignup(adminSignupDto);
	}

	/**
	 * Refresh authentication token (legacy)
	 * @returns Observable<LoginResponse>
	 */
	refreshToken(): Observable<LoginResponse> {
		return this.authDataService.refreshToken().pipe(
			tap((response) => {
				if (response.token && response.user) {
					this.setAuthData(response.token, response.user);
					this.authStateSubject.next({
						isAuthenticated: true,
						user: response.user,
						token: response.token,
					});
				}
			}),
			catchError((error) => {
				this.forceLogout();
				return throwError(() => error);
			})
		);
	}

	// ========================
	// PRIVATE HELPER METHODS
	// ========================

	/**
	 * Store authentication data
	 * @param token - JWT token
	 * @param user - User data
	 */
	private setAuthData(token: string, user: User): void {
		try {
			localStorage.setItem(this.TOKEN_KEY, token);
			localStorage.setItem(this.USER_KEY, JSON.stringify(user));
		} catch (error) {
			console.error('Error storing auth data:', error);
		}
	}

	/**
	 * Clear authentication data
	 */
	private clearAuthData(): void {
		try {
			localStorage.removeItem(this.TOKEN_KEY);
			localStorage.removeItem(this.USER_KEY);

			this.authStateSubject.next({
				isAuthenticated: false,
				user: null,
				token: null,
			});
		} catch (error) {
			console.error('Error clearing auth data:', error);
		}
	}

	/**
	 * Get stored token
	 * @returns string | null
	 */
	private getStoredToken(): string | null {
		try {
			return localStorage.getItem(this.TOKEN_KEY);
		} catch (error) {
			console.error('Error getting stored token:', error);
			return null;
		}
	}

	/**
	 * Get stored user
	 * @returns User | null
	 */
	private getStoredUser(): User | null {
		try {
			const userStr = localStorage.getItem(this.USER_KEY);
			return userStr ? JSON.parse(userStr) : null;
		} catch (error) {
			console.error('Error getting stored user:', error);
			return null;
		}
	}
}
