import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../dataservice/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);

	// Skip token addition for auth endpoints to avoid circular calls
	const isAuthEndpoint =
		req.url.includes('/auth/login') ||
		req.url.includes('/auth/register') ||
		req.url.includes('/auth/refresh') ||
		req.url.includes('/auth/forgot-password');

	let authReq = req;

	// Add token to request if user is authenticated and it's not an auth endpoint
	if (!isAuthEndpoint && authService.isAuthenticated()) {
		const token = authService.getToken();
		console.log('ADDING TOKEN TO REQUEST:', token);
		if (token) {
			authReq = req.clone({
				setHeaders: {
					Authorization: `Bearer ${token}`,
				},
			});
		}
	} else {
		console.log(
			'Skipping token addition - isAuthEndpoint:',
			isAuthEndpoint,
			'isAuthenticated:',
			authService.isAuthenticated()
		);
	}

	return next(authReq).pipe(
		catchError((error: HttpErrorResponse) => {
			console.log('HTTP Error:', error.status, error.url);

			// Handle 401 Unauthorized responses
			if (error.status === 401 && !isAuthEndpoint) {
				console.log('401 Unauthorized - forcing logout');
				authService.forceLogout();
			}

			// Handle 403 Forbidden responses
			if (error.status === 403) {
				console.error(
					'Access forbidden. User may not have sufficient permissions.'
				);
			}

			return throwError(() => error);
		})
	);
};
