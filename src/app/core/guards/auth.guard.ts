import { Injectable } from '@angular/core';
import {
	CanActivate,
	CanActivateChild,
	Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot,
} from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../dataservice/auth/auth.service';
import { UserRole } from '../dataservice/auth/auth.interface';

@Injectable({
	providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
	constructor(private authService: AuthService, private router: Router) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean> | Promise<boolean> | boolean {
		return this.checkAuth(route, state);
	}

	canActivateChild(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean> | Promise<boolean> | boolean {
		return this.checkAuth(route, state);
	}

	private checkAuth(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean> {
		return this.authService.authState$.pipe(
			take(1),
			map((authState) => {
				if (!authState.isAuthenticated) {
					this.router.navigate(['/auth/login'], {
						queryParams: { returnUrl: state.url },
					});
					return false;
				}

				const requiredRoles = route.data['roles'] as UserRole[];
				if (requiredRoles && requiredRoles.length > 0) {
					const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);

					if (!hasRequiredRole) {
						// Redirect to appropriate dashboard or show access denied
						if (this.authService.isCustomer()) {
							this.router.navigate(['/']);
						} else {
							this.router.navigate(['/access-denied']);
						}
						return false;
					}
				}

				return true;
			})
		);
	}
}

@Injectable({
	providedIn: 'root',
})
export class AdminGuard implements CanActivate {
	constructor(private authService: AuthService, private router: Router) {}

	canActivate(): Observable<boolean> {
		return this.authService.authState$.pipe(
			take(1),
			map((authState) => {
				if (!authState.isAuthenticated) {
					this.router.navigate(['/auth/login']);
					return false;
				}

				if (!this.authService.hasAnyRole([UserRole.ADMIN])) {
					this.router.navigate(['/']);
					return false;
				}

				return true;
			})
		);
	}
}
