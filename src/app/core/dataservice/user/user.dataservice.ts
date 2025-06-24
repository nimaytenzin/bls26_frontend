import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BASEAPI_URL } from '../../constants/constants';
import {
	User,
	CreateUserDto,
	UpdateUserDto,
	UserListResponse,
	UserQueryParams,
	UserRoleEnum,
	ApiResponse,
} from './user.interface';

@Injectable({
	providedIn: 'root',
})
export class UserDataService {
	private readonly apiUrl = `${BASEAPI_URL}/users`;

	constructor(private http: HttpClient) {}

	/**
	 * Get all users with optional filters
	 */
	findAllUsers(params?: UserQueryParams): Observable<UserListResponse> {
		let httpParams = new HttpParams();

		if (params) {
			if (params.page !== undefined)
				httpParams = httpParams.set('page', params.page.toString());
			if (params.limit !== undefined)
				httpParams = httpParams.set('limit', params.limit.toString());
			if (params.role) httpParams = httpParams.set('role', params.role);
			if (params.isVerified !== undefined)
				httpParams = httpParams.set('isVerified', params.isVerified.toString());
			if (params.hasLoginAccess !== undefined)
				httpParams = httpParams.set(
					'hasLoginAccess',
					params.hasLoginAccess.toString()
				);
			if (params.search) httpParams = httpParams.set('search', params.search);
		}

		return this.http
			.get<UserListResponse>(this.apiUrl, { params: httpParams })
			.pipe(
				catchError((error) => {
					console.error('Error fetching users:', error);
					return throwError(() => error);
				})
			);
	}

	/**
	 * Get all producers
	 */
	findAllProducers(): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/producers`).pipe(
			catchError((error) => {
				console.error('Error fetching users:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get user by ID
	 */
	findUserById(id: number): Observable<ApiResponse<User>> {
		return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Error fetching user:', error);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Get users by role
	 */
	findUsersByRole(role: UserRoleEnum): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/role/${role}`).pipe(
			catchError((error) => {
				console.error('Error fetching users by role:', error);
				return throwError(() => error);
			})
		);
	}
}
