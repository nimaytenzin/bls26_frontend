import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthDataService } from './auth.api';
import {
	AuthState,
	LoginDto,
	LoginResponse,
	User,
	UserRole,
	AdminSignupDto,
	AdminSignupResponse,
} from './auth.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private readonly TOKEN_KEY = 'auth_token';
	private readonly USER_KEY = 'auth_user';
	private readonly REFRESH_TOKEN_KEY = 'refresh_token';

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
	 * Logout user
	 * @returns Observable<any>
	 */
	logout(): Observable<any> {
		this.clearAuthData();
		this.router.navigate(['/auth/login']);
		return new Observable((observer) => {
			observer.next(null);
			observer.complete();
		});
	}

	/**
	 * Force logout without server call (for token expiration, etc.)
	 */
	forceLogout(): void {
		this.clearAuthData();
		this.router.navigate(['/auth/login']);
	}

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
	 * Check if user is manager
	 * @returns boolean
	 */
	isTheatreManager(): boolean {
		return this.hasRole(UserRole.THEATRE_MANAGER);
	}

	/**
	 * Check if user is customer
	 * @returns boolean
	 */
	isCustomer(): boolean {
		return this.hasRole(UserRole.CUSTOMER);
	}

	/**
	 * Check if user is customer
	 * @returns boolean
	 */
	isCounterStaff(): boolean {
		return this.hasRole(UserRole.COUNTER_STAFF);
	}

	/**
	 * Refresh authentication token
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

	/**
	 * Verify token validity
	 * @returns Observable<boolean>
	 */
	verifyToken(): Observable<boolean> {
		return this.authDataService.verifyToken().pipe(
			map(() => true),
			catchError(() => {
				this.forceLogout();
				return throwError(() => false);
			})
		);
	}

	/**
	 * Admin signup - Create new user (admin only)
	 * @param adminSignupDto - Admin signup data
	 * @returns Observable<AdminSignupResponse>
	 */
	adminSignup(adminSignupDto: AdminSignupDto): Observable<AdminSignupResponse> {
		return this.authDataService.adminSignup(adminSignupDto).pipe(
			tap((response) => {
				// Admin signup doesn't automatically log in the new user
				// The current admin remains logged in
			}),
			catchError((error) => throwError(() => error))
		);
	}

	/**
	 * Change password
	 * @param changePasswordData - Change password data
	 * @returns Observable<any>
	 */
	changePassword(changePasswordData: {
		currentPassword: string;
		newPassword: string;
	}): Observable<any> {
		return this.authDataService.changePassword(changePasswordData);
	}

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
			localStorage.removeItem(this.REFRESH_TOKEN_KEY);

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
