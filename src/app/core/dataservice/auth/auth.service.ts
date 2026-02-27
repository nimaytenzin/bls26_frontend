import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
	User,
	UserRole,
	LoginDto,
	RegisterDto,
	AuthResponse,
	CreateUserDto,
	UpdateProfileDto,
	ChangePasswordDto,
	ResetPasswordDto,
	BulkEnumeratorsDto,
	BulkEnumeratorsResponse,
} from './auth.interface';

const TOKEN_KEY = 'livability_token';
const USER_KEY = 'livability_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly baseUrl = `${environment.BASEAPI_URL}/auth`;
	private currentUser$ = new BehaviorSubject<User | null>(this.getStoredUser());
	private token: string | null = this.getStoredToken();

	constructor(private http: HttpClient) {}

	// --- Public (no auth) ---
	login(dto: LoginDto): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.baseUrl}/login`, dto).pipe(
			tap((res) => {
				this.setSession(res.token, res.user);
			})
		);
	}

	register(dto: RegisterDto): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.baseUrl}/register`, dto).pipe(
			tap((res) => {
				this.setSession(res.token, res.user);
			})
		);
	}

	// --- Protected (authenticated) ---
	getProfile(): Observable<User> {
		return this.http.get<User>(`${this.baseUrl}/profile`).pipe(
			tap((user) => {
				this.currentUser$.next(user);
				this.setStoredUser(user);
			})
		);
	}

	updateProfile(dto: UpdateProfileDto): Observable<User> {
		return this.http.patch<User>(`${this.baseUrl}/profile`, dto).pipe(
			tap((user) => {
				this.currentUser$.next(user);
				this.setStoredUser(user);
			})
		);
	}

	changePassword(dto: ChangePasswordDto): Observable<unknown> {
		return this.http.post(`${this.baseUrl}/change-password`, dto);
	}

	signOut(): void {
		this.http.post(`${this.baseUrl}/signout`, {}).subscribe({ error: () => {} });
		this.clearSession();
	}

	// --- Admin: users list ---
	getUsers(role?: UserRole): Observable<User[]> {
		let params = new HttpParams();
		if (role) params = params.set('role', role);
		return this.http.get<User[]>(`${this.baseUrl}/users`, { params });
	}

	getAdmins(): Observable<User[]> {
		return this.http.get<User[]>(`${this.baseUrl}/admins`);
	}

	getEnumerators(): Observable<User[]> {
		return this.http.get<User[]>(`${this.baseUrl}/enumerators`);
	}

	getUserById(id: number): Observable<User> {
		return this.http.get<User>(`${this.baseUrl}/users/${id}`);
	}

	// --- Admin: create ---
	createUser(dto: CreateUserDto): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.baseUrl}/users`, dto);
	}

	createAdmin(dto: CreateUserDto): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.baseUrl}/admins`, {
			...dto,
			role: 'ADMIN',
		});
	}

	createEnumerator(dto: CreateUserDto): Observable<AuthResponse> {
		return this.http.post<AuthResponse>(`${this.baseUrl}/enumerators`, {
			...dto,
			role: 'ENUMERATOR',
		});
	}

	bulkCreateEnumerators(dto: BulkEnumeratorsDto): Observable<BulkEnumeratorsResponse> {
		return this.http.post<BulkEnumeratorsResponse>(
			`${this.baseUrl}/enumerators/bulk`,
			dto
		);
	}

	// --- Admin: update / reset / activate / deactivate / delete ---
	updateUser(id: number, dto: UpdateProfileDto): Observable<User> {
		return this.http.patch<User>(`${this.baseUrl}/users/${id}`, dto);
	}

	adminResetPassword(id: number, dto: ResetPasswordDto): Observable<unknown> {
		return this.http.patch(`${this.baseUrl}/users/${id}/reset-password`, dto);
	}

	activateUser(id: number): Observable<{ user: User; message?: string }> {
		return this.http
			.patch<{ user: User; message?: string }>(
				`${this.baseUrl}/users/${id}/activate`,
				{}
			)
			.pipe(
				tap((res) => {
					const current = this.currentUser$.value;
					if (current?.id === id) {
						this.currentUser$.next(res.user);
						this.setStoredUser(res.user);
					}
				})
			);
	}

	deactivateUser(id: number): Observable<{ user: User; message?: string }> {
		return this.http
			.patch<{ user: User; message?: string }>(
				`${this.baseUrl}/users/${id}/deactivate`,
				{}
			)
			.pipe(
				tap((res) => {
					const current = this.currentUser$.value;
					if (current?.id === id) {
						this.currentUser$.next(res.user);
						this.setStoredUser(res.user);
					}
				})
			);
	}

	deleteUser(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/users/${id}`).pipe(
			tap(() => {
				const current = this.currentUser$.value;
				if (current?.id === id) this.clearSession();
			})
		);
	}

	// --- Helpers ---
	getToken(): string | null {
		return this.token;
	}

	getCurrentUser(): User | null {
		return this.currentUser$.value;
	}

	getCurrentUser$(): Observable<User | null> {
		return this.currentUser$.asObservable();
	}

	isAuthenticated(): boolean {
		return !!this.token;
	}

	isAdmin(): boolean {
		return this.currentUser$.value?.role === 'ADMIN';
	}

	isEnumerator(): boolean {
		return this.currentUser$.value?.role === 'ENUMERATOR';
	}

	forceLogout(): void {
		this.clearSession();
	}

	getAllUsers(role: UserRole): Observable<User[]> {
		if (role === 'ADMIN') return this.getAdmins();
		return this.getEnumerators();
	}

	private setSession(token: string, user: User): void {
		this.token = token;
		this.currentUser$.next(user);
		try {
			localStorage.setItem(TOKEN_KEY, token);
			localStorage.setItem(USER_KEY, JSON.stringify(user));
		} catch {}
	}

	private clearSession(): void {
		this.token = null;
		this.currentUser$.next(null);
		try {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
		} catch {}
	}

	private getStoredToken(): string | null {
		try {
			return localStorage.getItem(TOKEN_KEY);
		} catch {
			return null;
		}
	}

	private getStoredUser(): User | null {
		try {
			const raw = localStorage.getItem(USER_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}

	private setStoredUser(user: User): void {
		try {
			localStorage.setItem(USER_KEY, JSON.stringify(user));
		} catch {}
	}
}
